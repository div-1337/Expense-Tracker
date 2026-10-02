// Initial seed data for Flatmate Mess & Maid Tracker

export const INITIAL_TOPICS = [
  {
    id: 'topic_lunch',
    name: 'Lunch',
    icon: 'Utensils',
    color: '#F59E0B', // Amber
    type: 'people', // tracked per person
    people: ['Divyam', 'Kanishk'],
    defaultRate: 60 // ₹60 per lunch
  },
  {
    id: 'topic_dinner',
    name: 'Dinner',
    icon: 'Moon',
    color: '#8B5CF6', // Purple/Violet
    type: 'people', // tracked per person
    people: ['Divyam', 'Kanishk'],
    defaultRate: 70 // ₹70 per dinner
  },
  {
    id: 'topic_maid',
    name: 'Maid Presence',
    icon: 'Sparkles',
    color: '#06B6D4', // Cyan
    type: 'presence', // daily yes/no / half-day presence
    monthlySalary: 3000, // ₹3,000 / month
    allowedLeaves: 4, // 4 days free leaves (paid), 5th day absent adds 0
    deductPerAbsentDay: true
  }
];

export const INITIAL_RATES = {
  lunchRate: 60,
  dinnerRate: 70,
  maidMonthlySalary: 3000, // Monthly salary (divided by 30 or 31 days to get daily rate)
  maidAllowedLeaves: 4, // 4 days absence allowed free, 5th day absent not counted
  maidSplitEqual: true // whether roommates split maid payout equally
};
