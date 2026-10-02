'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { formatDisplayDate, offsetDateString, getTodayIST } from '../lib/dateUtils';

export default function DateNavigator({ selectedDate, setSelectedDate }) {
  const todayIST = getTodayIST();
  const isToday = selectedDate === todayIST;

  const handlePrevDay = () => {
    setSelectedDate(prev => offsetDateString(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => offsetDateString(prev, 1));
  };

  const handleResetToToday = () => {
    setSelectedDate(todayIST);
  };

  return (
    <div className="date-navigator glass-card">
      <button
        onClick={handlePrevDay}
        className="nav-arrow-btn"
        title="Previous Day"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="date-center-info">
        <div className="date-title">
          <CalendarIcon size={18} color="var(--violet)" />
          <span>{formatDisplayDate(selectedDate)}</span>
          {isToday ? (
            <span className="today-pill">Today</span>
          ) : (
            <span className="past-future-pill">
              {selectedDate < todayIST ? 'Past Day' : 'Future'}
            </span>
          )}
        </div>

        {!isToday && (
          <button
            onClick={handleResetToToday}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              color: 'var(--emerald)',
              marginTop: '4px',
              fontWeight: 600
            }}
          >
            <RotateCcw size={12} />
            <span>Return to Today (IST)</span>
          </button>
        )}
      </div>

      <button
        onClick={handleNextDay}
        className="nav-arrow-btn"
        title="Next Day"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
