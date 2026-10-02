import { supabase, isSupabaseConfigured } from './supabaseClient';
import { INITIAL_TOPICS, INITIAL_RATES } from './defaultData';
import { getAllDaysInMonth } from './dateUtils';

const STORAGE_KEYS = {
  TOPICS: 'daily_tracker_topics_v1',
  CHECKINS: 'daily_tracker_checkins_v1',
  RATES: 'daily_tracker_rates_v1'
};

/**
 * Helper to get local data safely
 */
function getLocal(key, defaultVal) {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (err) {
    console.error(`Failed to read ${key} from localStorage:`, err);
    return defaultVal;
  }
}

/**
 * Helper to save local data safely
 */
function setLocal(key, val) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Failed to write ${key} to localStorage:`, err);
  }
}

/**
 * Get all topics (cloud if configured, fallback to localStorage/defaults)
 */
export async function getTopics() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('tracker_topics').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        const normalized = data.map(t => ({
          ...t,
          monthlySalary: t.monthly_salary != null ? Number(t.monthly_salary) : (t.monthlySalary || null),
          defaultRate: t.default_rate != null ? Number(t.default_rate) : (t.defaultRate || null)
        }));
        // Sync local storage copy
        setLocal(STORAGE_KEYS.TOPICS, normalized);
        return normalized;
      }
    } catch (e) {
      console.warn('Supabase fetch topics failed, falling back to local:', e);
    }
  }

  // Local fallback
  const local = getLocal(STORAGE_KEYS.TOPICS, null);
  if (local && Array.isArray(local) && local.length > 0) {
    return local;
  }

  // Seed default
  setLocal(STORAGE_KEYS.TOPICS, INITIAL_TOPICS);
  return INITIAL_TOPICS;
}

/**
 * Save / Update topics
 */
export async function saveTopics(topics) {
  setLocal(STORAGE_KEYS.TOPICS, topics);

  if (isSupabaseConfigured && supabase) {
    try {
      // Upsert into Supabase
      for (const topic of topics) {
        await supabase.from('tracker_topics').upsert({
          id: topic.id,
          name: topic.name,
          icon: topic.icon || 'Check',
          color: topic.color || '#10B981',
          type: topic.type,
          people: topic.people || [],
          monthly_salary: topic.monthlySalary || null,
          default_rate: topic.defaultRate || null
        });
      }
    } catch (e) {
      console.error('Supabase saveTopics error:', e);
    }
  }
  return topics;
}

/**
 * Delete a topic
 */
export async function deleteTopic(topicId) {
  const current = await getTopics();
  const filtered = current.filter(t => t.id !== topicId);
  setLocal(STORAGE_KEYS.TOPICS, filtered);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('tracker_topics').delete().eq('id', topicId);
    } catch (e) {
      console.error('Supabase deleteTopic error:', e);
    }
  }
  return filtered;
}

/**
 * Get checkins for a specific date (YYYY-MM-DD)
 * Returns object: { [topicId]: { [personOrPresenceKey]: boolean } }
 */
export async function getDailyCheckins(dateStr) {
  const allCheckins = getLocal(STORAGE_KEYS.CHECKINS, {});
  const localDay = allCheckins[dateStr] || {};
  let result = JSON.parse(JSON.stringify(localDay));

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tracker_checkins')
        .select('*')
        .eq('date_ist', dateStr);

      if (!error && Array.isArray(data)) {
        if (data.length > 0) {
          const cloudResult = {};
          data.forEach(item => {
            if (!cloudResult[item.topic_id]) cloudResult[item.topic_id] = {};
            if (item.item_key === 'presence') {
              cloudResult[item.topic_id][item.item_key] = item.completed === true ? true : (item.completed === false ? false : (item.count > 0));
            } else {
              cloudResult[item.topic_id][item.item_key] = item.count !== undefined && item.count !== null ? Number(item.count) : (item.completed ? 1 : 0);
            }
          });
          result = { ...result, ...cloudResult };
          allCheckins[dateStr] = result;
          setLocal(STORAGE_KEYS.CHECKINS, allCheckins);
        }
        return result;
      } else if (error) {
        console.warn('Supabase fetch error, using local:', error.message || error);
      }
    } catch (e) {
      console.warn('Supabase fetch checkins failed, using local:', e);
    }
  }

  // Local fallback
  return result;
}

/**
 * Toggle or set a specific checkmark (supports boolean or numeric 0-3 plates)
 */
export async function toggleCheckin(dateStr, topicId, itemKey, newValue) {
  // Update local
  const allCheckins = getLocal(STORAGE_KEYS.CHECKINS, {});
  if (!allCheckins[dateStr]) allCheckins[dateStr] = {};
  if (!allCheckins[dateStr][topicId]) allCheckins[dateStr][topicId] = {};
  
  if (newValue === null || newValue === undefined) {
    delete allCheckins[dateStr][topicId][itemKey];
  } else {
    allCheckins[dateStr][topicId][itemKey] = newValue;
  }
  setLocal(STORAGE_KEYS.CHECKINS, allCheckins);

  // Cloud sync
  if (isSupabaseConfigured && supabase) {
    try {
      if (newValue === null || newValue === undefined) {
        const { error } = await supabase
          .from('tracker_checkins')
          .delete()
          .match({ date_ist: dateStr, topic_id: topicId, item_key: itemKey });
        if (error) console.warn('Supabase delete error:', error.message || error);
      } else {
        const isNum = typeof newValue === 'number';
        const isBool = typeof newValue === 'boolean';
        const { error } = await supabase.from('tracker_checkins').upsert({
          date_ist: dateStr,
          topic_id: topicId,
          item_key: itemKey,
          completed: isBool ? newValue : (isNum ? newValue > 0 : Boolean(newValue)),
          count: isNum ? newValue : (newValue ? 1 : 0),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'date_ist,topic_id,item_key'
        });
        if (error) console.warn('Supabase upsert error:', error.message || error);
      }
    } catch (e) {
      console.error('Supabase toggleCheckin error:', e);
    }
  }

  return allCheckins[dateStr];
}

/**
 * Synchronous local get rates
 */
export function getRatesSync() {
  return getLocal(STORAGE_KEYS.RATES, INITIAL_RATES);
}

/**
 * Get rates / cost preferences (merges local storage with cloud topics)
 */
export async function getRates() {
  const local = getLocal(STORAGE_KEYS.RATES, null);
  let currentRates = local ? { ...local } : { ...INITIAL_RATES };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tracker_topics')
        .select('id, default_rate, monthly_salary');

      if (!error && data && data.length > 0) {
        data.forEach(t => {
          if (t.id === 'topic_lunch' && t.default_rate != null) {
            currentRates.lunchRate = Number(t.default_rate);
          }
          if (t.id === 'topic_dinner' && t.default_rate != null) {
            currentRates.dinnerRate = Number(t.default_rate);
          }
          if (t.id === 'topic_maid' && t.monthly_salary != null) {
            currentRates.maidMonthlySalary = Number(t.monthly_salary);
          }
        });
        setLocal(STORAGE_KEYS.RATES, currentRates);
      }
    } catch (e) {
      console.warn('Supabase fetch rates failed:', e);
    }
  }

  return currentRates;
}

/**
 * Save rates both locally and sync to Supabase tracker_topics
 */
export async function saveRates(newRates) {
  setLocal(STORAGE_KEYS.RATES, newRates);

  if (isSupabaseConfigured && supabase) {
    try {
      if (newRates.lunchRate != null) {
        await supabase
          .from('tracker_topics')
          .update({ default_rate: Number(newRates.lunchRate) })
          .eq('id', 'topic_lunch');
      }
      if (newRates.dinnerRate != null) {
        await supabase
          .from('tracker_topics')
          .update({ default_rate: Number(newRates.dinnerRate) })
          .eq('id', 'topic_dinner');
      }
      if (newRates.maidMonthlySalary != null) {
        await supabase
          .from('tracker_topics')
          .update({ monthly_salary: Number(newRates.maidMonthlySalary) })
          .eq('id', 'topic_maid');
      }
    } catch (e) {
      console.error('Supabase saveRates error:', e);
    }
  }

  return newRates;
}

/**
 * Get full monthly summary for a given year & month (1-indexed month)
 */
export async function getMonthlySummary(year, month, topics) {
  const days = getAllDaysInMonth(year, month);
  let allCheckins = {};

  if (isSupabaseConfigured && supabase) {
    try {
      const startDate = days[0];
      const endDate = days[days.length - 1];
      const { data, error } = await supabase
        .from('tracker_checkins')
        .select('*')
        .gte('date_ist', startDate)
        .lte('date_ist', endDate);

      if (!error && data) {
        data.forEach(item => {
          if (!allCheckins[item.date_ist]) allCheckins[item.date_ist] = {};
          if (!allCheckins[item.date_ist][item.topic_id]) allCheckins[item.date_ist][item.topic_id] = {};
          if (item.item_key === 'presence') {
            allCheckins[item.date_ist][item.topic_id][item.item_key] = item.completed === true ? true : (item.completed === false ? false : (item.count > 0));
          } else {
            allCheckins[item.date_ist][item.topic_id][item.item_key] = item.count !== undefined && item.count !== null ? Number(item.count) : (item.completed ? 1 : 0);
          }
        });
      }
    } catch (e) {
      console.warn('Supabase fetch month failed, using local:', e);
      allCheckins = getLocal(STORAGE_KEYS.CHECKINS, {});
    }
  } else {
    allCheckins = getLocal(STORAGE_KEYS.CHECKINS, {});
  }

  // Aggregate results
  const summary = {
    totalDaysInMonth: days.length,
    topicsBreakdown: {}, // topicId -> { counts: { [person]: N }, presenceCount: N, totalPossible: N }
    daysStatus: {} // date -> day data
  };

  topics.forEach(topic => {
    summary.topicsBreakdown[topic.id] = {
      name: topic.name,
      type: topic.type,
      color: topic.color,
      counts: {}, // For per-person topics: personName -> count
      presenceCount: 0, // For presence topics: days present
      absentCount: 0
    };

    if (topic.type === 'people' && topic.people) {
      topic.people.forEach(p => {
        summary.topicsBreakdown[topic.id].counts[p] = 0;
      });
    }
  });

  days.forEach(dateStr => {
    const dayData = allCheckins[dateStr] || {};
    summary.daysStatus[dateStr] = dayData;

    topics.forEach(topic => {
      const topicDay = dayData[topic.id] || {};
      const topicStats = summary.topicsBreakdown[topic.id];

      if (topic.type === 'people' && topic.people) {
        topic.people.forEach(person => {
          const val = topicDay[person];
          let count = 0;
          if (typeof val === 'number') {
            count = val;
          } else if (val === true) {
            count = 1;
          }
          topicStats.counts[person] = (topicStats.counts[person] || 0) + count;
        });
      } else if (topic.type === 'presence') {
        const pVal = topicDay['presence'];
        if (pVal === true || pVal === 1 || pVal === 'present') {
          topicStats.presenceCount += 1;
        } else if (pVal === false || pVal === 0 || pVal === 'absent') {
          topicStats.absentCount += 1;
        }
      }
    });
  });

  return summary;
}

/**
 * Real-time subscription for check-ins on a specific date
 */
export function subscribeToCheckins(dateStr, onUpdate) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase
    .channel(`realtime_checkins_${dateStr}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tracker_checkins',
        filter: `date_ist=eq.${dateStr}`
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Real-time subscription for topics
 */
export function subscribeToTopics(onUpdate) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase
    .channel('realtime_topics')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tracker_topics'
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
