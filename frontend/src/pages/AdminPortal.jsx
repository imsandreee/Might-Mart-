import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Users, Clock, CheckCircle, LogOut, Calendar, BarChart2, TrendingUp, ShieldCheck } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import EmployeeCrud from './EmployeeCrud';
import ContributionCalendar from '../components/ContributionCalendar';
import logo from '../assets/logo.png';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AdminPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCalendarEmployee, setSelectedCalendarEmployee] = useState('');
  const [report, setReport] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [editingSchedule, setEditingSchedule] = useState(null);
  // Report filters
  const [rPeriod, setRPeriod] = useState('all');
  const [rEmployee, setREmployee] = useState('');
  const [rDept, setRDept] = useState('');
  const adminUsername = localStorage.getItem('admin_username') || 'Admin';

  const authHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  });

  useEffect(() => {
    fetchData();
    fetchAttendanceRecords();
    fetchSchedules();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/attendance/reports');
      const data = await res.json();
      setReport(data);
    } catch (err) { console.error(err); }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/attendance');
      const data = await res.json();
      setAttendanceRecords(data);
    } catch (err) { console.error(err); }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/schedules');
      const data = await res.json();
      setSchedules(data);
    } catch (err) { console.error(err); }
  };

  const handleScheduleSave = async (schedule) => {
    try {
      await fetch(`http://localhost:5000/api/schedules/${schedule.employee_id}`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({
          shift_start: schedule.shift_start,
          shift_end: schedule.shift_end,
          work_days: schedule.work_days
        })
      });
      setEditingSchedule(null);
      fetchSchedules();
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    navigate('/admin-login');
  };

  const getPieColor = (entry) => {
    if (entry.name === 'present') return '#10b981';
    if (entry.name === 'late') return '#f59e0b';
    return '#ef4444';
  };

  const getTimeString = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDateString = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredRecords = attendanceRecords.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'All Status' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const todayRecords = attendanceRecords.filter(r =>
    new Date(r.date).toDateString() === new Date().toDateString()
  );

  const getProductivityColor = (score) => {
    if (score >= 100) return '#7c3aed'; // overtime = purple
    if (score >= 75) return '#1a9c3e';  // good = brand green
    if (score >= 50) return '#FFD600';  // ok = brand yellow
    return '#CC1111';                   // poor = brand red
  };

  // ─── FILTERED REPORT DATA ─────────────────────────────────────
  const filteredReportRecords = (() => {
    const now = new Date();
    let records = [...attendanceRecords];
    // Period filter
    if (rPeriod === 'daily') {
      records = records.filter(r => new Date(r.date).toDateString() === now.toDateString());
    } else if (rPeriod === 'weekly') {
      const wk = new Date(now); wk.setDate(now.getDate() - 7);
      records = records.filter(r => new Date(r.date) >= wk);
    } else if (rPeriod === 'monthly') {
      const mo = new Date(now); mo.setMonth(now.getMonth() - 1);
      records = records.filter(r => new Date(r.date) >= mo);
    } else if (rPeriod === 'yearly') {
      const yr = new Date(now); yr.setFullYear(now.getFullYear() - 1);
      records = records.filter(r => new Date(r.date) >= yr);
    }
    // Employee filter
    if (rEmployee) records = records.filter(r => String(r.employee_id) === rEmployee);
    // Department filter
    if (rDept) records = records.filter(r => r.department === rDept);
    return records;
  })();

  // Derived chart data from filtered records
  const filteredStatusDist = (() => {
    const map = {};
    filteredReportRecords.forEach(r => { map[r.status] = (map[r.status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ status, count }));
  })();

  const filteredEmpHours = (() => {
    const map = {};
    filteredReportRecords.forEach(r => {
      if (!map[r.name]) map[r.name] = { name: r.name, hours_worked: 0, overtime_hours: 0 };
      map[r.name].hours_worked += Number(r.hours_worked || 0);
      map[r.name].overtime_hours += Number(r.overtime_hours || 0);
    });
    return Object.values(map);
  })();

  const filteredDeptDist = (() => {
    const map = {};
    filteredReportRecords.forEach(r => {
      if (!map[r.department]) map[r.department] = { department: r.department, count: 0, total_hours: 0 };
      map[r.department].count++;
      map[r.department].total_hours += Number(r.hours_worked || 0);
    });
    return Object.values(map);
  })();

  // Compute report summary stats
  const reportPeriod = (() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
    const daily = attendanceRecords.filter(r => new Date(r.date).toDateString() === todayStr);
    const weekly = attendanceRecords.filter(r => new Date(r.date) >= weekAgo);
    const monthly = attendanceRecords.filter(r => new Date(r.date) >= monthAgo);
    return { daily, weekly, monthly, all: attendanceRecords };
  })();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Header Bar */}
      <div className="brand-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={logo} alt="Mightee Mart" style={{ height: '48px', borderRadius: '6px' }} />
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#CC1111', lineHeight: 1 }}>Mightee Mart</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1a9c3e', letterSpacing: '0.06em' }}>YOUR 24/7 GROCERY STORE</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.08)', padding: '0.3rem 0.75rem', borderRadius: '6px' }}>
            <ShieldCheck size={14} color="#CC1111" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a1a1a' }}>Admin: <strong>{adminUsername}</strong></span>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: '#CC1111', color: 'white', border: 'none',
            borderRadius: '6px', padding: '0.4rem 0.875rem', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.8rem', fontFamily: 'inherit'
          }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Page Header + Tabs */}
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0 1rem' }}>

          <div>
            <h1 style={{ fontSize: '1.4rem', color: '#CC1111' }}>Admin Dashboard</h1>
            <p style={{ fontSize: '0.8rem' }}>Store management & analytics</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <BarChart2 size={16} /> Dashboard
          </button>
          <button className={`tab ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
            <Users size={16} /> Employees
          </button>
          <button className={`tab ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
            <Clock size={16} /> Attendance
          </button>
          <button className={`tab ${activeTab === 'schedules' ? 'active' : ''}`} onClick={() => setActiveTab('schedules')}>
            <Calendar size={16} /> Schedules
          </button>
          <button className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <Download size={16} /> Reports
          </button>
        </div>

      </div>

      {/* Tab Content */}
      <div className="page-content" style={{ flex: 1 }}>
        {activeTab === 'dashboard' && report && (
          <>
            <div className="grid grid-cols-4 mb-4">
              <div className="card text-center" style={{ padding: '1.5rem' }}>
                <div className="flex items-center justify-center mb-2" style={{ color: '#3b82f6', background: '#eff6ff', width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto' }}>
                  <Users size={20} />
                </div>
                <p className="kpi-title">Total Records</p>
                <h2 className="kpi-value">{report.stats.total_records}</h2>
              </div>
              <div className="card text-center" style={{ padding: '1.5rem' }}>
                <div className="flex items-center justify-center mb-2" style={{ color: '#10b981', background: '#dcfce7', width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto' }}>
                  <Clock size={20} />
                </div>
                <p className="kpi-title">Total Hours Today</p>
                <h2 className="kpi-value">{Number(report.stats.total_hours).toFixed(1)}</h2>
              </div>
              <div className="card text-center" style={{ padding: '1.5rem' }}>
                <div className="flex items-center justify-center mb-2" style={{ color: '#8b5cf6', background: '#f3e8ff', width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto' }}>
                  <CheckCircle size={20} />
                </div>
                <p className="kpi-title">Avg Productivity</p>
                <h2 className="kpi-value">{Number(report.stats.avg_productivity).toFixed(0)}%</h2>
              </div>
              <div className="card text-center" style={{ padding: '1.5rem' }}>
                <div className="flex items-center justify-center mb-2" style={{ color: '#f59e0b', background: '#fef3c7', width: '40px', height: '40px', borderRadius: '50%', margin: '0 auto' }}>
                  <Clock size={20} />
                </div>
                <p className="kpi-title">Total Overtime Today</p>
                <h2 className="kpi-value">{Number(report.stats.total_overtime || 0).toFixed(1)} hrs</h2>
              </div>
            </div>

            <div className="grid grid-cols-2 mb-4">
              <div className="card text-center" style={{ padding: '1.5rem' }}>
                <p className="kpi-title">On Time Arrivals Today</p>
                <h2 className="kpi-value" style={{ color: '#10b981' }}>
                  {todayRecords.filter(r => r.status === 'present').length}
                </h2>
              </div>
              <div className="card text-center" style={{ padding: '1.5rem' }}>
                <p className="kpi-title">Late Arrivals Today</p>
                <h2 className="kpi-value" style={{ color: '#f59e0b' }}>
                  {todayRecords.filter(r => r.status === 'late').length}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="card">
                <h3 className="mb-1">Today's Status Distribution</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Breakdown by attendance status</p>
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.status_distribution.map(s => ({ name: s.status, value: s.count }))}
                        cx="50%" cy="50%" outerRadius={80} dataKey="value" label
                      >
                        {report.status_distribution.map((entry, index) => (
                          <Cell key={index} fill={getPieColor(entry)} />
                        ))}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card">
                <h3 className="mb-1">Hours Worked Today</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Regular + Overtime per employee</p>
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.employee_hours}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                      <Bar dataKey="hours_worked" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Regular Hours" />
                      <Bar dataKey="overtime_hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Overtime" />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── ATTENDANCE TAB ─────────────────────────────────────────── */}
        {activeTab === 'attendance' && (
          <>
            <div className="flex-split mb-4">
              <div>
                <h2 style={{ fontSize: '1.5rem' }}>Attendance Records</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>View and filter employee attendance history</p>
              </div>
              <button className="btn btn-outline" onClick={() => window.print()}>
                <Download size={18} /> Export
              </button>
            </div>

            <div className="grid grid-cols-4 mb-4">
              <div className="card text-center" style={{ padding: '1.5rem' }}>
                <p className="kpi-title">Total Records</p>
                <h2 className="kpi-value" style={{ color: '#1e293b' }}>{attendanceRecords.length}</h2>
              </div>
              <div className="card text-center" style={{ padding: '1.5rem' }}>
                <p className="kpi-title">On Time</p>
                <h2 className="kpi-value" style={{ color: '#10b981' }}>
                  {attendanceRecords.filter(r => r.status === 'present').length}
                </h2>
              </div>
              <div className="card text-center" style={{ padding: '1.5rem' }}>
                <p className="kpi-title">Late Arrivals</p>
                <h2 className="kpi-value" style={{ color: '#f59e0b' }}>
                  {attendanceRecords.filter(r => r.status === 'late').length}
                </h2>
              </div>
              <div className="card text-center" style={{ padding: '1.5rem' }}>
                <p className="kpi-title">Total Hours</p>
                <h2 className="kpi-value" style={{ color: '#3b82f6' }}>
                  {attendanceRecords.reduce((acc, r) => acc + Number(r.hours_worked || 0), 0).toFixed(1)}
                </h2>
              </div>
            </div>

            {/* Contribution Calendar */}
            <div className="card mb-4" style={{ padding: '1.5rem' }}>
              <h3 className="mb-1">Employee Activity Calendar</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>365-day check-in contribution history</p>
              <div className="mb-4">
                <select
                  className="input-base"
                  style={{ width: '300px' }}
                  value={selectedCalendarEmployee}
                  onChange={e => setSelectedCalendarEmployee(e.target.value)}
                >
                  <option value="">Select an Employee...</option>
                  {Array.from(new Map(attendanceRecords.map(r => [r.employee_id, r.name])).entries()).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
              <ContributionCalendar attendanceRecords={attendanceRecords} employeeId={selectedCalendarEmployee} />
            </div>

            {/* Records Table */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 className="mb-1">All Records</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Filter and search attendance records</p>
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  className="input-base"
                  style={{ flex: 1 }}
                  placeholder="Search by employee name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <select className="input-base" style={{ width: '180px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option>All Status</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Hours</th>
                      <th>Overtime</th>
                      <th>Productivity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr><td colSpan="9" className="text-center">No records found.</td></tr>
                    ) : filteredRecords.map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)' }}>{getDateString(r.date)}</td>
                        <td style={{ fontWeight: 600 }}>{r.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{r.department}</td>
                        <td style={{ color: '#10b981' }}><Clock size={14} style={{ display: 'inline', marginBottom: '-2px' }} /> {getTimeString(r.check_in)}</td>
                        <td style={{ color: '#ef4444' }}>{r.check_out ? <><Clock size={14} style={{ display: 'inline', marginBottom: '-2px' }} /> {getTimeString(r.check_out)}</> : '--'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{r.hours_worked > 0 ? `${r.hours_worked} hrs` : '--'}</td>
                        <td>
                          {Number(r.overtime_hours) > 0
                            ? <span style={{ color: '#8b5cf6', fontWeight: 700 }}>+{r.overtime_hours} hrs</span>
                            : <span style={{ color: 'var(--text-muted)' }}>--</span>}
                        </td>
                        <td>
                          <div className="flex items-center gap-4">
                            <div className="progress-bar-bg">
                              <div className="progress-bar-fill"
                                style={{
                                  width: `${Math.min(r.productivity_score || 0, 100)}%`,
                                  background: getProductivityColor(r.productivity_score)
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: getProductivityColor(r.productivity_score) }}>
                              {r.productivity_score}%
                            </span>
                          </div>
                        </td>
                        <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ─── EMPLOYEES TAB ─────────────────────────────────────────── */}
        {activeTab === 'employees' && (
          <EmployeeCrud hideHeader={true} />
        )}

        {/* ─── SCHEDULES TAB ─────────────────────────────────────────── */}
        {activeTab === 'schedules' && (
          <>
            <div className="flex-split mb-4">
              <div>
                <h2 style={{ fontSize: '1.5rem' }}>Schedule Management</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Define shift times and work days per employee</p>
              </div>
            </div>

            <div className="table-wrapper" style={{ background: 'white', borderRadius: '12px' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Shift Start</th>
                    <th>Shift End</th>
                    <th>Work Days</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.employee_id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{s.department}</td>
                      <td>
                        {editingSchedule?.employee_id === s.employee_id ? (
                          <input type="time" className="input-base" style={{ width: '130px', padding: '0.4rem 0.6rem' }}
                            value={editingSchedule.shift_start}
                            onChange={e => setEditingSchedule({ ...editingSchedule, shift_start: e.target.value })}
                          />
                        ) : <span style={{ color: '#3b82f6', fontWeight: 600 }}>{s.shift_start?.slice(0, 5)}</span>}
                      </td>
                      <td>
                        {editingSchedule?.employee_id === s.employee_id ? (
                          <input type="time" className="input-base" style={{ width: '130px', padding: '0.4rem 0.6rem' }}
                            value={editingSchedule.shift_end}
                            onChange={e => setEditingSchedule({ ...editingSchedule, shift_end: e.target.value })}
                          />
                        ) : <span style={{ color: '#ef4444', fontWeight: 600 }}>{s.shift_end?.slice(0, 5)}</span>}
                      </td>
                      <td>
                        {editingSchedule?.employee_id === s.employee_id ? (
                          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                            {DAYS.map(d => (
                              <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                <input type="checkbox"
                                  checked={editingSchedule.work_days.split(',').includes(d)}
                                  onChange={e => {
                                    const days = editingSchedule.work_days.split(',').filter(x => x);
                                    const newDays = e.target.checked
                                      ? [...days, d]
                                      : days.filter(x => x !== d);
                                    setEditingSchedule({ ...editingSchedule, work_days: newDays.join(',') });
                                  }}
                                /> {d}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                            {DAYS.map(d => (
                              <span key={d} style={{
                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                                background: s.work_days?.split(',').includes(d) ? '#eff6ff' : '#f1f5f9',
                                color: s.work_days?.split(',').includes(d) ? '#3b82f6' : '#94a3b8'
                              }}>{d}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        {editingSchedule?.employee_id === s.employee_id ? (
                          <div className="flex gap-4">
                            <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => handleScheduleSave(editingSchedule)}>Save</button>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => setEditingSchedule(null)}>Cancel</button>
                          </div>
                        ) : (
                          <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                            onClick={() => setEditingSchedule({ ...s })}>
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Productivity legend */}
            <div className="card mt-4" style={{ padding: '1.5rem' }}>
              <h3 className="mb-1">Productivity & Overtime Guide</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>How the system computes productivity from attendance data</p>
              <div className="grid grid-cols-4">
                <div style={{ textAlign: 'center', padding: '1rem', background: '#fef2f2', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>0–49%</div>
                  <div style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '0.25rem' }}>Poor Performance</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Less than 4 hours worked</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#fef9c3', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>50–74%</div>
                  <div style={{ fontSize: '0.85rem', color: '#f59e0b', marginTop: '0.25rem' }}>Satisfactory</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>4–6 hours worked</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#dcfce7', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>75–99%</div>
                  <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.25rem' }}>Good Performance</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>6–8 hours worked</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f3e8ff', borderRadius: '12px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>100–120%</div>
                  <div style={{ fontSize: '0.85rem', color: '#8b5cf6', marginTop: '0.25rem' }}>Overtime</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Above 8 hours</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ─── REPORTS TAB ─────────────────────────────────────────── */}
        {activeTab === 'reports' && report && (
          <>
            {/* Config bar */}
            <div className="flex-split mb-4">
              <div>
                <h2 style={{ fontSize: '1.5rem', color: '#CC1111' }}>Reports & Analytics</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Comprehensive store attendance insights</p>
              </div>
              <button className="btn btn-primary" onClick={() => window.print()}><Download size={16} /> Export PDF</button>
            </div>

            <div className="card mb-4" style={{ padding: '1.5rem', borderLeft: '4px solid #CC1111' }}>
              <div className="flex gap-4">
                <div style={{ flex: 1 }}>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#CC1111' }}>Report Period</label>
                  <select className="input-base" value={rPeriod} onChange={e => setRPeriod(e.target.value)}>
                    <option value="all">All Time</option>
                    <option value="daily">Today</option>
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                    <option value="yearly">This Year</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#CC1111' }}>Employee Filter</label>
                  <select className="input-base" value={rEmployee} onChange={e => setREmployee(e.target.value)}>
                    <option value="">All Employees</option>
                    {Array.from(new Map(attendanceRecords.map(r => [r.employee_id, r.name])).entries()).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="block text-sm font-semibold mb-1" style={{ color: '#CC1111' }}>Department</label>
                  <select className="input-base" value={rDept} onChange={e => setRDept(e.target.value)}>
                    <option value="">All Departments</option>
                    {[...new Set(attendanceRecords.map(r => r.department))].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Summary KPI row */}
            <div className="grid grid-cols-4 mb-4">
              {[{
                label: 'Total Check-ins', value: filteredReportRecords.length, color: '#CC1111'
              }, {
                label: 'On Time Rate', value: filteredReportRecords.length ? Math.round(filteredReportRecords.filter(r => r.status === 'present').length / filteredReportRecords.length * 100) + '%' : '0%', color: '#1a9c3e'
              }, {
                label: 'Late Rate', value: filteredReportRecords.length ? Math.round(filteredReportRecords.filter(r => r.status === 'late').length / filteredReportRecords.length * 100) + '%' : '0%', color: '#b45309'
              }, {
                label: 'Total Overtime', value: filteredReportRecords.reduce((a, r) => a + Number(r.overtime_hours || 0), 0).toFixed(1) + ' hrs', color: '#7c3aed'
              }].map((kpi, i) => (
                <div key={i} className="card text-center" style={{ padding: '1.25rem', borderTop: `3px solid ${kpi.color}` }}>
                  <p className="kpi-title">{kpi.label}</p>
                  <h2 className="kpi-value" style={{ color: kpi.color, fontSize: '1.75rem' }}>{kpi.value}</h2>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 mb-4">
              <div className="card">
                <h3 className="mb-1">Attendance Status Distribution</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Present vs Late vs Absent</p>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredStatusDist.map(s => ({ name: s.status, value: s.count }))}
                        cx="50%" cy="50%" outerRadius={90} innerRadius={40} dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {filteredStatusDist.map((entry, index) => (
                          <Cell key={index} fill={getPieColor(entry)} />
                        ))}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h3 className="mb-1">Hours Worked per Employee</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Regular + Overtime hours</p>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredEmpHours}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                      <Tooltip cursor={{ fill: 'rgba(204,17,17,0.04)' }} />
                      <Legend />
                      <Bar dataKey="hours_worked" fill="#CC1111" radius={[4, 4, 0, 0]} name="Regular Hours" />
                      <Bar dataKey="overtime_hours" fill="#FFD600" radius={[4, 4, 0, 0]} name="Overtime" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 mb-4">
              <div className="card">
                <h3 className="mb-1">Department vs Attendance Records</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Check-ins by department</p>
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredDeptDist} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                      <YAxis dataKey="department" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={80} />
                      <Tooltip cursor={{ fill: 'rgba(26,156,62,0.04)' }} />
                      <Legend />
                      <Bar dataKey="count" fill="#1a9c3e" radius={[0, 4, 4, 0]} name="Records" />
                      <Bar dataKey="total_hours" fill="#FFD600" radius={[0, 4, 4, 0]} name="Total Hours" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h3 className="mb-1">Productivity Breakdown</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Score distribution per employee</p>
                <div className="table-wrapper" style={{ maxHeight: '240px', overflow: 'auto' }}>
                  <table className="table">
                    <thead><tr><th>Employee</th><th>Avg Score</th><th>Trend</th></tr></thead>
                    <tbody>
                      {Array.from(
                        filteredReportRecords.reduce((map, r) => {
                          if (!map.has(r.name)) map.set(r.name, []);
                          map.get(r.name).push(Number(r.productivity_score || 0));
                          return map;
                        }, new Map())
                      ).map(([name, scores]) => {
                        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                        return (
                          <tr key={name}>
                            <td style={{ fontWeight: 600 }}>{name}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ flex: 1, height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(avg, 100)}%`, height: '100%', background: getProductivityColor(avg), borderRadius: '4px' }} />
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: getProductivityColor(avg) }}>{avg}%</span>
                              </div>
                            </td>
                            <td><span style={{ color: avg >= 75 ? '#1a9c3e' : '#CC1111', fontSize: '0.8rem', fontWeight: 700 }}>{avg >= 75 ? '▲ Good' : '▼ Low'}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>{/* end page-content */}
    </div>
  );
}
