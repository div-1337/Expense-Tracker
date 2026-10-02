'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  DollarSign,
  Share2,
  CheckCircle,
  XCircle,
  Copy,
  ChevronLeft,
  ChevronRight,
  Calculator,
  UserCheck
} from 'lucide-react';
import { getMonthlySummary, getRates, saveRates } from '../lib/storage';
import { getMonthLabel, getYearMonth, getAllDaysInMonth } from '../lib/dateUtils';

export default function MonthlyAnalysis({ topics, selectedDate, onSelectDate }) {
  const currentYM = getYearMonth(selectedDate);
  const [year, setYear] = useState(currentYM.year);
  const [month, setMonth] = useState(currentYM.month);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Rate settings
  const [rates, setRates] = useState({
    lunchRate: 60,
    dinnerRate: 70,
    maidMonthlySalary: 3000,
    maidAllowedLeaves: 4,
  });

  useEffect(() => {
    const saved = getRates();
    if (saved) setRates(saved);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getMonthlySummary(year, month, topics).then((data) => {
      if (isMounted) {
        setSummary(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [year, month, topics]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  const handleRateChange = (field, val) => {
    const updated = { ...rates, [field]: Number(val) || 0 };
    setRates(updated);
    saveRates(updated);
  };

  if (loading || !summary) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Calculating monthly analysis & counts...</p>
      </div>
    );
  }

  // Cost & count computations
  const totalDays = summary.totalDaysInMonth;
  const maidStats = summary.topicsBreakdown['topic_maid'] || { presenceCount: 0, absentCount: 0 };
  const lunchStats = summary.topicsBreakdown['topic_lunch'] || { counts: {} };
  const dinnerStats = summary.topicsBreakdown['topic_dinner'] || { counts: {} };

  // Maid calculation: Added on per-day basis like tiffin (starts at ₹0)
  // Takes monthly salary, divides by total days in month (30 or 31), and computes per-day
  const monthlySalary = Number(rates.maidMonthlySalary ?? 3000);
  const maidDailyRate = totalDays > 0 ? (monthlySalary / totalDays) : 0;
  const allowedLeaves = Number(rates.maidAllowedLeaves ?? 4);

  const presentDays = maidStats.presenceCount || 0;
  const absentDays = maidStats.absentCount || 0;
  const paidAbsentLeaves = Math.min(allowedLeaves, absentDays);
  const unpaidAbsentDays = Math.max(0, absentDays - allowedLeaves); // 5th day absent onwards (adds 0)

  const totalPayableDays = presentDays + paidAbsentLeaves;
  const totalMaidPayout = Math.round(totalPayableDays * maidDailyRate);

  // Extract all distinct flatmates
  const peopleSet = new Set();
  topics.forEach(t => {
    if (t.people) t.people.forEach(p => peopleSet.add(p));
  });
  const flatmates = Array.from(peopleSet);
  if (flatmates.length === 0) flatmates.push('Divyam', 'Kanishk');

  // Maid share per flatmate (equal split)
  const maidSharePerPerson = flatmates.length > 0 ? Math.round(totalMaidPayout / flatmates.length) : 0;

  // Compute breakdown per flatmate
  const flatmateBills = flatmates.map(person => {
    const lunches = lunchStats.counts[person] || 0;
    const dinners = dinnerStats.counts[person] || 0;
    const lunchCost = lunches * rates.lunchRate;
    const dinnerCost = dinners * rates.dinnerRate;
    const totalDue = lunchCost + dinnerCost + maidSharePerPerson;

    return {
      person,
      lunches,
      dinners,
      lunchCost,
      dinnerCost,
      maidShare: maidSharePerPerson,
      totalDue
    };
  });

  // Generate WhatsApp-formatted monthly report
  const generateWhatsAppMessage = () => {
    const monthLabel = getMonthLabel(year, month);
    let msg = `📊 *MONTHLY TRACKER & EXPENSE SUMMARY*\n`;
    msg += `🗓️ *Period:* ${monthLabel} (${totalDays} Days)\n\n`;

    msg += `🧹 *MAID ATTENDANCE & PAYOUT (Per-Day Basis):*\n`;
    msg += `• Days Present: ${presentDays} / ${totalDays}\n`;
    msg += `• Days Absent: ${absentDays} (${paidAbsentLeaves} of ${allowedLeaves} free leaves counted)\n`;
    if (unpaidAbsentDays > 0) {
      msg += `• 5th+ Day Absences: ${unpaidAbsentDays} day(s) not paid (adds ₹0)\n`;
    }
    msg += `• Total Payable Days: ${totalPayableDays} days (${presentDays} worked + ${paidAbsentLeaves} paid leaves)\n`;
    msg += `• Base Monthly Salary: ₹${monthlySalary}\n`;
    msg += `• Daily Rate: ₹${Math.round(maidDailyRate)}/day (₹${monthlySalary} ÷ ${totalDays} days)\n`;
    msg += `• *Net Maid Payout:* ₹${totalMaidPayout} (₹${maidSharePerPerson}/person)\n\n`;

    msg += `🍽️ *MEAL TICK COUNTS & BILLS:*\n`;
    flatmateBills.forEach(b => {
      msg += `👤 *${b.person}*:\n`;
      msg += `  - Lunch: ${b.lunches} ticks (₹${b.lunchCost})\n`;
      msg += `  - Dinner: ${b.dinners} ticks (₹${b.dinnerCost})\n`;
      msg += `  - Maid Share: ₹${b.maidShare}\n`;
      msg += `  👉 *TOTAL TO PAY: ₹${b.totalDue}*\n\n`;
    });

    // Custom topics if any
    const customTopics = topics.filter(t => t.id.startsWith('custom_'));
    if (customTopics.length > 0) {
      msg += `📌 *CUSTOM TOPICS SUMMARY:*\n`;
      customTopics.forEach(ct => {
        const stats = summary.topicsBreakdown[ct.id];
        if (ct.type === 'people') {
          msg += `• *${ct.name}:* `;
          const parts = (ct.people || []).map(p => `${p}: ${stats?.counts[p] || 0}`);
          msg += parts.join(', ') + '\n';
        } else {
          msg += `• *${ct.name}:* ${stats?.presenceCount || 0} days active\n`;
        }
      });
      msg += '\n';
    }

    msg += `_Generated via Daily Routine Tracker_`;
    return msg;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Month Navigator Header */}
      <div className="glass-card month-selector-row" style={{ padding: '1rem 1.25rem' }}>
        <button onClick={handlePrevMonth} className="nav-arrow-btn">
          <ChevronLeft size={20} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Monthly Overview
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {getMonthLabel(year, month)}
          </h2>
        </div>

        <button onClick={handleNextMonth} className="nav-arrow-btn">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Maid Presence Card */}
      <div className="glass-card topic-card">
        <div className="topic-card-header">
          <div className="topic-title-group">
            <div className="topic-icon-wrap" style={{ background: 'linear-gradient(135deg, #06B6D4, #0e7490)' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <h3 className="topic-name">Maid Presence Calculator</h3>
              <span className="topic-stats-pill">{totalDays} Total Days in Month</span>
            </div>
          </div>
        </div>

        <div className="stat-grid" style={{ marginBottom: '1rem' }}>
          <div className="stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div className="stat-header">
              <span className="stat-title">Days Present</span>
              <CheckCircle size={18} color="var(--emerald)" />
            </div>
            <div className="stat-big-number" style={{ color: 'var(--emerald)' }}>
              {presentDays} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {totalDays}</span>
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--emerald)' }}>
              +{presentDays} days worked @ ₹{Math.round(maidDailyRate)}/d (₹{monthlySalary} ÷ {totalDays}d)
            </span>
          </div>

          <div className="stat-card" style={{ borderColor: 'rgba(244, 63, 94, 0.3)' }}>
            <div className="stat-header">
              <span className="stat-title">Days Absent</span>
              <XCircle size={18} color="var(--rose)" />
            </div>
            <div className="stat-big-number" style={{ color: 'var(--rose)' }}>
              {absentDays}
            </div>
            {absentDays === 0 ? (
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                No absences ({allowedLeaves} free leaves available)
              </span>
            ) : absentDays <= allowedLeaves ? (
              <span style={{ fontSize: '0.76rem', color: 'var(--emerald)', fontWeight: 600 }}>
                ✓ {absentDays} of {allowedLeaves} free leaves used (Paid)
              </span>
            ) : (
              <span style={{ fontSize: '0.76rem', color: 'var(--rose)', fontWeight: 600 }}>
                ⚠️ {unpaidAbsentDays} day(s) from 5th day unpaid (adds ₹0)
              </span>
            )}
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">Total Maid Payout</span>
              <DollarSign size={18} color="var(--cyan)" />
            </div>
            <div className="stat-big-number" style={{ color: 'var(--cyan)' }}>
              ₹{totalMaidPayout}
            </div>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              {totalPayableDays} payable days ({presentDays} work + {paidAbsentLeaves} paid leave) @ ₹{Math.round(maidDailyRate)}/d • ₹{maidSharePerPerson}/person
            </span>
          </div>
        </div>

        {/* Daily Attendance Log & Direct Date Editor */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              📅 Daily Attendance Log ({getAllDaysInMonth(year, month).length} days)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 600 }}>
              💡 Click any date to adjust past/future attendance
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(38px, 1fr))', gap: '6px' }}>
            {getAllDaysInMonth(year, month).map((dateStr) => {
              const dayNum = parseInt(dateStr.split('-')[2], 10);
              const dayData = summary?.daysStatus?.[dateStr] || {};
              const maidVal = dayData['topic_maid']?.presence;
              const isPresentDay = maidVal === true || maidVal === 1 || maidVal === 'present';
              const isAbsentDay = (maidVal === false || maidVal === 0 || maidVal === 'absent') && maidVal != null;

              let bg = 'rgba(255, 255, 255, 0.04)';
              let border = 'var(--border-subtle)';
              let color = 'var(--text-muted)';

              if (isPresentDay) {
                bg = 'rgba(16, 185, 129, 0.18)';
                border = 'rgba(16, 185, 129, 0.4)';
                color = 'var(--emerald)';
              } else if (isAbsentDay) {
                bg = 'rgba(244, 63, 94, 0.18)';
                border = 'rgba(244, 63, 94, 0.4)';
                color = 'var(--rose)';
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => onSelectDate && onSelectDate(dateStr)}
                  title={`${dateStr}: ${isPresentDay ? 'Present' : isAbsentDay ? 'Absent' : 'Not marked'} — Click to edit`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '42px',
                    borderRadius: '8px',
                    background: bg,
                    border: `1px solid ${border}`,
                    color: color,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{dayNum}</span>
                  <span style={{ fontSize: '0.62rem', marginTop: '-2px' }}>
                    {isPresentDay ? '✓' : isAbsentDay ? '✕' : '·'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Meals Tickmarks Summary & Cost Calculator */}
      <div className="glass-card topic-card">
        <div className="topic-card-header">
          <div className="topic-title-group">
            <div className="topic-icon-wrap" style={{ background: 'linear-gradient(135deg, #F59E0B, #8B5CF6)' }}>
              <Calculator size={20} />
            </div>
            <div>
              <h3 className="topic-name">Meals Analysis & Bill Split</h3>
              <span className="topic-stats-pill">Individual counts & total share</span>
            </div>
          </div>
        </div>

        {/* Rate configuration pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Lunch Rate (₹)</label>
            <input
              type="number"
              className="form-input"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.88rem' }}
              value={rates.lunchRate}
              onChange={(e) => handleRateChange('lunchRate', e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Dinner Rate (₹)</label>
            <input
              type="number"
              className="form-input"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.88rem' }}
              value={rates.dinnerRate}
              onChange={(e) => handleRateChange('dinnerRate', e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: '135px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0 }}>Maid Monthly Salary (₹)</label>
            </div>
            <input
              type="number"
              className="form-input"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.88rem', marginTop: '4px' }}
              value={rates.maidMonthlySalary ?? 3000}
              onChange={(e) => handleRateChange('maidMonthlySalary', e.target.value)}
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
              ≈ ₹{Math.round(maidDailyRate)}/day (÷ {totalDays}d)
            </span>
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Allowed Free Leaves</label>
            <input
              type="number"
              className="form-input"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.88rem' }}
              value={rates.maidAllowedLeaves ?? 4}
              onChange={(e) => handleRateChange('maidAllowedLeaves', e.target.value)}
            />
          </div>
        </div>

        {/* Breakdown by Flatmate */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {flatmateBills.map((b) => (
            <div key={b.person} className="stat-card" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{b.person}</h4>
                <span className="brand-badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                  Total: ₹{b.totalDue}
                </span>
              </div>

              <div className="calc-breakdown-row">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Lunch Plates (Self + Guests): <strong>{b.lunches}</strong> × ₹{rates.lunchRate}
                </span>
                <span style={{ fontWeight: 600 }}>₹{b.lunchCost}</span>
              </div>

              <div className="calc-breakdown-row">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Dinner Plates (Self + Guests): <strong>{b.dinners}</strong> × ₹{rates.dinnerRate}
                </span>
                <span style={{ fontWeight: 600 }}>₹{b.dinnerCost}</span>
              </div>

              <div className="calc-breakdown-row">
                <span style={{ color: 'var(--text-secondary)' }}>
                  Maid Share (1/{flatmates.length})
                </span>
                <span style={{ fontWeight: 600 }}>₹{b.maidShare}</span>
              </div>

              <div className="calc-breakdown-row total">
                <span>Final Settle Amount:</span>
                <span>₹{b.totalDue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Topics Monthly Breakdown if present */}
      {topics.filter(t => t.id.startsWith('custom_')).length > 0 && (
        <div className="glass-card topic-card">
          <h3 className="topic-name" style={{ marginBottom: '1rem' }}>Custom Topics Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {topics.filter(t => t.id.startsWith('custom_')).map(ct => {
              const stats = summary.topicsBreakdown[ct.id] || {};
              return (
                <div key={ct.id} className="stat-card">
                  <span className="stat-title" style={{ color: ct.color }}>{ct.name}</span>
                  {ct.type === 'people' ? (
                    <div>
                      {(ct.people || []).map(p => (
                        <div key={p} className="calc-breakdown-row">
                          <span>{p}</span>
                          <strong>{stats.counts?.[p] || 0} ticks</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="stat-big-number" style={{ color: ct.color }}>
                      {stats.presenceCount || 0} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>days</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WhatsApp One-Click Copy Banner */}
      <div className="whatsapp-action-box">
        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
            Share with Flatmates on WhatsApp
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.75)' }}>
            Copies ready-to-send summary with tick totals, maid attendance, and exact bills.
          </p>
        </div>

        <button onClick={handleCopyWhatsApp} className="whatsapp-btn">
          {copied ? <CheckCircle size={18} /> : <Share2 size={18} />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy WhatsApp Report'}</span>
        </button>
      </div>
    </div>
  );
}
