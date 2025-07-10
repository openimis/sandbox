import sqlite3
import json
import os
import requests
from flask import Flask, render_template, request, jsonify, g
from dotenv import load_dotenv

# --- App and Database Configuration ---
load_dotenv()
app = Flask(__name__)
app.secret_key = 'your_super_secret_key' 
DATABASE = 'notifications.db'

# --- Database Setup (Unchanged from previous version) ---
def init_db_if_not_exists():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          content TEXT NOT NULL
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY,
          criteria TEXT NOT NULL,
          status TEXT NOT NULL,
          openimis_url TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()
    print("Database tables checked and initialized if necessary.")

@app.cli.command('init-db')
def init_db_command():
    db = sqlite3.connect(DATABASE)
    cursor = db.cursor()
    cursor.execute("DROP TABLE IF EXISTS notifications;")
    cursor.execute("DROP TABLE IF EXISTS subscriptions;")
    db.commit()
    db.close()
    init_db_if_not_exists()
    print('Database has been completely reset.')

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

# --- NEW: API-centric routes for Alpine.js ---

# Main route now just serves the HTML shell
@app.route('/')
def index():
    return render_template('index.html')

# API to get all initial data
@app.route('/api/data', methods=['GET'])
def get_data():
    db = get_db()
    # Get active subscriptions
    subs_cur = db.execute("SELECT id, criteria, status, created_at, openimis_url FROM subscriptions WHERE status = 'active' ORDER BY created_at DESC")
    subscriptions = [dict(row) for row in subs_cur.fetchall()]
    
    # Get notifications
    notifications_cur = db.execute('SELECT id, received_at, content FROM notifications ORDER BY received_at DESC')
    notifications = [dict(row) for row in notifications_cur.fetchall()]

    return jsonify({
        'subscriptions': subscriptions,
        'notifications': notifications
    })


@app.route('/api/check_updates', methods=['GET'])
def check_updates():
    """
    A lightweight endpoint for the client to poll.
    Compares the client's last known count of notifications with the current count in the DB.
    """
    # Get the count of notifications the client last saw. Sent as a URL parameter like ?count=5
    last_known_count = request.args.get('count', 0, type=int)
    
    db = get_db()
    
    # Get the current total count of notifications from the database.
    current_count_query = db.execute('SELECT COUNT(id) FROM notifications').fetchone()
    current_count = current_count_query[0] if current_count_query else 0
    
    # If the current count is greater, it means new data has arrived.
    has_new_data = current_count > last_known_count
    
    return jsonify({'has_new_data': has_new_data})

# API to create a subscription
@app.route('/api/subscribe', methods=['POST'])
def api_subscribe():
    data = request.get_json()
    openimis_url = data.get('openimis_url')
    callback_url = data.get('callback_url')
    criteria = data.get('criteria')
    username = os.getenv('OPENIMIS_USERNAME')
    password = os.getenv('OPENIMIS_PASSWORD')

    with requests.Session() as s:
        try:
            # Login and Subscribe logic (same as before)
            login_response = s.post(f"{openimis_url.rstrip('/')}/api/api_fhir_r4/login/", json={"username": username, "password": password}, timeout=10)
            login_response.raise_for_status()
            auth_token = login_response.json().get('token')
            if not auth_token: raise ValueError("Auth token not found")

            header_dict = {"Content-Type": "application/json", "Accept": "application/json"}
            sub_payload = {
                "resourceType": "Subscription", "status": "active", "end": "2029-12-31T23:59:59Z",
                "reason": criteria, "criteria": criteria,
                "channel": {"type": "rest-hook", "endpoint": callback_url, "header": [json.dumps(header_dict)]}
            }
            sub_headers = {'Authorization': f'Bearer {auth_token}'}
            sub_response = s.post(f"{openimis_url.rstrip('/')}/api/api_fhir_r4/Subscription/", headers=sub_headers, json=sub_payload, timeout=10)
            sub_response.raise_for_status()
            
            sub_data = sub_response.json()
            subscription_id = sub_data.get('id')
            if subscription_id:
                db = get_db()
                db.execute("INSERT OR REPLACE INTO subscriptions (id, criteria, status, openimis_url) VALUES (?, ?, ?, ?)",
                           (subscription_id, criteria, 'active', openimis_url))
                db.commit()
                # Return the newly created subscription object
                new_sub = db.execute("SELECT * FROM subscriptions WHERE id = ?", (subscription_id,)).fetchone()
                return jsonify({'success': True, 'data': dict(new_sub)})
            return jsonify({'success': False, 'message': 'Subscription ID not found in response.'}), 400

        except requests.exceptions.RequestException as e:
            error_message = str(e.response.text if e.response else e)
            return jsonify({'success': False, 'message': error_message}), 500

