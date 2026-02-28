import numpy as np
from sklearn.ensemble import IsolationForest

def calculate_anomaly_score(activity_patterns):
    """
    activity_patterns: list of mouse movement counts or similar features
    Returns: Anomaly score (0-100)
    """
    if not activity_patterns or len(activity_patterns) < 5:
        return 0.0
    
    # Prepare data for Isolation Forest
    X = np.array(activity_patterns).reshape(-1, 1)
    
    clf = IsolationForest(contamination=0.1, random_state=42)
    clf.fit(X)
    
    # decision_function returns scores where lower values are more abnormal
    scores = clf.decision_function(X)
    
    # Normalize score to 0-100 range (higher is more anomalous)
    # Simple normalization: min-max scaling of the decision function
    avg_score = np.mean(scores)
    
    # Map decision function range (~ -0.5 to 0.5) to (100 to 0)
    # This is a heuristic mapping
    normalized_score = max(0, min(100, (0.5 - avg_score) * 100))
    
    return normalized_score

def calculate_bps(work_hours, meeting_count, break_time, anomaly_score):
    """
    BPS = (0.3 * Work Hours Score) + (0.2 * Meeting Score) + (0.2 * Break Deficit Score) + (0.3 * Anomaly Score)
    """
    # 1. Work Hours Score (Over 8 hours is high stress)
    work_hours_score = min(100, (work_hours / 10.0) * 100)
    
    # 2. Meeting Score (Over 5 meetings is high stress)
    meeting_score = min(100, (meeting_count / 8.0) * 100)
    
    # 3. Break Deficit Score (Target 15% of work time as break)
    target_break = work_hours * 60 * 0.15 # in minutes
    if target_break > 0:
        break_deficit_score = max(0, min(100, (1 - (break_time / target_break)) * 100))
    else:
        break_deficit_score = 0
        
    # Final BPS
    bps = (0.3 * work_hours_score) + \
          (0.2 * meeting_score) + \
          (0.2 * break_deficit_score) + \
          (0.3 * anomaly_score)
          
    return round(bps, 2)

def get_risk_level(bps):
    if bps < 40:
        return "Low"
    elif bps < 75:
        return "Medium"
    else:
        return "High"
