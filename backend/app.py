from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, EmployeeData, HRMapping
from ai_engine import calculate_anomaly_score, calculate_bps, get_risk_level
import datetime
import numpy as np
import os
app = Flask(__name__)
CORS(app)

# Use an absolute path to ensure the DB is exactly where we expect
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'wellbeat.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-secret-key'

db.init_app(app)

with app.app_context():
    db.create_all()

def send_mock_email(employee_name, score):
    print(f"--- MOCK EMAIL SENT TO HR ---")
    print(f"Subject: High Burnout Risk Alert: {employee_name}")
    print(f"Body: User {employee_name} has reached a BPS of {score}. Please check the HR dashboard.")
    print(f"-----------------------------")

# --- Auth Routes ---
# ... (rest of the routes)
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    role = data.get('role')

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "User already exists"}), 400

    new_user = User(username=username, password=password, role=role)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User created", "user": {"id": new_user.id, "username": new_user.username, "role": new_user.role}}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username, password=password).first()
    if not user:
        return jsonify({"message": "Invalid credentials"}), 401
    
    return jsonify({"user": {"id": user.id, "username": user.username, "role": user.role}}), 200

# --- Employee Routes ---

@app.route('/api/employee/data', methods=['POST'])
def submit_data():
    try:
        data = request.json
        user_id = data.get('user_id')
        work_hours = float(data.get('work_hours', 0))
        meeting_count = int(data.get('meeting_count', 0))
        break_time = float(data.get('break_time', 0))
        activity_patterns = data.get('activity_patterns', []) # List of activity counts

        # Calculate AI scores
        anomaly_score = float(calculate_anomaly_score(activity_patterns))
        bps = float(calculate_bps(work_hours, meeting_count, break_time, anomaly_score))

        avg_activity = float(np.mean(activity_patterns)) if activity_patterns else 0.0

        new_entry = EmployeeData(
            user_id=user_id,
            work_hours=work_hours,
            meeting_count=meeting_count,
            break_time=break_time,
            activity_score=avg_activity,
            anomaly_score=anomaly_score,
            bps=bps
        )
        db.session.add(new_entry)
        db.session.commit()

        alert_hr = bps > 75
        if alert_hr:
            user = User.query.get(user_id)
            send_mock_email(user.username, bps)
        
        return jsonify({
            "message": "Data saved",
            "bps": bps,
            "risk_level": get_risk_level(bps),
            "alert_hr": alert_hr
        }), 201
    except Exception as e:
        print(f"Error in submit_data: {str(e)}")
        return jsonify({"message": f"Server error: {str(e)}"}), 500

@app.route('/api/employee/dashboard/<user_id>', methods=['GET'])
def get_employee_dashboard(user_id):
    records = EmployeeData.query.filter_by(user_id=user_id).order_by(EmployeeData.date.desc()).limit(14).all()
    
    data = []
    for r in records:
        data.append({
            "date": r.date.isoformat(),
            "bps": r.bps,
            "risk_level": get_risk_level(r.bps),
            "work_hours": r.work_hours,
            "meetings": r.meeting_count
        })
    
    return jsonify(data), 200

# --- HR Routes ---

@app.route('/api/hr/add_employee', methods=['POST'])
def add_employee():
    data = request.json
    hr_id = data.get('hr_id')
    employee_username = data.get('employee_username')
    
    employee = User.query.filter_by(username=employee_username, role='employee').first()
    if not employee:
        return jsonify({"message": "Employee not found"}), 404
        
    mapping = HRMapping(hr_id=hr_id, employee_id=employee.id)
    db.session.add(mapping)
    db.session.commit()
    
    return jsonify({"message": "Employee added"}), 201

@app.route('/api/hr/dashboard/<hr_id>', methods=['GET'])
def get_hr_dashboard(hr_id):
    mappings = HRMapping.query.filter_by(hr_id=hr_id).all()
    employees_data = []
    
    for m in mappings:
        emp = User.query.get(m.employee_id)
        latest_data = EmployeeData.query.filter_by(user_id=emp.id).order_by(EmployeeData.date.desc()).first()
        
        employees_data.append({
            "id": emp.id,
            "username": emp.username,
            "bps": latest_data.bps if latest_data else 0,
            "risk_level": get_risk_level(latest_data.bps) if latest_data else "N/A"
        })
        
    return jsonify(employees_data), 200

@app.route('/api/hr/employee_detail/<employee_id>', methods=['GET'])
def get_employee_detail(employee_id):
    emp = User.query.get(employee_id)
    if not emp:
        return jsonify({"message": "Employee not found"}), 404
        
    records = EmployeeData.query.filter_by(user_id=employee_id).order_by(EmployeeData.date.desc()).limit(14).all()
    
    history = []
    activity_data = []
    for r in records:
        history.append({
            "date": r.date.isoformat(),
            "bps": r.bps,
            "meetings": r.meeting_count,
            "work_hours": r.work_hours
        })
        activity_data.append(r.activity_score)
        
    return jsonify({
        "username": emp.username,
        "role": emp.role,
        "history": history,
        "activity_trend": activity_data
    }), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
