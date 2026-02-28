const API_BASE = 'http://127.0.0.1:5000/api';

// State Management
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let currentView = 'auth'; // 'auth', 'employee', 'hr'
let isSignup = false;

// DOM Elements
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const toggleAuth = document.getElementById('toggle-auth');
const roleSelect = document.getElementById('role-select');
const authMessage = document.getElementById('auth-message');

const navUsername = document.getElementById('nav-username');
const navRole = document.getElementById('nav-role');
const logoutBtn = document.getElementById('logout-btn');

const employeeHome = document.getElementById('employee-home');
const hrHome = document.getElementById('hr-home');
const hrDetail = document.getElementById('hr-detail');

// Init
document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        showDashboard();
    } else {
        showAuth();
    }
});

// --- Auth Functions ---

function showAuth() {
    authView.classList.remove('hidden');
    document.title = 'WellBeat - Login';
    dashboardView.classList.add('hidden');
}

toggleAuth.addEventListener('click', () => {
    isSignup = !isSignup;
    authTitle.innerText = isSignup ? 'Create Account' : 'Welcome Back';
    document.title = isSignup ? 'WellBeat - Signup' : 'WellBeat - Login';
    authBtn.innerText = isSignup ? 'Sign Up' : 'Login';
    toggleAuth.innerHTML = isSignup ? 'Already have an account? <span>Login</span>' : "Don't have an account? <span>Sign Up</span>";
    roleSelect.classList.toggle('hidden', !isSignup);
    authMessage.innerText = '';
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = roleSelect.value;

    const endpoint = isSignup ? '/signup' : '/login';
    const payload = isSignup ? { username, password, role } : { username, password };

    try {
        const res = await fetch(API_BASE + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            showDashboard();
        } else {
            authMessage.innerText = data.message || 'Authentication failed';
        }
    } catch (err) {
        authMessage.innerText = 'Server error. Is the backend running?';
    }
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('user');
    location.reload();
});

// --- Navigation Logic ---

document.querySelectorAll('.nav-links li').forEach(link => {
    link.addEventListener('click', (e) => {
        const view = e.target.getAttribute('data-view');
        if (!view) return;

        // Update Nav UI
        document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');

        // Show/Hide Sections
        document.querySelectorAll('.sub-view').forEach(v => v.classList.add('hidden'));

        if (currentUser.role === 'employee') {
            if (view === 'home') document.getElementById('employee-home').classList.remove('hidden');
            if (view === 'reports') {
                document.getElementById('employee-reports').classList.remove('hidden');
                loadEmployeeReports();
            }
        } else {
            if (view === 'home') document.getElementById('hr-home').classList.remove('hidden');
            if (view === 'manage') {
                document.getElementById('hr-manage-team').classList.remove('hidden');
                loadManageTeam();
            }
            if (view === 'reports') {
                document.getElementById('hr-reports').classList.remove('hidden');
                loadHRReports();
            }
        }
    });
});

