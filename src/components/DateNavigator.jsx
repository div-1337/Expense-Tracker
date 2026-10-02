'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { formatDisplayDate, offsetDateString, getTodayIST } from '../lib/dateUtils';

export default function DateNavigator({ selectedDate, setSelectedDate }) {
  const todayIST = getTodayIST();
  const isToday = selectedDate === todayIST;
  const dateInputRef = useRef(null);

  const handlePrevDay = () => {
    setSelectedDate(prev => offsetDateString(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => offsetDateString(prev, 1));
  };

  const handleResetToToday = () => {
    setSelectedDate(todayIST);
  };

  const handleOpenPicker = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <div className="date-navigator glass-card">
      <button
        type="button"
        onClick={handlePrevDay}
        className="nav-arrow-btn"
        title="Previous Day"
      >
        <ChevronLeft size={20} />
      </button>

      <div
        className="date-center-info"
        onClick={handleOpenPicker}
        title="Click to jump to any past or future date"
      >
        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) setSelectedDate(e.target.value);
          }}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: '1px',
            height: '1px'
          }}
        />
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
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleResetToToday();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              color: 'var(--emerald)',
              marginTop: '4px',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={12} />
            <span>Return to Today (IST)</span>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleNextDay}
        className="nav-arrow-btn"
        title="Next Day"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
