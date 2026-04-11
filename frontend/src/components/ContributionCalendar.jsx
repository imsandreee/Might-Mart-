import React from 'react';

// Generates an array of last 365 days
const generateCalendarDays = () => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day

  // Back 364 days so total is 365 (52 weeks roughly)
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
};

// Formats time safely
const formatTime = (timeStr) => {
    if (!timeStr) return '--';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ContributionCalendar({ attendanceRecords, employeeId }) {
  // If no employee selected, show nothing nicely
  if (!employeeId) {
      return <div className="text-center py-4" style={{color: 'var(--text-muted)'}}>Select an employee to view their attendance calendar</div>;
  }

  // Filter records to single employee
  const empRecords = attendanceRecords.filter(r => String(r.employee_id) === String(employeeId));

  // Create a fast lookup map: date string (YYYY-MM-DD) -> record
  const recordMap = {};
  empRecords.forEach(r => {
      const d = new Date(r.date);
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const dStr = String(d.getDate()).padStart(2, '0');
      recordMap[`${yStr}-${mStr}-${dStr}`] = r;
  });

  const days = generateCalendarDays();

  return (
    <div>
      <div className="calendar-wrapper">
        <div className="calendar-grid">
          {days.map((date, idx) => {
             const yStr = date.getFullYear();
             const mStr = String(date.getMonth() + 1).padStart(2, '0');
             const dStr = String(date.getDate()).padStart(2, '0');
             const dateKey = `${yStr}-${mStr}-${dStr}`;

             const record = recordMap[dateKey];
             let statusClass = '';
             let tooltipText = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

             if (record) {
                 statusClass = record.status === 'late' ? 'late' : 'present';
                 tooltipText += `\nCheck-In: ${formatTime(record.check_in)}\nCheck-Out: ${formatTime(record.check_out)}`;
             } else {
                 tooltipText += '\nNo record';
             }

             return (
               <div 
                 key={idx} 
                 className={`calendar-cell ${statusClass}`}
                 title={tooltipText}
               />
             );
          })}
        </div>
      </div>
      <div className="calendar-legend">
         <span>Legend:</span>
         <div className="legend-item">
            <div className="legend-box" style={{ background: '#ebedf0' }}></div>
            <span>No Record</span>
         </div>
         <div className="legend-item">
            <div className="legend-box" style={{ background: '#10b981' }}></div>
            <span>On Time / Present</span>
         </div>
         <div className="legend-item">
            <div className="legend-box" style={{ background: '#f59e0b' }}></div>
            <span>Late</span>
         </div>
      </div>
    </div>
  );
}
