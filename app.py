"""
app.py — Local development server for Agithub.
Backend: Supabase PostgreSQL | Logging: Google Sheets
Run with: bash run.sh
"""
import os
from flask import Flask, request, jsonify, session
import database

app = Flask(__name__, static_folder='static', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'agithub-local-dev-secret-1234')

# Initialize Supabase DB on startup
database.init_db()


@app.route('/')
def serve_index():
    return app.send_static_file('index.html')


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


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
