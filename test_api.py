import unittest
import json
import os
import sqlite3
from app import app
import database

class GitRoboticsTestCase(unittest.TestCase):
    def setUp(self):
        # Configure app for testing
        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test-secret-key'
        self.client = app.test_client()
        
        # Point to a temporary test database
        database.DB_FILE = 'test_data.db'
        database.init_db()

    def tearDown(self):
        # Remove test database
        if os.path.exists('test_data.db'):
            os.remove('test_data.db')

    def test_auth_and_progress_flow(self):
        # 1. Register a new user
        reg_payload = {
            "username": "tester_bot",
            "email": "test@robotics.com",
            "password": "password123"
        }
        res = self.client.post('/api/register', 
                               data=json.dumps(reg_payload), 
                               content_type='application/json')
        data = json.loads(res.data)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(data['success'])

        # 2. Try registering same username (should fail)
        res_dup = self.client.post('/api/register', 
                                   data=json.dumps(reg_payload), 
                                   content_type='application/json')
        data_dup = json.loads(res_dup.data)
        self.assertEqual(res_dup.status_code, 400)
        self.assertFalse(data_dup['success'])

        # 3. Log out (implicit, but let's call explicit logout)
        res_out = self.client.post('/api/logout')
        self.assertEqual(res_out.status_code, 200)

        # 4. Try getting profile when logged out (should be 401 unauthorized)
        res_prof_unauth = self.client.get('/api/profile')
        self.assertEqual(res_prof_unauth.status_code, 401)

        # 5. Log in
        login_payload = {
            "username_or_email": "tester_bot",
            "password": "password123"
        }
        res_in = self.client.post('/api/login', 
                                  data=json.dumps(login_payload), 
                                  content_type='application/json')
        data_in = json.loads(res_in.data)
        self.assertEqual(res_in.status_code, 200)
        self.assertTrue(data_in['success'])

        # 6. Retrieve profile
        res_prof = self.client.get('/api/profile')
        data_prof = json.loads(res_prof.data)
        self.assertEqual(res_prof.status_code, 200)
        self.assertTrue(data_prof['success'])
        profile = data_prof['profile']
        self.assertEqual(profile['username'], 'tester_bot')
        self.assertEqual(profile['level'], 1)
        self.assertEqual(profile['xp'], 0)
        self.assertEqual(profile['badges'], [])
        self.assertEqual(profile['progress'], {})

        # 7. Update progress
        update_payload = {
            "level": 2,
            "xp": 100,
            "badges": ["System Bootstrapper"],
            "progress": {"1": "completed"}
        }
        res_up = self.client.post('/api/update-progress', 
                                  data=json.dumps(update_payload), 
                                  content_type='application/json')
        data_up = json.loads(res_up.data)
        self.assertEqual(res_up.status_code, 200)
        self.assertTrue(data_up['success'])

        # 8. Fetch profile again and verify updated attributes
        res_prof_new = self.client.get('/api/profile')
        data_prof_new = json.loads(res_prof_new.data)
        profile_new = data_prof_new['profile']
        self.assertEqual(profile_new['level'], 2)
        self.assertEqual(profile_new['xp'], 100)
        self.assertEqual(profile_new['badges'], ["System Bootstrapper"])
        self.assertEqual(profile_new['progress'], {"1": "completed"})

if __name__ == '__main__':
    unittest.main()
