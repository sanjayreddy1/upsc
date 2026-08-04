import { useState, useEffect, useRef, useCallback } from 'react';
import './Timer.css';

export default function Timer({ duration = 900, onTimeUp, autoStart = false, label = 'Time Remaining' }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [running, setRunning] = useState(autoStart);
  const intervalRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    const percent = (timeLeft / duration) * 100;
    if (percent <= 10) return 'timer critical';
    if (percent <= 25) return 'timer warning';
    return 'timer';
  };

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            onTimeUp?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [running, timeLeft, onTimeUp]);

  const toggle = () => setRunning(!running);
  const reset = () => {
    clearInterval(intervalRef.current);
    setTimeLeft(duration);
    setRunning(false);
  };

  return (
    <div className={getTimerClass()}>
      <span className="timer-label">{label}</span>
      <span className="timer-display">{formatTime(timeLeft)}</span>
      <div className="timer-controls">
        <button className="btn btn-sm btn-secondary" onClick={toggle}>
          {running ? '⏸ Pause' : '▶ Start'}
        </button>
        <button className="btn btn-sm btn-secondary" onClick={reset}>
          ↺ Reset
        </button>
      </div>
      <div className="timer-bar">
        <div
          className="timer-bar-fill"
          style={{ width: `${(timeLeft / duration) * 100}%` }}
        />
      </div>
    </div>
  );
}
