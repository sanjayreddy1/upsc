const MOTIVATIONAL_MESSAGES = [
  "Every hour you study is a step closer to LBSNAA.",
  "Discipline is doing what needs to be done, even if you don't want to.",
  "The pain of discipline is far less than the pain of regret.",
  "Stay focused! Consistency is the only secret to cracking UPSC.",
  "Your competition is studying right now. Are you?",
  "An officer's mindset starts today, not after the result.",
  "Don't stop when you're tired. Stop when you're done.",
  "Small daily improvements are the key to staggering long-term results.",
  "Believe in yourself. You have what it takes to clear this exam.",
];

let motivationInterval = null;
let reminderInterval = null;

export const initNotificationEngine = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  // Request permission if not granted
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }

  // Clear existing intervals to prevent duplicates if re-rendered
  if (motivationInterval) clearInterval(motivationInterval);
  if (reminderInterval) clearInterval(reminderInterval);

  // Send a motivation message every 45 minutes
  motivationInterval = setInterval(() => {
    if (Notification.permission === 'granted') {
      const msg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
      new Notification('🔥 UPSC Motivation', {
        body: msg,
        icon: '/favicon.svg',
      });
    }
  }, 45 * 60 * 1000);

  // Send a reminder to do the Daily Test every 1 hour (only if not completed)
  reminderInterval = setInterval(() => {
    if (Notification.permission === 'granted') {
      try {
        const streakData = localStorage.getItem('user_streak');
        let completedToday = false;
        
        if (streakData) {
          const parsed = JSON.parse(streakData);
          const d = new Date(parsed.lastCompletedDate);
          d.setHours(0,0,0,0);
          
          const today = new Date();
          today.setHours(0,0,0,0);
          
          if (d.getTime() === today.getTime()) {
            completedToday = true;
          }
        }
        
        if (!completedToday) {
          new Notification('⏱️ Daily Test Pending!', {
            body: 'You haven\'t completed your 10 Daily Questions yet. Don\'t break your streak!',
            icon: '/favicon.svg',
          });
        }
      } catch (e) {
        console.error('Error checking streak for reminder', e);
      }
    }
  }, 60 * 60 * 1000);
};