# API to unsubscribe
@app.route('/api/unsubscribe/<subscription_id>', methods=['DELETE'])
def api_unsubscribe(subscription_id):
    db = get_db()
    sub_info = db.execute("SELECT openimis_url FROM subscriptions WHERE id = ?", (subscription_id,)).fetchone()
    if not sub_info:
        return jsonify({'success': False, 'message': 'Subscription not found in local DB'}), 404
    
    username = os.getenv('OPENIMIS_USERNAME')
    password = os.getenv('OPENIMIS_PASSWORD')
    openimis_url = sub_info['openimis_url']

    with requests.Session() as s:
        try:
            # Login and Delete logic (same as before)
            login_response = s.post(f"{openimis_url.rstrip('/')}/api/api_fhir_r4/login/", json={"username": username, "password": password}, timeout=10)
            login_response.raise_for_status()
            auth_token = login_response.json().get('token')
            if not auth_token: raise ValueError("Auth token not found")
            
            headers = {'Authorization': f'Bearer {auth_token}'}
            unsubscribe_response = s.delete(f"{openimis_url.rstrip('/')}/api/api_fhir_r4/Subscription/{subscription_id}/", headers=headers, timeout=10)
            unsubscribe_response.raise_for_status()

            db.execute("UPDATE subscriptions SET status = 'off' WHERE id = ?", (subscription_id,))
            db.commit()
            return jsonify({'success': True, 'message': 'Unsubscribed successfully'})

        except requests.exceptions.RequestException as e:
            error_message = str(e.response.text if e.response else e)
            return jsonify({'success': False, 'message': error_message}), 500

# In app.py

@app.route('/callback', methods=['POST'])
def openimis_callback():
    """
    A robust, self-contained callback handler for openIMIS notifications.
    """
    print("\n--- Received a callback from openIMIS! ---")
    
    # Check if the incoming request contains JSON data.
    if request.is_json:
        conn = None  # Initialize connection variable
        try:
            # Get the JSON payload
            data = request.get_json()
            print("Payload:", json.dumps(data, indent=2))
            
            # --- ROBUST DATABASE HANDLING ---
            # Do NOT use get_db() or g.db here. Create a new, isolated connection.
            conn = sqlite3.connect(DATABASE)
            cursor = conn.cursor()
            
            # Insert the raw JSON content into the notifications table
            cursor.execute('INSERT INTO notifications (content) VALUES (?)', (json.dumps(data),))
            
            # Commit the transaction
            conn.commit()
            
            print("Successfully saved notification to the database.")
            
        except Exception as e:
            # If any error occurs (e.g., DB is locked, JSON is malformed), log it.
            print(f"[ERROR] in /callback: {e}")
            # Return a server error status to indicate failure.
            return jsonify({'status': 'error', 'message': str(e)}), 500
            
        finally:
            # CRITICAL: Ensure the connection is always closed, even if an error occurred.
            if conn:
                conn.close()
                print("Database connection closed.")

    # Always return a valid JSON response to satisfy the openIMIS client.
    return jsonify({'status': 'received'}), 200

if __name__ == '__main__':
    init_db_if_not_exists()
    app.run(host='0.0.0.0', debug=True, port=5001)