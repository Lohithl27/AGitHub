import sqlite3
import json
import hashlib
import secrets

DB_FILE = 'data.db'

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            level INTEGER DEFAULT 1,
            xp INTEGER DEFAULT 0,
            badges TEXT DEFAULT '[]',
            progress TEXT DEFAULT '{}'
        )
    ''')
    conn.commit()
    conn.close()

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${key.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, stored_hex = stored_hash.split('$')
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return key.hex() == stored_hex
    except Exception:
        return False

def register_user(username, email, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    p_hash = hash_password(password)
    try:
        cursor.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            (username, email, p_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return user_id, None
    except sqlite3.IntegrityError as e:
        conn.close()
        # Determine if email or username is taken
        err_msg = str(e).lower()
        if 'email' in err_msg:
            return None, "Email address already registered."
        elif 'username' in err_msg:
            return None, "Username already taken."
        return None, "Registration failed: User credentials conflict."
    except Exception as e:
        conn.close()
        return None, str(e)

def authenticate_user(username_or_email, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Query user by username or email
    cursor.execute(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        (username_or_email, username_or_email)
    )
    user = cursor.fetchone()
    conn.close()
    if user and verify_password(password, user['password_hash']):
        return dict(user)
    return None

def get_user_profile(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, email, level, xp, badges, progress FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    if user:
        user_dict = dict(user)
        # Parse JSON fields
        user_dict['badges'] = json.loads(user_dict['badges'])
        user_dict['progress'] = json.loads(user_dict['progress'])
        return user_dict
    return None

def update_user_progress(user_id, level, xp, badges, progress):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Convert lists/dicts to JSON strings
    badges_str = json.dumps(badges)
    progress_str = json.dumps(progress)
    cursor.execute('''
        UPDATE users
        SET level = ?, xp = ?, badges = ?, progress = ?
        WHERE id = ?
    ''', (level, xp, badges_str, progress_str, user_id))
    conn.commit()
    conn.close()
    return True
