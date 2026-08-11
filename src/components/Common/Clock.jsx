import { useState, useEffect } from 'react';
import SplitFlapText from './SplitFlapText';

const QUOTES = [
  "Time is the wisest counselor of all. - Pericles ⏳",
  "The two most powerful warriors are patience and time. - Leo Tolstoy 🕰️",
  "Time is a created thing. To say 'I don't have time,' is like saying, 'I don't want to.' - Lao Tzu ⏱️"
];

export default function Clock() {
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
    }, 3000);
    return () => clearInterval(quoteTimer);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      
      const date = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).toUpperCase();
      setDateStr(date);

      const time = now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
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
      <p style={{ marginTop: '16px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-secondary)', textAlign: 'center', minHeight: '30px', transition: 'all 0.3s ease', textTransform: 'capitalize' }}>
        {QUOTES[quoteIdx]}
      </p>
    </div>
  );
}
