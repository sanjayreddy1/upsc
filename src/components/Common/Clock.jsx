import { useState, useEffect } from 'react';
import SplitFlapText from './SplitFlapText';

export default function Clock() {
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      
      const date = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).toUpperCase();
      setDateStr(date);

      const time = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' IST';
      setTimeStr(time);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', margin: '20px 0' }}>
      <SplitFlapText 
        text={dateStr} 
        fontSize={28}
        padTo={12}
        charset="alphanumeric"
        tileColor="#1e293b"
      />
      <SplitFlapText 
        text={timeStr} 
        fontSize={42}
        padTo={12}
        charset="alphanumeric"
        tileColor="#0f172a"
        textColor="#38bdf8"
        flipDuration={0.12}
        flipsPerChar={0}
      />
    </div>
  );
}
