import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [highestStreak, setHighestStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const fetchStreak = useCallback(async () => {
    if (token) {
      try {
        const res = await fetch('http://localhost:5000/api/user/streak', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const today = new Date().toLocaleDateString();
          const isCompletedToday = data.last_test_date === today && data.completed_today === true;
          
          let current = data.current_streak;
          if (!isCompletedToday && data.last_test_date !== new Date(Date.now() - 86400000).toLocaleDateString()) {
            if (data.last_test_date !== today) {
               current = 0; 
            }
          }
          
          setStreak(current);
          setHighestStreak(data.highest_streak);
          setCompletedToday(isCompletedToday);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Failed to fetch streak from DB', err);
      }
    }

    // Fallback to localStorage
    const data = localStorage.getItem('user_streak');
    if (data) {
      const parsed = JSON.parse(data);
      const todayStr = new Date().toLocaleDateString();
      
      const lastTestDate = new Date(parsed.lastTestDate);
      const today = new Date(todayStr);
      const diffTime = Math.abs(today - lastTestDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (parsed.lastTestDate === todayStr && parsed.completedToday) {
        setStreak(parsed.currentStreak);
        setHighestStreak(parsed.highestStreak);
        setCompletedToday(true);
      } else if (diffDays === 1) {
        setStreak(parsed.currentStreak);
        setHighestStreak(parsed.highestStreak);
        setCompletedToday(false);
      } else {
        setStreak(0);
        setHighestStreak(parsed.highestStreak || 0);
        setCompletedToday(false);
      }
    } else {
      setStreak(0);
      setHighestStreak(0);
      setCompletedToday(false);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  const markDailyTestComplete = async () => {
    if (completedToday) return;

    const newStreak = streak + 1;
    const newHighest = Math.max(newStreak, highestStreak);
    const todayStr = new Date().toLocaleDateString();

    setStreak(newStreak);
    setHighestStreak(newHighest);
    setCompletedToday(true);

    if (token) {
      try {
        await fetch('http://localhost:5000/api/user/streak', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentStreak: newStreak,
            highestStreak: newHighest,
            lastTestDate: todayStr,
            completedToday: true
          })
        });
      } catch (err) {
        console.warn('Failed to update streak in DB', err);
      }
    } else {
      localStorage.setItem('user_streak', JSON.stringify({
        currentStreak: newStreak,
        highestStreak: newHighest,
        lastTestDate: todayStr,
        completedToday: true
      }));
    }
  };

  return {
    streak,
    highestStreak,
    completedToday,
    markDailyTestComplete,
    loading
  };
}
