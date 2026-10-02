'use client';

import React, { useState } from 'react';
import { X, Sparkles, Plus } from 'lucide-react';

const COLOR_OPTIONS = [
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#F97316'  // Orange
];

export default function AddCustomTopicModal({ isOpen, onClose, onAddTopic, existingPeople }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('people'); // 'people' or 'presence'
  const [peopleInput, setPeopleInput] = useState(existingPeople.join(', '));
  const [color, setColor] = useState(COLOR_OPTIONS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    let peopleList = [];
    if (type === 'people') {
      peopleList = peopleInput
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);
      if (peopleList.length === 0) {
        peopleList = ['Divyam', 'Kanishk'];
      }
    }

    const newTopic = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      icon: 'Check',
      color: color,
      type: type,
      people: peopleList,
      defaultRate: 50
    };

    onAddTopic(newTopic);
    setName('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--violet)" />
            <h3 className="modal-title">Add Custom Topic / Tracker</h3>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Topic Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Cook, Water Can, Evening Snacks, Gym"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tracking Type</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setType('people')}
                className={`presence-btn ${type === 'people' ? 'present active' : ''}`}
                style={{ fontSize: '0.88rem', padding: '0.65rem' }}
              >
                Per-Person Checkbox (e.g. Food, Tasks)
              </button>
              <button
                type="button"
                onClick={() => setType('presence')}
                className={`presence-btn ${type === 'presence' ? 'present active' : ''}`}
                style={{ fontSize: '0.88rem', padding: '0.65rem' }}
              >
                Daily Yes/No (e.g. Attendance)
              </button>
            </div>
          </div>

          {type === 'people' && (
            <div className="form-group">
              <label className="form-label">Members (comma separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Divyam, Kanishk, Aryan..."
                value={peopleInput}
                onChange={(e) => setPeopleInput(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Separate roommate names with commas.
              </span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Color Accent</label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              {COLOR_OPTIONS.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: c,
                    border: color === c ? '3px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                    transform: color === c ? 'scale(1.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                />
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '1.25rem' }}>
            <Plus size={18} />
            <span>Create Topic</span>
          </button>
        </form>
      </div>
    </div>
  );
}
