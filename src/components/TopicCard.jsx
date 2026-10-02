'use client';

import React, { useState } from 'react';
import {
  Utensils,
  Moon,
  Sparkles,
  Check,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  UserPlus,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getTodayIST } from '../lib/dateUtils';

const ICON_MAP = {
  Utensils,
  Moon,
  Sparkles,
  Check
};

export default function TopicCard({
  topic,
  dayData,
  selectedDate,
  onToggleCheckin,
  onAddPersonToTopic,
  onRemovePersonFromTopic,
  onDeleteTopic
}) {
  const [showAddPersonInput, setShowAddPersonInput] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  const IconComponent = ICON_MAP[topic.icon] || Check;
  const topicCheckins = dayData[topic.id] || {};
  const isToday = !selectedDate || selectedDate === getTodayIST();

  const getPersonCount = (person) => {
    const val = topicCheckins[person];
    if (typeof val === 'number') return val;
    if (val === true) return 1;
    return 0;
  };

  const handleSetPersonTicks = (person, targetSlot) => {
    const currentCount = getPersonCount(person);
    let newCount;
    if (currentCount === targetSlot) {
      newCount = targetSlot - 1;
    } else {
      newCount = targetSlot;
    }
    onToggleCheckin(topic.id, person, newCount);

    if (newCount > 0) {
      try {
        confetti({
          particleCount: 20 * newCount,
          spread: 60,
          origin: { y: 0.75 },
          colors: [topic.color || '#10B981', '#ffffff', '#F59E0B']
        });
      } catch (e) {
        // ignore confetti errors
      }
    }
  };

  const presenceRaw = topicCheckins['presence'];
  const isPresent = presenceRaw === true || presenceRaw === 1 || presenceRaw === 'present';
  const isAbsent = (presenceRaw === false || presenceRaw === 0 || presenceRaw === 'absent') && presenceRaw !== null && presenceRaw !== undefined;

  const handlePresenceClick = (status) => {
    // If already set to this status, keep it! Never auto-untick or double-tap untick
    if (status === true && isPresent) return;
    if (status === false && isAbsent) return;

    onToggleCheckin(topic.id, 'presence', status);

    if (status === true) {
      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.75 },
          colors: ['#10B981', '#ffffff', '#06B6D4']
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleAddPersonSubmit = (e) => {
    e.preventDefault();
    const trimmed = newPersonName.trim();
    if (trimmed && onAddPersonToTopic) {
      onAddPersonToTopic(topic.id, trimmed);
      setNewPersonName('');
      setShowAddPersonInput(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="topic-card glass-card">
      <div className="topic-card-header">
        <div className="topic-title-group">
          <div
            className="topic-icon-wrap"
            style={{
              background: `linear-gradient(135deg, ${topic.color || '#6366f1'}, #1f2937)`
            }}
          >
            <IconComponent size={20} />
          </div>
          <div>
            <h3 className="topic-name">{topic.name}</h3>
            <span className="topic-stats-pill">
              {topic.type === 'people'
                ? `Self + Guest Ticks (Up to 3 Plates)`
                : 'Daily Attendance'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {topic.type === 'people' && (
            <button
              onClick={() => setShowAddPersonInput(!showAddPersonInput)}
              className="nav-arrow-btn"
              style={{ width: '32px', height: '32px' }}
              title="Add person to this topic"
            >
              <UserPlus size={16} />
            </button>
          )}

          {/* If custom topic, allow deletion */}
          {topic.id.startsWith('custom_') && (
            <button
              onClick={() => onDeleteTopic && onDeleteTopic(topic.id)}
              className="nav-arrow-btn"
              style={{ width: '32px', height: '32px', color: 'var(--rose)' }}
              title="Delete this topic"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Add Person Input (Inline) */}
      {showAddPersonInput && (
        <form
          onSubmit={handleAddPersonSubmit}
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '1rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <input
            type="text"
            placeholder="New person's name (e.g. Aryan)"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            className="form-input"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.88rem' }}
            autoFocus
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.88rem' }}
          >
            Add
          </button>
        </form>
      )}

      {/* Case 1: People checkmarks with 3 ticks (Self + Guests) */}
      {topic.type === 'people' && (
        <div className="people-grid">
          {(topic.people || []).map((person) => {
            const count = getPersonCount(person);
            return (
              <div
                key={person}
                className={`tick-box-card ${count > 0 ? 'has-ticks' : ''}`}
              >
                <div className="person-card-top">
                  <div className="person-avatar-wrap">
                    <div className="avatar-circle">
                      {getInitials(person)}
                    </div>
                    <div>
                      <div className="person-name-text">{person}</div>
                      <div style={{ fontSize: '0.72rem', color: count > 0 ? 'var(--emerald)' : 'var(--text-muted)' }}>
                        {count === 0 && 'No meals'}
                        {count === 1 && '1 Plate (Self)'}
                        {count === 2 && '2 Plates (Self + 1 Guest)'}
                        {count === 3 && '3 Plates (Self + 2 Guests)'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`plate-count-badge ${count > 0 ? 'active' : ''}`}>
                      {count} {count === 1 ? 'Plate' : 'Plates'}
                    </span>
                    {onRemovePersonFromTopic && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Remove ${person} from ${topic.name}?`)) {
                            onRemovePersonFromTopic(topic.id, person);
                          }
                        }}
                        className="remove-person-btn"
                        title={`Remove ${person} from ${topic.name}`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="tick-slots-row">
                  <button
                    type="button"
                    onClick={() => handleSetPersonTicks(person, 1)}
                    className={`tick-slot-btn ${count >= 1 ? 'active' : ''}`}
                    title="Tick 1: Self"
                  >
                    <Check size={14} strokeWidth={count >= 1 ? 3 : 2} />
                    <span>Tick 1 (Self)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPersonTicks(person, 2)}
                    className={`tick-slot-btn guest ${count >= 2 ? 'active' : ''}`}
                    title="Tick 2: Guest 1"
                  >
                    <Check size={14} strokeWidth={count >= 2 ? 3 : 2} />
                    <span>Tick 2 (Guest 1)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetPersonTicks(person, 3)}
                    className={`tick-slot-btn guest ${count >= 3 ? 'active' : ''}`}
                    title="Tick 3: Guest 2"
                  >
                    <Check size={14} strokeWidth={count >= 3 ? 3 : 2} />
                    <span>Tick 3 (Guest 2)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Case 2: Presence toggle (Maid Presence, or single occurrence) */}
      {topic.type === 'presence' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="presence-toggle-row">
            <button
              type="button"
              onClick={() => handlePresenceClick(true)}
              className={`presence-btn present ${isPresent ? 'active' : ''}`}
            >
              <CheckCircle2 size={18} />
              <span>{isToday ? 'Present Today' : 'Present'}</span>
            </button>

            <button
              type="button"
              onClick={() => handlePresenceClick(false)}
              className={`presence-btn absent ${isAbsent ? 'active' : ''}`}
            >
              <XCircle size={18} />
              <span>Absent</span>
            </button>
          </div>

          {(isPresent || isAbsent) && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => onToggleCheckin(topic.id, 'presence', null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 4px',
                  textDecoration: 'underline'
                }}
              >
                Clear / Reset attendance
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
