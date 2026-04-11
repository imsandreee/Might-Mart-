CREATE DATABASE IF NOT EXISTS mightee_mart;
USE mightee_mart;

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL, -- e.g., Cashier, Stock Clerk, Floor Manager
    department VARCHAR(255) NOT NULL, -- e.g., Sales, Inventory, Operations, Security
    pin_code VARCHAR(10), -- Optional: for check-in authentication
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in TIMESTAMP NULL DEFAULT NULL,
    check_out TIMESTAMP NULL DEFAULT NULL,
    hours_worked DECIMAL(5, 2) DEFAULT 0.00,
    status ENUM('present', 'late', 'absent') DEFAULT 'present',
    productivity_score INT DEFAULT 0, -- out of 100
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Insert dummy employees
INSERT INTO employees (name, role, department) VALUES 
('Juan Dela Cruz', 'Cashier', 'Sales'),
('Maria Santos', 'Stock Clerk', 'Inventory'),
('Pedro Reyes', 'Floor Manager', 'Operations'),
('Ana Garcia', 'Cashier', 'Sales'),
('Carlos Mendoza', 'Security Guard', 'Security');

-- Insert dummy attendance for today
INSERT INTO attendance (employee_id, date, check_in, status, productivity_score) VALUES
(1, CURDATE(), DATE_SUB(NOW(), INTERVAL 6 HOUR), 'late', 72),
(2, CURDATE(), DATE_SUB(NOW(), INTERVAL 7 HOUR), 'present', 79),
(3, CURDATE(), DATE_SUB(NOW(), INTERVAL 8 HOUR), 'present', 87),
(4, CURDATE(), DATE_SUB(NOW(), INTERVAL 7 HOUR), 'present', 84),
(5, CURDATE(), DATE_SUB(NOW(), INTERVAL 6 HOUR), 'late', 0);
