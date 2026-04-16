import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Camera, Scan, CheckCircle, XCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import logo from '../assets/logo.png';

export default function EmployeePortal() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [activeWorkers, setActiveWorkers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [time, setTime] = useState(new Date());
  const [isScanning, setIsScanning] = useState(false);
  const [verifyingUser, setVerifyingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const attRes = await fetch('http://localhost:5000/api/attendance/today');
      const attData = await attRes.json();
      setActiveWorkers(attData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 250 });
      scanner.render(onScanSuccess, onScanError);
      return () => scanner.clear();
    }
  }, [isScanning]);

  async function onScanSuccess(decodedText) {
    setIsScanning(false);
    try {
      const res = await fetch(`http://localhost:5000/api/employees/barcode/${decodedText}`);
      if (!res.ok) throw new Error('Employee not found');
      const data = await res.json();
      setVerifyingUser(data);
    } catch (err) {
      alert('Invalid Barcode: ' + err.message);
    }
  }

  function onScanError(err) {
    // console.warn(err);
  }

  const captureSnapshot = async () => {
    const video = document.querySelector('.verification-video');
    if (!video) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
  };

  const handleAttendance = async (empId, type) => {
    setLoading(true);
    try {
      const snapshotBlob = await captureSnapshot();
      const formData = new FormData();
      formData.append('employee_id', empId);
      if (snapshotBlob) formData.append('photo', snapshotBlob, 'snapshot.jpg');

      const url = `http://localhost:5000/api/attendance/${type === 'in' ? 'check-in' : 'check-out'}?type=attendance`;
      const res = await fetch(url, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setVerifyingUser(null);
        fetchData();
      } else {
        alert(data.message || 'Error occurred');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
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

      {/* Main Action Area */}
      <div className="card mb-4" style={{ padding: '2rem', textAlign: 'center' }}>
        {!isScanning ? (
          <div>
            <div style={{ width: '80px', height: '80px', background: '#fff1f1', color: '#CC1111', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Scan size={40} />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Attendance Kiosk</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Please scan your employee barcode to check-in or check-out.</p>
            <button className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 700 }} onClick={() => setIsScanning(true)}>
              Start Scanning
            </button>
          </div>
        ) : (
          <div>
             <div id="reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
             <button className="btn btn-secondary mt-4" onClick={() => setIsScanning(false)}>Cancel Scan</button>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {verifyingUser && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'white' }}>Profile Verification</h3>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                <div>
                   <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', marginBottom: '0.5rem' }}>PROFILE PHOTO</p>
                   {verifyingUser.photo_url ? (
                     <img src={`http://localhost:5000${verifyingUser.photo_url}`} style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #CC1111' }} alt="Profile" />
                   ) : (
                     <div style={{ width: '120px', height: '120px', borderRadius: '12px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CC1111', fontWeight: 800, fontSize: '2rem' }}>
                       {verifyingUser.name[0]}
                     </div>
                   )}
                </div>
                <div>
                   <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', marginBottom: '0.5rem' }}>LIVE CAPTURE</p>
                   <div style={{ width: '120px', height: '120px', borderRadius: '12px', background: '#000', overflow: 'hidden', border: '2px solid #1a9c3e' }}>
                      <video autoPlay playsInline className="verification-video" style={{ width: '100%', height: '100%', objectFit: 'cover' }} ref={el => {
                        if (el && !el.srcObject) {
                          navigator.mediaDevices.getUserMedia({ video: true }).then(s => el.srcObject = s);
                        }
                      }} />
                   </div>
                </div>
              </div>

              <h2 style={{ color: '#CC1111', marginBottom: '0.5rem' }}>Is this you?</h2>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{verifyingUser.name}</div>
              <p style={{ color: '#6b7280', marginBottom: '2rem' }}>{verifyingUser.role} • {verifyingUser.department}</p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary flex-1" onClick={() => setVerifyingUser(null)}>
                  <XCircle size={18} /> No, Cancel
                </button>
                {activeWorkers.find(w => w.employee_id === verifyingUser.id && !w.check_out) ? (
                  <button className="btn btn-primary flex-1" style={{ background: '#b45309' }} onClick={() => handleAttendance(verifyingUser.id, 'out')} disabled={loading}>
                    <CheckCircle size={18} /> {loading ? 'Processing...' : 'Yes, Check Out'}
                  </button>
                ) : (
                  <button className="btn btn-primary flex-1" onClick={() => handleAttendance(verifyingUser.id, 'in')} disabled={loading}>
                    <CheckCircle size={18} /> {loading ? 'Processing...' : 'Yes, Check In'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Currently Checked In */}
      <div className="mb-4">
        <h3 className="mb-1">Currently Checked In</h3>
        <p className="mb-2 text-sm">Employees currently working</p>
        
        <div className="card" style={{ padding: '1rem' }}>
          {currentlyCheckedIn.length === 0 ? <p className="text-center py-4">No one currently checked in.</p> : currentlyCheckedIn.map(w => (
            <div key={w.id} className="list-item">
              <div className="list-item-left">
                <div className="avatar">
                   {w.photo_url ? <img src={`http://localhost:5000${w.photo_url}`} style={{width:'100%',height:'100%',borderRadius:'50%'}}/> : <Users size={20} />}
                </div>
                <div>
                   <h4 style={{ fontSize: '1rem' }}>{w.name}</h4>
                   <p style={{ fontSize: '0.85rem' }}>{w.role} • {w.department}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Checked in: {getTimeString(w.check_in)}</div>
                </div>
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
                <div className="avatar" style={{ background: '#f1f5f9', color: '#64748b' }}>
                   {record.captured_photo ? (
                     <img src={`http://localhost:5000${record.captured_photo}`} style={{width:'100%',height:'100%',borderRadius:'50%', objectFit: 'cover'}}/>
                   ) : <Users size={20} />}
                </div>
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
