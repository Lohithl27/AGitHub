"""
api/index.py — Vercel serverless entry point for the Agithub Flask app.
Backend: Supabase PostgreSQL | Logging: Google Sheets
"""
import os
import sys
import json
import secrets
import urllib.error
import urllib.parse
import urllib.request

# Make the parent directory importable (for database.py)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import database
from flask import Flask, request, jsonify, session, send_from_directory, redirect
from werkzeug.middleware.proxy_fix import ProxyFix

# Resolve static folder as an absolute path so Vercel can find it
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static')

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path='/static')
# Vercel terminates HTTPS in front of Flask; trust its forwarded headers so
# generated URLs (OAuth redirect URIs) use https and the real host name.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

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


# ── Real Google / GitHub sign-in (OAuth 2.0 authorization-code flow) ──────────
# Set these in Vercel → Settings → Environment Variables:
#   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
#   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# Optional: APP_BASE_URL (e.g. https://a-git-hub.vercel.app) to pin the redirect URL.
OAUTH_PROVIDERS = {
    'github': {
        'label': 'GitHub',
        'auth_url': 'https://github.com/login/oauth/authorize',
        'token_url': 'https://github.com/login/oauth/access_token',
        'scope': 'read:user user:email',
        'id_env': 'GITHUB_CLIENT_ID',
        'secret_env': 'GITHUB_CLIENT_SECRET',
    },
    'google': {
        'label': 'Google',
        'auth_url': 'https://accounts.google.com/o/oauth2/v2/auth',
        'token_url': 'https://oauth2.googleapis.com/token',
        'scope': 'openid email profile',
        'id_env': 'GOOGLE_CLIENT_ID',
        'secret_env': 'GOOGLE_CLIENT_SECRET',
    },
}


def _http_json(url, data=None, headers=None):
    """Small JSON-over-HTTPS helper (stdlib only)."""
    hdrs = {'Accept': 'application/json', 'User-Agent': 'agithub-app'}
    hdrs.update(headers or {})
    body = urllib.parse.urlencode(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=hdrs)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())


def _redirect_uri(provider):
    base = os.environ.get('APP_BASE_URL', '').rstrip('/') or request.url_root.rstrip('/')
    return f"{base}/api/oauth/{provider}/callback"


def _oauth_error(provider, code):
    return redirect('/?' + urllib.parse.urlencode({'oauth_error': code, 'provider': provider}))


def _find_or_create_oauth_user(email, username, provider):
    """Return the user id for this verified email, creating the account if new."""
    conn = database.get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('SELECT id, username FROM users WHERE LOWER(email) = LOWER(%s)', (email,))
        user = cursor.fetchone()
        if user:
            database.log_to_sheets('OAUTH_LOGIN', user['username'], email, provider)
            return user['id']

        # Random, never-shared password so this account cannot be entered
        # through the email/password form.
        p_hash = database.hash_password(secrets.token_urlsafe(32))
        base_name = (username or email.split('@')[0])[:40] or 'student'
        candidate = base_name
        for _ in range(10):
            cursor.execute('SELECT 1 FROM users WHERE username = %s', (candidate,))
            if not cursor.fetchone():
                break
            candidate = f"{base_name}_{secrets.randbelow(9000) + 1000}"
        cursor.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id',
            (candidate, email, p_hash)
        )
        user_id = cursor.fetchone()['id']
        conn.commit()
    finally:
        cursor.close()
        conn.close()
    database.log_to_sheets('OAUTH_REGISTRATION', candidate, email, provider)
    return user_id


@app.route('/api/oauth/<provider>/start')
def oauth_start(provider):
    cfg = OAUTH_PROVIDERS.get(provider)
    if not cfg:
        return jsonify({"success": False, "message": "Unknown provider."}), 404
    client_id = os.environ.get(cfg['id_env'], '')
    if not client_id or not os.environ.get(cfg['secret_env'], ''):
        return _oauth_error(provider, 'not_configured')

    state = secrets.token_urlsafe(24)
    session['oauth_state'] = state
    session['oauth_provider'] = provider
    params = {
        'client_id': client_id,
        'redirect_uri': _redirect_uri(provider),
        'scope': cfg['scope'],
        'state': state,
    }
    if provider == 'google':
        params['response_type'] = 'code'
        params['prompt'] = 'select_account'
    return redirect(cfg['auth_url'] + '?' + urllib.parse.urlencode(params))


@app.route('/api/oauth/<provider>/callback')
def oauth_callback(provider):
    cfg = OAUTH_PROVIDERS.get(provider)
    if not cfg:
        return jsonify({"success": False, "message": "Unknown provider."}), 404

    if request.args.get('error'):
        return _oauth_error(provider, 'cancelled')

    expected_state = session.pop('oauth_state', None)
    expected_provider = session.pop('oauth_provider', None)
    code = request.args.get('code', '')
    if (not code or not expected_state or expected_provider != provider
            or not secrets.compare_digest(request.args.get('state', ''), expected_state)):
        return _oauth_error(provider, 'failed')

    try:
        token_data = {
            'client_id': os.environ.get(cfg['id_env'], ''),
            'client_secret': os.environ.get(cfg['secret_env'], ''),
            'code': code,
            'redirect_uri': _redirect_uri(provider),
        }
        if provider == 'google':
            token_data['grant_type'] = 'authorization_code'
        token = _http_json(cfg['token_url'], data=token_data)
        access_token = token.get('access_token')
        if not access_token:
            return _oauth_error(provider, 'failed')
        auth = {'Authorization': f'Bearer {access_token}'}

        email, username = None, None
        if provider == 'github':
            gh = _http_json('https://api.github.com/user', headers=auth)
            username = gh.get('login')
            email = gh.get('email')
            if not email:
                emails = _http_json('https://api.github.com/user/emails', headers=auth)
                verified = [e for e in emails if e.get('verified')]
                primary = [e for e in verified if e.get('primary')]
                chosen = (primary or verified or [None])[0]
                email = chosen.get('email') if chosen else None
        else:
            info = _http_json('https://openidconnect.googleapis.com/v1/userinfo', headers=auth)
            if info.get('email_verified'):
                email = info.get('email')
            username = info.get('name') or (email.split('@')[0] if email else None)

        if not email:
            return _oauth_error(provider, 'no_email')

        user_id = _find_or_create_oauth_user(email.strip(), username, provider)
    except Exception as ex:  # network / provider / DB problems
        print(f"[OAuth] {provider} sign-in failed: {ex}")
        return _oauth_error(provider, 'failed')

    session['user_id'] = user_id
    return redirect('/')


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
