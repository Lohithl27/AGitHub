"""
api/index.py — Vercel serverless entry point for the Agithub Flask app.
Backend: Supabase PostgreSQL | Logging: Google Sheets
"""
import os
import sys

# Make the parent directory importable (for database.py)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database
from flask import Flask, request, jsonify, session, send_from_directory

# Resolve static folder as an absolute path so Vercel can find it
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static')

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path='/static')

# Secret key — set SECRET_KEY env var in Vercel dashboard
app.secret_key = os.environ.get('SECRET_KEY', 'agithub-change-this-in-production')

# Cookie-based sessions (no filesystem required on Vercel)
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Initialize DB tables — safe even if DATABASE_URL is missing (logs warning)
try:
    database.init_db()
except Exception as e:
    print(f"[WARN] DB init failed (check DATABASE_URL env var): {e}")


@app.route('/')
def serve_index():
    return send_from_directory(STATIC_DIR, 'index.html')


@app.route('/api/oauth-login', methods=['POST'])
def oauth_login():
    data = request.get_json() or {}
    provider = data.get('provider', '').strip()
    email = data.get('email', '').strip() or f"{provider}_user@gmail.com"
    username = data.get('username', '').strip() or f"{provider}_operator"

    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
    user = cursor.fetchone()

    if not user:
        p_hash = database.hash_password("oauth-placeholder-password")
        try:
            cursor.execute(
                'INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id',
                (username, email, p_hash)
            )
            user_id = cursor.fetchone()['id']
            conn.commit()
        except Exception:
            import random
            conn.rollback()
            username = f"{username}_{random.randint(100, 999)}"
            cursor.execute(
                'INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id',
                (username, email, p_hash)
            )
            user_id = cursor.fetchone()['id']
            conn.commit()
        database.log_to_sheets('OAUTH_LOGIN', username, email, provider)
    else:
        user_id = user['id']
        database.log_to_sheets('OAUTH_LOGIN', user['username'], user['email'], provider)

    cursor.close()
    conn.close()

    session['user_id'] = user_id
    profile = database.get_user_profile(user_id)
    return jsonify({"success": True, "message": f"Login with {provider.capitalize()} successful.", "user": profile})


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({"success": False, "message": "All fields are required."}), 400
    if len(password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters."}), 400

    user_id, error = database.register_user(username, email, password)
    if error:
        return jsonify({"success": False, "message": error}), 400

    session['user_id'] = user_id
    return jsonify({"success": True, "message": "Registration successful.", "user_id": user_id})


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username_or_email = data.get('username_or_email', '').strip()
    password = data.get('password', '')

    if not username_or_email or not password:
        return jsonify({"success": False, "message": "Username/Email and password are required."}), 400

    user = database.authenticate_user(username_or_email, password)
    if not user:
        return jsonify({"success": False, "message": "Invalid username/email or password."}), 401

    session['user_id'] = user['id']
    return jsonify({
        "success": True,
        "message": "Login successful.",
        "user": {"username": user['username'], "email": user['email'], "level": user['level'], "xp": user['xp']}
    })


@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({"success": True, "message": "Logged out successfully."})


@app.route('/api/profile', methods=['GET'])
def get_profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401
    profile = database.get_user_profile(user_id)
    if not profile:
        return jsonify({"success": False, "message": "User not found"}), 404
    return jsonify({"success": True, "profile": profile})


@app.route('/api/update-progress', methods=['POST'])
def update_progress():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    data = request.get_json() or {}
    level = data.get('level')
    xp = data.get('xp')
    badges = data.get('badges')
    progress = data.get('progress')

    if level is None or xp is None or badges is None or progress is None:
        return jsonify({"success": False, "message": "Missing progress parameters."}), 400

    success = database.update_user_progress(user_id, level, xp, badges, progress)
    if success:
        return jsonify({"success": True, "message": "Progress saved successfully."})
    return jsonify({"success": False, "message": "Failed to update progress."}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Quick health check — useful for debugging Vercel deployments."""
    db_ok = False
    try:
        conn = database.get_db_connection()
        conn.close()
        db_ok = True
    except Exception as e:
        return jsonify({"status": "degraded", "db": str(e)}), 200
    return jsonify({"status": "ok", "db": "connected"}), 200
