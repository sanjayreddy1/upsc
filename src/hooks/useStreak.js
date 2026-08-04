import { useState, useEffect } from 'react';

export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);

  useEffect(() => {
    checkStreak();
  }, []);

  const getMidnight = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const checkStreak = () => {
    const data = localStorage.getItem('user_streak');
    if (!data) {
      setStreak(0);
      setCompletedToday(false);
      return;
    }

    try {
      const parsed = JSON.parse(data);
      const today = getMidnight();
      const lastCompleted = getMidnight(parsed.lastCompletedDate);

      const daysDifference = (today - lastCompleted) / (1000 * 60 * 60 * 24);

      if (daysDifference === 0) {
        // Completed today
        setStreak(parsed.currentStreak || 0);
        setCompletedToday(true);
      } else if (daysDifference === 1) {
        // Completed yesterday, streak is still alive, waiting for today's test
        setStreak(parsed.currentStreak || 0);
        setCompletedToday(false);
      } else {
        // Streak broken
        setStreak(0);
        setCompletedToday(false);
        // Save the broken streak state but don't erase history
        localStorage.setItem('user_streak', JSON.stringify({ ...parsed, currentStreak: 0 }));
      }
    } catch (e) {
      console.error('Failed to parse streak data', e);
      setStreak(0);
      setCompletedToday(false);
    }
  };

  const markDailyTestComplete = () => {
    const data = localStorage.getItem('user_streak');
    let currentStreak = 0;
    
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const today = getMidnight();
        const lastCompleted = getMidnight(parsed.lastCompletedDate);
        const daysDifference = (today - lastCompleted) / (1000 * 60 * 60 * 24);

        if (daysDifference === 0) {
          // Already completed today, do nothing
          return;
        } else if (daysDifference === 1) {
          // Consecutive day!
          currentStreak = (parsed.currentStreak || 0) + 1;
        } else {
          // Streak was broken or first time
          currentStreak = 1;
        }
      } catch (e) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    const payload = {
      currentStreak,
      lastCompletedDate: new Date().toISOString(),
    };

    localStorage.setItem('user_streak', JSON.stringify(payload));
    setStreak(currentStreak);
    setCompletedToday(true);
  };

  return { streak, completedToday, markDailyTestComplete, checkStreak };
}
