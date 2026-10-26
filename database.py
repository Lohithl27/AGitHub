"""
database.py — Supabase PostgreSQL backend + Google Sheets event logger
All credentials come from environment variables (set in Vercel dashboard).
"""
import os
import json
import hashlib
import secrets
import datetime

import psycopg2
import psycopg2.extras

# ── Supabase PostgreSQL connection ────────────────────────────────────────────
# Set DATABASE_URL in Vercel env vars:
#   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DATABASE_URL = os.environ.get('DATABASE_URL', '')

# Number of challenges in static/app.js (CHALLENGES array). Keep both in sync.
TOTAL_CHALLENGES = 13


def get_db_connection():
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL environment variable is not set. "
            "Add it in Vercel → Project Settings → Environment Variables."
        )
    # Supabase requires SSL — append sslmode=require if not already present
    url = DATABASE_URL
    if 'sslmode' not in url:
        sep = '&' if '?' in url else '?'
        url = url + sep + 'sslmode=require'
    conn = psycopg2.connect(url, cursor_factory=psycopg2.extras.RealDictCursor)
    return conn


def init_db():
    """Create tables if they don't exist. Safe to call on every cold start."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            level INTEGER DEFAULT 1,
            xp INTEGER DEFAULT 0,
            badges TEXT DEFAULT '[]',
            progress TEXT DEFAULT '{}'
        )
    ''')
    # Date the learner finished every challenge (shown on the certificate)
    cursor.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ')
    conn.commit()
    cursor.close()
    conn.close()


# ── Password helpers ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100_000)
    return f"{salt}${key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, stored_hex = stored_hash.split('$')
        key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100_000)
        return key.hex() == stored_hex
    except Exception:
        return False


# ── User operations ───────────────────────────────────────────────────────────

def register_user(username, email, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    p_hash = hash_password(password)
    try:
        cursor.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id',
            (username, email, p_hash)
        )
        user_id = cursor.fetchone()['id']
        conn.commit()
        cursor.close()
        conn.close()
        # Log new registration to Google Sheets
        log_to_sheets('REGISTRATION', username, email)
        return user_id, None
    except psycopg2.errors.UniqueViolation as e:
        conn.rollback()
        cursor.close()
        conn.close()
        msg = str(e)
        if 'email' in msg:
            return None, "Email address already registered."
        return None, "Username already taken."
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return None, str(e)


def authenticate_user(username_or_email, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM users WHERE username = %s OR email = %s',
        (username_or_email, username_or_email)
    )
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if user and verify_password(password, user['password_hash']):
        user_dict = dict(user)
        # Log successful login to Google Sheets
        log_to_sheets('LOGIN', user_dict['username'], user_dict['email'])
        return user_dict
    return None


def get_user_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT id, username, email, level, xp, badges, progress, completed_at FROM users WHERE id = %s',
        (user_id,)
    )
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    if user:
        user_dict = dict(user)
        # Parse JSON fields stored as text
        if isinstance(user_dict['badges'], str):
            user_dict['badges'] = json.loads(user_dict['badges'])
        if isinstance(user_dict['progress'], str):
            user_dict['progress'] = json.loads(user_dict['progress'])
        # JSON-friendly ISO timestamp (UTC), or None until everything is completed
        if user_dict.get('completed_at'):
            user_dict['completed_at'] = user_dict['completed_at'].isoformat()
        user_dict['total_challenges'] = TOTAL_CHALLENGES
        return user_dict
    return None


def update_user_progress(user_id, level, xp, badges, progress):
    conn = get_db_connection()
    cursor = conn.cursor()
    badges_str = json.dumps(badges)
    progress_str = json.dumps(progress)
    cursor.execute('''
        UPDATE users SET level = %s, xp = %s, badges = %s, progress = %s
        WHERE id = %s
    ''', (level, xp, badges_str, progress_str, user_id))
    conn.commit()

    # When every challenge is completed, stamp the completion date ONCE
    # (first time only) and log the certificate claim.
    progress_dict = progress if isinstance(progress, dict) else json.loads(progress)
    completed = sum(1 for v in progress_dict.values() if v == 'completed')
    if completed >= TOTAL_CHALLENGES:
        cursor.execute(
            'UPDATE users SET completed_at = NOW() WHERE id = %s AND completed_at IS NULL',
            (user_id,)
        )
        newly_completed = cursor.rowcount == 1
        conn.commit()
        if newly_completed:
            cursor.execute('SELECT username, email FROM users WHERE id = %s', (user_id,))
            u = cursor.fetchone()
            if u:
                cert_id = f"AGIT-{user_id}{xp}A"
                log_to_sheets('CERTIFICATE', u['username'], u['email'], cert_id)

    cursor.close()
    conn.close()
    return True


def update_username(user_id, new_username):
    """Change a learner's display name. Returns (ok, error_message)."""
    name = (new_username or '').strip()
    if not (3 <= len(name) <= 30):
        return False, "Username must be between 3 and 30 characters."
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'SELECT 1 FROM users WHERE LOWER(username) = LOWER(%s) AND id <> %s',
            (name, user_id)
        )
        if cursor.fetchone():
            return False, "That username is already taken."
        cursor.execute('UPDATE users SET username = %s WHERE id = %s', (name, user_id))
        conn.commit()
        return True, None
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return False, "That username is already taken."
    finally:
        cursor.close()
        conn.close()


# ── Google Sheets Logger ──────────────────────────────────────────────────────

def log_to_sheets(event_type: str, username: str, email: str, extra: str = ''):
    """
    Appends a row to the Google Sheet.
    Required env vars:
      SHEETS_SPREADSHEET_ID  — the ID from your Google Sheet URL
      GOOGLE_SERVICE_ACCOUNT — JSON string of the service account key file
    """
    spreadsheet_id = os.environ.get('SHEETS_SPREADSHEET_ID', '')
    service_account_json = os.environ.get('GOOGLE_SERVICE_ACCOUNT', '')

    if not spreadsheet_id or not service_account_json:
        # Not configured — skip, but say so in the logs so it is not a mystery
        missing = [n for n, v in (('SHEETS_SPREADSHEET_ID', spreadsheet_id),
                                  ('GOOGLE_SERVICE_ACCOUNT', service_account_json)) if not v]
        print(f"[Sheets Logger] Skipped {event_type}: missing env var(s): {', '.join(missing)}")
        return

    try:
        import google.auth
        from google.oauth2.service_account import Credentials
        from googleapiclient.discovery import build

        creds_info = json.loads(service_account_json)
        scopes = ['https://www.googleapis.com/auth/spreadsheets']
        creds = Credentials.from_service_account_info(creds_info, scopes=scopes)
        service = build('sheets', 'v4', credentials=creds, cache_discovery=False)

        now = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        row = [[now, event_type, username, email, extra]]

        service.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id,
            range='Sheet1!A:E',
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body={'values': row}
        ).execute()

    except Exception as ex:
        # Never crash the app due to logging failures
        print(f"[Sheets Logger] Failed to log event: {ex}")
