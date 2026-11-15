export const CONFIG = {
  // Admin login
  admin: {
    sessionDays: 7, // days before sign-in is required again
  },

  // Kiosk
  reservation: {
    holdMinutes: 1, // hold length
    maxActivePerStudent: 1, // holds per student
  },

  // Recorder
  sessions: {
    graceMinutes: 2, // gap still counted as one session
    minSessionMinutes: 2, // shorter sessions are ignored
  },

  // History windows
  history: {
    loadDays: 90, // sessions loaded
    studentTrendDays: 30, // student trends
    notificationDays: 7, // admin notifications
  },
};
