from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'employee' or 'hr'

class EmployeeData(db.Model):
    __tablename__ = 'employee_data'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, default=datetime.utcnow().date)
    work_hours = db.Column(db.Float, default=0.0)
    meeting_count = db.Column(db.Integer, default=0)
    break_time = db.Column(db.Float, default=0.0)  # Total idle time in minutes
    activity_score = db.Column(db.Float, default=0.0)
    anomaly_score = db.Column(db.Float, default=0.0)
    bps = db.Column(db.Float, default=0.0)

    user = db.relationship('User', backref=db.backref('data', lazy=True))

class HRMapping(db.Model):
    __tablename__ = 'hr_mapping'
    id = db.Column(db.Integer, primary_key=True)
    hr_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    employee_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    hr = db.relationship('User', foreign_keys=[hr_id], backref=db.backref('managed_employees', lazy=True))
    employee = db.relationship('User', foreign_keys=[employee_id], backref=db.backref('hr_managers', lazy=True))