async function loadEmployeeReports() {
    try {
        const res = await fetch(`${API_BASE}/employee/dashboard/${currentUser.id}`);
        const data = await res.json();
        const body = document.getElementById('employee-reports-body');
        body.innerHTML = '';

        data.forEach(r => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${r.date.split('T')[0]}</td>
                <td>${r.work_hours}h</td>
                <td>${r.meetings}</td>
                <td class="font-bold">${r.bps}</td>
                <td><span class="risk-tag risk-${r.risk_level.toLowerCase()}">${r.risk_level}</span></td>
            `;
            body.appendChild(row);
        });
    } catch (err) {
        console.error('Failed to load reports');
    }
}

async function loadManageTeam() {
    try {
        const res = await fetch(`${API_BASE}/hr/dashboard/${currentUser.id}`);
        const employees = await res.json();
        const list = document.getElementById('manage-employee-list');
        list.innerHTML = '';

        employees.forEach(emp => {
            const item = document.createElement('li');
            item.className = 'manage-item';
            item.innerHTML = `
                <span>${emp.username}</span>
                <button class="btn-danger" onclick="removeEmployee('${emp.id}')">Remove</button>
            `;
            list.appendChild(item);
        });
    } catch (err) {
        console.error('Failed to load team list');
    }
}

async function loadHRReports() {
    try {
        const res = await fetch(`${API_BASE}/hr/dashboard/${currentUser.id}`);
        const data = await res.json();

        let totalBps = 0;
        let risks = { High: 0, Medium: 0, Low: 0 };

        data.forEach(e => {
            totalBps += e.bps;
            if (risks[e.risk_level] !== undefined) risks[e.risk_level]++;
        });

        const avg = data.length > 0 ? (totalBps / data.length).toFixed(1) : 0;
        document.getElementById('team-avg-bps').innerText = avg;

        const breakdown = document.getElementById('risk-breakdown');
        breakdown.innerHTML = `
            <div class="risk-stat"><span class="risk-tag risk-high">High</span> ${risks.High} Employees</div>
            <div class="risk-stat"><span class="risk-tag risk-medium">Medium</span> ${risks.Medium} Employees</div>
            <div class="risk-stat"><span class="risk-tag risk-low">Low</span> ${risks.Low} Employees</div>
        `;
    } catch (err) {
        console.error('Failed to load team reports');
    }
}

// Placeholder for remove functionality (Backend endpoint needed for cleanup)
window.removeEmployee = (id) => {
    alert('Removal functionality requires backend cleanup implementation');
};

// --- Dashboard Functions ---

function showDashboard() {
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    navUsername.innerText = currentUser.username;
    navRole.innerText = currentUser.role === 'hr' ? 'HR Manager' : 'Employee';

    if (currentUser.role === 'employee') {
        employeeHome.classList.remove('hidden');
        hrHome.classList.add('hidden');
        document.getElementById('nav-add-employee').classList.add('hidden');
        initEmployeeDashboard();
    } else {
        employeeHome.classList.add('hidden');
        hrHome.classList.remove('hidden');
        document.getElementById('nav-add-employee').classList.remove('hidden');
        initHRDashboard();
    }
}

// --- Employee Logic ---

async function initEmployeeDashboard() {
    document.getElementById('current-date').innerText = new Date().toLocaleDateString();

    // Start activity tracker
    if (window.ActivityTracker) {
        window.ActivityTracker.start();
    }

    // Initialize placeholder chart
    initActivityChart('employee-activity-chart');

    await loadEmployeeData();
}

async function loadEmployeeData() {
    try {
        const res = await fetch(`${API_BASE}/employee/dashboard/${currentUser.id}`);
        const data = await res.json();

        if (data.length > 0) {
            const latest = data[0];
            document.getElementById('bps-display').innerText = latest.bps;
            document.getElementById('risk-level').innerText = latest.risk_level + ' Risk';

            // Render Trend Chart
            if (window.ChartEngine) {
                window.ChartEngine.renderEmployeeTrend(data);
            }
        }
    } catch (err) {
        console.error('Failed to load employee data', err);
    }
}

document.getElementById('submit-daily-data').addEventListener('click', async () => {
    const workHours = document.getElementById('work-hours-input').value;
    const meetings = document.getElementById('meetings-input').value;
    const activityPatterns = window.ActivityTracker ? window.ActivityTracker.getPatterns() : [];
    const breakTime = window.ActivityTracker ? window.ActivityTracker.getBreakTime() : 0;

    if (!workHours) return alert('Please enter work hours');

    try {
        const res = await fetch(`${API_BASE}/employee/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                work_hours: workHours,
                meeting_count: meetings,
                break_time: breakTime,
                activity_patterns: activityPatterns
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert('Data submitted successfully!');
            loadEmployeeData();
            if (data.alert_hr) {
                document.getElementById('alert-modal').classList.remove('hidden');
            }
        } else {
            alert('Server error: ' + (data.message || 'Unknown error'));
        }
    } catch (err) {
        console.error('Submission error:', err);
        alert('Network error or server unavailable. Ensure the Flask backend is running.');
    }
});

// --- HR Logic ---

async function initHRDashboard() {
    try {
        const res = await fetch(`${API_BASE}/hr/dashboard/${currentUser.id}`);
        const data = await res.json();
        renderEmployeeGrid(data);
    } catch (err) {
        console.error('Failed to load HR dashboard');
    }
}

function renderEmployeeGrid(employees) {
    const grid = document.getElementById('employee-grid');
    grid.innerHTML = '';

    employees.forEach(emp => {
        const card = document.createElement('div');
        card.className = 'glass-card emp-card';
        card.innerHTML = `
            <h3>${emp.username}</h3>
            <div class="emp-bps">${emp.bps} <span class="risk-tag risk-${emp.risk_level.toLowerCase()}">${emp.risk_level}</span></div>
            <p>Role: Employee</p>
        `;
        card.onclick = () => showEmployeeDetail(emp.id);
        grid.appendChild(card);
    });
}

async function showEmployeeDetail(empId) {
    try {
        const res = await fetch(`${API_BASE}/hr/employee_detail/${empId}`);
        const data = await res.json();

        hrHome.classList.add('hidden');
        hrDetail.classList.remove('hidden');
        document.getElementById('detail-employee-name').innerText = data.username;

        if (window.ChartEngine) {
            window.ChartEngine.renderHRDetail(data.history, data.activity_trend);
        }
    } catch (err) {
        alert('Failed to load employee details');
    }
}

document.getElementById('back-to-grid').addEventListener('click', () => {
    hrDetail.classList.add('hidden');
    hrHome.classList.remove('hidden');
});

// Add Employee Flow
document.getElementById('add-employee-trigger').addEventListener('click', () => {
    document.getElementById('add-employee-modal').classList.remove('hidden');
});

document.getElementById('confirm-add-emp').addEventListener('click', async () => {
    const username = document.getElementById('add-emp-username').value;
    if (!username) return;

    try {
        const res = await fetch(`${API_BASE}/hr/add_employee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hr_id: currentUser.id, employee_username: username })
        });

        if (res.ok) {
            closeModal();
            initHRDashboard();
        } else {
            const data = await res.json();
            alert(data.message);
        }
    } catch (err) {
        alert('Error adding employee');
    }
});

// UI Helpers
function closeModal() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}
window.closeModal = closeModal;
