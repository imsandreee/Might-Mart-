import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import logo from '../assets/logo.png';

export default function EmployeePortal() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [activeWorkers, setActiveWorkers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const empRes = await fetch('http://localhost:5000/api/employees');
      const empData = await empRes.json();
      setEmployees(empData);

      const attRes = await fetch('http://localhost:5000/api/attendance/today');
      const attData = await attRes.json();
      // Only active ones (no check_out)
      setActiveWorkers(attData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedUser) return alert('Select an employee first');
    try {
      await fetch('http://localhost:5000/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: selectedUser })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckOut = async (empId) => {
    try {
      await fetch('http://localhost:5000/api/attendance/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: empId })
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getTimeString = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group check ins for UI
  const currentlyCheckedIn = activeWorkers.filter(w => !w.check_out);
  const recentActivity = activeWorkers; // we can show all today's activity here

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Header */}
      <div className="brand-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src={logo} alt="Mightee Mart" style={{ height: '48px', borderRadius: '6px' }} />
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#CC1111', lineHeight: 1 }}>Mightee Mart</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1a9c3e', letterSpacing: '0.06em' }}>YOUR 24/7 GROCERY STORE</div>
          </div>
        </div>
      </div>

      <div className="page-content" style={{ flex: 1 }}>
        {/* Navbar segment */}
      <div className="navbar">
        <div className="navbar-brand">
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => navigate('/')}>
            <ArrowLeft size={18} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem' }}>Employee Portal</h1>
            <p style={{ fontSize: '0.85rem' }}>Mightee Mart Store</p>
          </div>
        </div>
        <div className="nav-time">
          <strong>{time.toLocaleTimeString()}</strong>
          <span>{time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Select Profile Card */}
      <div className="card mb-4" style={{ padding: '1.5rem 2rem' }}>
        <h3 className="mb-1">Select Your Profile</h3>
        <p className="mb-4 text-sm">Choose your employee profile to check-in or check-out</p>
        
        <div className="flex items-center gap-4">
          <div className="w-full">
            <label className="mb-1 block" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Employee</label>
            <select 
              className="input-base" 
              value={selectedUser} 
              onChange={e => setSelectedUser(e.target.value)}
            >
              <option value="">Select your name</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} - {e.role}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '1.4rem' }} onClick={handleCheckIn}>
            Check-in
          </button>
        </div>
      </div>

      {/* Currently Checked In */}
      <div className="mb-4">
        <h3 className="mb-1">Currently Checked In</h3>
        <p className="mb-2 text-sm">Employees currently working</p>
        
        <div className="card" style={{ padding: '1rem' }}>
          {currentlyCheckedIn.length === 0 ? <p className="text-center py-4">No one currently checked in.</p> : currentlyCheckedIn.map(w => (
            <div key={w.id} className="list-item">
              <div className="list-item-left">
                <div className="avatar"><Users size={20} /></div>
                <div>
                  <h4 style={{ fontSize: '1rem' }}>{w.name}</h4>
                  <p style={{ fontSize: '0.85rem' }}>{w.role} • {w.department}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Checked in: {getTimeString(w.check_in)}</div>
                </div>
                <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => handleCheckOut(w.employee_id)}>
                  Check Out
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="mb-1">Recent Activity</h3>
        <p className="mb-2 text-sm">Latest attendance records</p>
        
        <div className="card" style={{ padding: '1rem' }}>
          {recentActivity.slice(0, 5).map(record => (
            <div key={record.id} className="list-item">
              <div className="list-item-left">
                <div className="avatar" style={{ background: '#f1f5f9', color: '#64748b' }}><Users size={20} /></div>
                <div>
                  <h4 style={{ fontSize: '1rem' }}>{record.name}</h4>
                  <p style={{ fontSize: '0.85rem' }}>{record.role}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div style={{ fontSize: '0.85rem' }}>
                   {getTimeString(record.check_in)} {record.check_out && `- ${getTimeString(record.check_out)}`}
                   {record.hours_worked > 0 && <span style={{display: 'block', color:'#64748b'}}>{record.hours_worked} hrs</span>}
                </div>
                <span className={`badge ${record.status}`}>
                  {record.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
