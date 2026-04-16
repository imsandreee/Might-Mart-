const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'mighteemart_secret';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── MULTER CONFIGURATION ──────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.query.type === 'attendance' ? 'attendance' : 'profiles';
        const dir = `uploads/${type}`;
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ─── ERROR HANDLING & LOGGING ──────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    console.error(err.stack);
});

db.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
    process.exit(-1);
});

// ─── AUTH MIDDLEWARE ───────────────────────────────────────
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

// ─── AUTH ROUTES ───────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });
        const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });
        const admin = rows[0];
        const isValid = await bcrypt.compare(password, admin.password_hash);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials.' });
        const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, username: admin.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── EMPLOYEES ROUTES ──────────────────────────────────────
app.get('/api/employees', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT e.*, s.shift_start, s.shift_end, s.work_days
            FROM employees e
            LEFT JOIN schedules s ON e.id = s.employee_id
            ORDER BY e.name
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/employees/barcode/:barcode', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM employees WHERE barcode = ?', [req.params.barcode]);
        if (rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/employees', authenticateAdmin, upload.single('photo'), async (req, res) => {
    try {
        const { name, role, department, shift_start, shift_end, work_days } = req.body;
        const photo_url = req.file ? `/uploads/profiles/${req.file.filename}` : null;
        
        const [result] = await db.query(
            'INSERT INTO employees (name, role, department, photo_url) VALUES (?, ?, ?, ?)',
            [name, role, department, photo_url]
        );
        const employeeId = result.insertId;
        
        // Generate a barcode (e.g., EMP + ID)
        const barcode = `EMP${employeeId.toString().padStart(4, '0')}`;
        await db.query('UPDATE employees SET barcode = ? WHERE id = ?', [barcode, employeeId]);
        
        // Create schedule for new employee
        await db.query(
            "INSERT INTO schedules (employee_id, shift_start, shift_end, work_days) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE shift_start=?, shift_end=?, work_days=?",
            [employeeId, shift_start || '09:00:00', shift_end || '17:00:00', work_days || 'Mon,Tue,Wed,Thu,Fri', shift_start, shift_end, work_days]
        );
        
        res.status(201).json({ id: employeeId, name, role, department, barcode, photo_url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/employees/:id', authenticateAdmin, upload.single('photo'), async (req, res) => {
    try {
        const { name, role, department, shift_start, shift_end, work_days } = req.body;
        const employeeId = req.params.id;
        let query = 'UPDATE employees SET name=?, role=?, department=?';
        let params = [name, role, department];

        if (req.file) {
            const photo_url = `/uploads/profiles/${req.file.filename}`;
            query += ', photo_url=?';
            params.push(photo_url);
        }

        query += ' WHERE id=?';
        params.push(employeeId);

        await db.query(query, params);

        // Update or insert schedule
        await db.query(`
            INSERT INTO schedules (employee_id, shift_start, shift_end, work_days)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE shift_start=?, shift_end=?, work_days=?
        `, [employeeId, shift_start, shift_end, work_days, shift_start, shift_end, work_days]);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/employees/:id', authenticateAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM employees WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── SCHEDULES ROUTES ─────────────────────────────────────
app.get('/api/schedules', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT s.*, e.name, e.role, e.department
            FROM schedules s
            JOIN employees e ON s.employee_id = e.id
            ORDER BY e.name
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/schedules/:employee_id', authenticateAdmin, async (req, res) => {
    try {
        const { shift_start, shift_end, work_days } = req.body;
        await db.query(`
            INSERT INTO schedules (employee_id, shift_start, shift_end, work_days)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE shift_start=?, shift_end=?, work_days=?
        `, [req.params.employee_id, shift_start, shift_end, work_days, shift_start, shift_end, work_days]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── ATTENDANCE ROUTES ────────────────────────────────────
app.get('/api/attendance', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, e.name, e.role, e.department,
                   s.shift_start, s.shift_end
            FROM attendance a
            JOIN employees e ON a.employee_id = e.id
            LEFT JOIN schedules s ON a.employee_id = s.employee_id
            ORDER BY a.date DESC, a.check_in DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attendance/today', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT a.*, e.name, e.role, e.department
            FROM attendance a
            JOIN employees e ON a.employee_id = e.id
            WHERE a.date = CURDATE()
            ORDER BY a.check_in DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/attendance/check-in', upload.single('photo'), async (req, res) => {
    try {
        const { employee_id, score } = req.body;
        const captured_photo = req.file ? `/uploads/attendance/${req.file.filename}` : null;

        const [existing] = await db.query(
            'SELECT * FROM attendance WHERE employee_id=? AND date=CURDATE()',
            [employee_id]
        );
        if (existing.length > 0) {
            return res.json({ success: true, message: 'Already checked in' });
        }

        // Determine status based on schedule
        const [schedRows] = await db.query(
            'SELECT shift_start FROM schedules WHERE employee_id=?',
            [employee_id]
        );
        const now = new Date();
        const shiftStart = schedRows.length > 0 ? schedRows[0].shift_start : '09:00:00';
        const [sh, sm] = shiftStart.split(':').map(Number);
        const shiftStartMs = sh * 60 + sm;
        const nowMs = now.getHours() * 60 + now.getMinutes();
        // Grace period: 15 minutes
        const status = nowMs > shiftStartMs + 15 ? 'late' : 'present';

        const [result] = await db.query(
            "INSERT INTO attendance (employee_id, date, check_in, status, productivity_score, captured_photo) VALUES (?, CURDATE(), NOW(), ?, ?, ?)",
            [employee_id, status, score || 0, captured_photo]
        );
        res.json({ success: true, id: result.insertId, status, captured_photo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/attendance/check-out', upload.single('photo'), async (req, res) => {
    try {
        const { employee_id } = req.body;
        const captured_photo = req.file ? `/uploads/attendance/${req.file.filename}` : null;

        // Get the check_in time and schedule
        const [records] = await db.query(
            'SELECT * FROM attendance WHERE employee_id=? AND date=CURDATE() AND check_out IS NULL',
            [employee_id]
        );
        if (records.length === 0) return res.json({ success: false, message: 'No active check-in found' });

        const record = records[0];
        const [schedRows] = await db.query(
            'SELECT shift_start, shift_end FROM schedules WHERE employee_id=?',
            [employee_id]
        );

        // Calculate hours_worked
        const checkIn = new Date(record.check_in);
        const checkOut = new Date();
        const hoursWorked = Math.round((checkOut - checkIn) / 1000 / 60 / 60 * 100) / 100;

        // Standard shift = 8 hours
        const STANDARD_HOURS = 8;
        const overtimeHours = Math.max(0, Math.round((hoursWorked - STANDARD_HOURS) * 100) / 100);

        // Productivity ratio: (hours_worked / STANDARD_HOURS) * 100, capped "displayed" at 120
        let productivity = Math.round((hoursWorked / STANDARD_HOURS) * 100);
        // If late, penalise by 10%
        if (record.status === 'late') productivity = Math.max(0, productivity - 10);
        productivity = Math.min(productivity, 120); // cap at 120 to show overtime visually

        await db.query(`
            UPDATE attendance
            SET check_out = NOW(),
                hours_worked = ?,
                overtime_hours = ?,
                productivity_score = ?,
                captured_photo = COALESCE(?, captured_photo)
            WHERE employee_id=? AND date=CURDATE() AND check_out IS NULL
        `, [hoursWorked, overtimeHours, productivity, captured_photo, employee_id]);

        res.json({ success: true, hours_worked: hoursWorked, overtime_hours: overtimeHours, productivity_score: productivity, captured_photo: captured_photo || record.captured_photo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/attendance/reports', async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT
                COUNT(*) as total_records,
                COALESCE(SUM(hours_worked), 0) as total_hours,
                COALESCE(AVG(hours_worked), 0) as avg_hours,
                COALESCE(AVG(productivity_score), 0) as avg_productivity,
                COALESCE(SUM(overtime_hours), 0) as total_overtime
            FROM attendance WHERE date = CURDATE()
        `);
        const [status_distribution] = await db.query(
            'SELECT status, COUNT(*) as count FROM attendance WHERE date = CURDATE() GROUP BY status'
        );
        const [dept_distribution] = await db.query(`
            SELECT e.department, COUNT(a.id) as count, COALESCE(SUM(a.hours_worked), 0) as total_hours
            FROM attendance a
            JOIN employees e ON a.employee_id = e.id
            WHERE a.date = CURDATE()
            GROUP BY e.department
        `);
        const [employee_hours] = await db.query(`
            SELECT e.name, COALESCE(a.hours_worked, 0) as hours_worked, COALESCE(a.overtime_hours, 0) as overtime_hours
            FROM attendance a
            JOIN employees e ON a.employee_id = e.id
            WHERE a.date = CURDATE()
        `);

        res.json({ stats: stats[0], status_distribution, dept_distribution, employee_hours });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Error: Port ${PORT} is already in use.`);
    } else {
        console.error('Server error:', err.message);
    }
    process.exit(1);
});
