import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, X, Search, Users, Camera, Barcode as BarcodeIcon } from 'lucide-react';
import Barcode from 'react-barcode';
import logo from '../assets/logo.png';

const EMPTY_FORM = { 
  id: null, 
  name: '', 
  role: '', 
  department: '', 
  shift_start: '09:00', 
  shift_end: '17:00', 
  work_days: 'Mon,Tue,Wed,Thu,Fri',
  photo_url: null
};
const DEPARTMENTS = ['Sales', 'Inventory', 'Operations', 'Security', 'Management'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function EmployeeCrud({ hideHeader = false }) {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showBarcode, setShowBarcode] = useState(null); // stores employee for barcode view

  const authHeader = () => ({
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  });

  useEffect(() => { fetchEmployees(); }, []);

  useEffect(() => {
    let result = employees;
    if (searchQuery) result = result.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.role.toLowerCase().includes(searchQuery.toLowerCase()));
    if (deptFilter !== 'All') result = result.filter(e => e.department === deptFilter);
    setFilteredEmployees(result);
  }, [employees, searchQuery, deptFilter]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/employees');
      const data = await res.json();
      setEmployees(data);
    } catch (err) { console.error(err); }
  };

  const openAddModal = () => { setForm(EMPTY_FORM); setPhotoFile(null); setPhotoPreview(null); setShowModal(true); };
  const openEditModal = (emp) => { 
    setForm({ 
      id: emp.id, 
      name: emp.name, 
      role: emp.role, 
      department: emp.department,
      shift_start: emp.shift_start ? emp.shift_start.slice(0, 5) : '09:00',
      shift_end: emp.shift_end ? emp.shift_end.slice(0, 5) : '17:00',
      work_days: emp.work_days || 'Mon,Tue,Wed,Thu,Fri',
      photo_url: emp.photo_url
    }); 
    setPhotoPreview(emp.photo_url ? `http://localhost:5000${emp.photo_url}` : null);
    setPhotoFile(null);
    setShowModal(true); 
  };
  const closeModal = () => { setShowModal(false); setForm(EMPTY_FORM); setPhotoFile(null); setPhotoPreview(null); };

  const handleDayToggle = (day) => {
    const days = form.work_days.split(',').filter(d => d);
    if (days.includes(day)) {
      setForm({ ...form, work_days: days.filter(d => d !== day).join(',') });
    } else {
      // Keep order
      const newDays = WEEKDAYS.filter(d => days.includes(d) || d === day).join(',');
      setForm({ ...form, work_days: newDays });
    }
  };

  const confirmDeleteEmployee = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/employees/${id}`, { 
        method: 'DELETE', 
        headers: authHeader() 
      });
      
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
      fetchEmployees();
    } catch (err) { 
      console.error('Delete error:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null) formData.append(key, form[key]);
      });
      if (photoFile) formData.append('photo', photoFile);

      const url = form.id 
        ? `http://localhost:5000/api/employees/${form.id}`
        : 'http://localhost:5000/api/employees';
      
      const method = form.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
        body: formData
      });

      if (!res.ok) throw new Error('Failed to save employee');

      closeModal();
      fetchEmployees();
    } catch (err) { 
      console.error(err); 
      alert(err.message);
    }
    setSaving(false);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const deptColor = { Sales: '#CC1111', Inventory: '#1a9c3e', Operations: '#2563eb', Security: '#7c3aed', Management: '#b45309' };

  return (
    <div>
      {/* standalone page header */}
      {!hideHeader && (
        <div className="brand-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate('/admin')} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '6px', padding: '0.4rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.875rem' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <img src={logo} alt="Mightee Mart" style={{ height: '40px', borderRadius: '4px' }} />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#CC1111' }}>Employee Management</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1a9c3e' }}>MIGHTEE MART STORE</div>
            </div>
          </div>
        </div>
      )}

      {/* content */}
      <div style={{ padding: hideHeader ? 0 : '2rem' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: '#CC1111', marginBottom: '0.2rem' }}>Employee Management</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{filteredEmployees.length} of {employees.length} employees shown</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.2rem', padding: '0.6rem 1rem 0.6rem 2.2rem', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', width: '220px' }}
              />
            </div>
            {/* Dept filter */}
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              style={{ padding: '0.6rem 1rem', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', background: 'white' }}>
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <button onClick={openAddModal}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#CC1111', color: 'white', border: 'none', borderRadius: '8px', padding: '0.65rem 1.25rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(204,17,17,0.25)' }}>
              <Plus size={16} /> Add Employee
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
                {['#', 'Name', 'Position', 'Department', 'Email', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                  <Users size={36} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.3 }} />
                  No employees found
                </td></tr>
              ) : filteredEmployees.map((emp, i) => (
                <tr key={emp.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={{ padding: '1rem 1.25rem', color: '#9ca3af', fontSize: '0.875rem' }}>EMP{String(emp.id).padStart(3, '0')}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {emp.photo_url ? (
                        <img 
                          src={`http://localhost:5000${emp.photo_url}`} 
                          alt={emp.name} 
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} 
                        />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff1f1', color: '#CC1111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>
                          {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      )}
                      <span style={{ fontWeight: 700 }}>{emp.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#6b7280' }}>{emp.role}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ background: (deptColor[emp.department] || '#6b7280') + '18', color: deptColor[emp.department] || '#6b7280', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
                      {emp.department}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#6b7280', fontSize: '0.875rem' }}>{emp.name.split(' ')[0].toLowerCase()}@mighteemart.com</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ background: '#e8f5e9', color: '#1a9c3e', padding: '0.2rem 0.7rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active</span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => setShowBarcode(emp)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', border: '1.5px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit' }}>
                        <BarcodeIcon size={13} /> Barcode
                      </button>
                      <button onClick={() => openEditModal(emp)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', border: '1.5px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit' }}>
                        <Edit size={13} /> Edit
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); confirmDeleteEmployee(emp.id, emp.name); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem', border: '1.5px solid #fecaca', borderRadius: '6px', background: '#fef2f2', color: '#CC1111', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit' }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box">
            <div className="modal-header">
              <div>
                <h3 style={{ color: 'white', fontSize: '1.1rem', margin: 0 }}>{form.id ? 'Edit Employee' : 'Add New Employee'}</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{form.id ? 'Update employee information' : 'Fill in the details below'}</p>
              </div>
              <button onClick={closeModal}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer', color: 'white', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '12px', background: '#f3f4f6', border: '2px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Camera size={32} style={{ color: '#9ca3af' }} />
                      )}
                    </div>
                    <label htmlFor="photo-upload" style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: '#CC1111', color: 'white', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                      <Plus size={16} />
                      <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                    </label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#111827' }}>Employee Photo</h4>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>Upload a clear headshot. JPG/PNG supported.</p>
                  </div>
                </div>

                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name *</label>
                  <input type="text" required className="input-base" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Juan Dela Cruz" />
                </div>
                <div style={{ marginBottom: '1.1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role / Job Title *</label>
                  <input type="text" required className="input-base" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Cashier" />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department *</label>
                  <select required className="input-base" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Schedule Management
                  </h4>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', marginBottom: '0.25rem' }}>Shift Start</label>
                      <input type="time" required className="input-base" style={{ padding: '0.4rem' }} value={form.shift_start} onChange={e => setForm({ ...form, shift_start: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', marginBottom: '0.25rem' }}>Shift End</label>
                      <input type="time" required className="input-base" style={{ padding: '0.4rem' }} value={form.shift_end} onChange={e => setForm({ ...form, shift_end: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', marginBottom: '0.5rem' }}>Work Days</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {WEEKDAYS.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          style={{
                            padding: '0.3rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: '1.5px solid',
                            transition: 'all 0.1s',
                            background: form.work_days.split(',').includes(day) ? '#CC1111' : 'white',
                            borderColor: form.work_days.split(',').includes(day) ? '#CC1111' : '#e5e7eb',
                            color: form.work_days.split(',').includes(day) ? 'white' : '#6b7280'
                          }}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" onClick={closeModal}
                    style={{ flex: 1, padding: '0.75rem', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    style={{ flex: 2, padding: '0.75rem', background: saving ? '#f87171' : '#CC1111', border: 'none', borderRadius: '8px', color: 'white', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(204,17,17,0.25)' }}>
                    {saving ? 'Saving...' : form.id ? '✓ Save Changes' : '✓ Add Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* ── BARCODE MODAL ── */}
      {showBarcode && (
        <div className="modal-overlay" onClick={() => setShowBarcode(null)}>
          <div className="modal-box" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header">
              <h3 style={{ color: 'white', margin: 0 }}>Employee Barcode</h3>
              <button onClick={() => setShowBarcode(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '1rem', color: '#CC1111' }}>{showBarcode.name}</div>
              <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'inline-block' }}>
                <Barcode value={showBarcode.barcode || `EMP${String(showBarcode.id).padStart(4, '0')}`} height={60} width={1.5} fontSize={14} />
              </div>
              <p style={{ marginTop: '1.5rem', color: '#6b7280', fontSize: '0.85rem' }}>Scan this code at the employee portal for check-in/out.</p>
              <button onClick={() => window.print()} style={{ marginTop: '1rem', background: '#CC1111', color: 'white', border: 'none', borderRadius: '8px', padding: '0.6rem 1.2rem', fontWeight: 600, cursor: 'pointer' }}>Print Barcode</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
