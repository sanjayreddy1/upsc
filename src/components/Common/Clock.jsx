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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', margin: '20px 0', width: '100%' }}>
      <SplitFlapText 
        text={dateStr} 
        fontSize="clamp(14px, 5vw, 28px)"
        gap="0.15em"
        padTo={12}
        charset="alphanumeric"
        tileColor="#0f172a"
        textColor="#f8fafc"
        flipDuration={0.05}
      />
      <SplitFlapText 
        text={timeStr} 
        fontSize="clamp(22px, 7.5vw, 42px)"
        gap="0.15em"
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
