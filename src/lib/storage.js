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
        // Sync local storage copy
        setLocal(STORAGE_KEYS.TOPICS, data);
        return data;
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
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('tracker_checkins')
        .select('*')
        .eq('date_ist', dateStr);

      if (!error && data) {
        const result = {};
        data.forEach(item => {
          if (!result[item.topic_id]) result[item.topic_id] = {};
          result[item.topic_id][item.item_key] = item.count !== undefined && item.count !== null ? item.count : item.completed;
        });
        return result;
      }
    } catch (e) {
      console.warn('Supabase fetch checkins failed, using local:', e);
    }
  }

  // Local fallback
  const allCheckins = getLocal(STORAGE_KEYS.CHECKINS, {});
  return allCheckins[dateStr] || {};
}

/**
 * Toggle or set a specific checkmark (supports boolean or numeric 0-3 plates)
 */
export async function toggleCheckin(dateStr, topicId, itemKey, newValue) {
  // Update local
  const allCheckins = getLocal(STORAGE_KEYS.CHECKINS, {});
  if (!allCheckins[dateStr]) allCheckins[dateStr] = {};
  if (!allCheckins[dateStr][topicId]) allCheckins[dateStr][topicId] = {};
  
  allCheckins[dateStr][topicId][itemKey] = newValue;
  setLocal(STORAGE_KEYS.CHECKINS, allCheckins);

  // Cloud sync
  if (isSupabaseConfigured && supabase) {
    try {
      const isNum = typeof newValue === 'number';
      const isBool = typeof newValue === 'boolean';
      await supabase.from('tracker_checkins').upsert({
        date_ist: dateStr,
        topic_id: topicId,
        item_key: itemKey,
        completed: isBool ? newValue : (isNum ? newValue > 0 : Boolean(newValue)),
        count: isNum ? newValue : (newValue ? 1 : 0),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'date_ist,topic_id,item_key'
      });
    } catch (e) {
      console.error('Supabase toggleCheckin error:', e);
    }
  }

  return allCheckins[dateStr];
}

/**
 * Get rates / cost preferences
 */
export function getRates() {
  return getLocal(STORAGE_KEYS.RATES, INITIAL_RATES);
}

/**
 * Save rates
 */
export function saveRates(newRates) {
  setLocal(STORAGE_KEYS.RATES, newRates);
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
          allCheckins[item.date_ist][item.topic_id][item.item_key] = item.count !== undefined && item.count !== null ? item.count : item.completed;
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
        // 'presence' key or boolean
        if (topicDay['presence'] === true) {
          topicStats.presenceCount += 1;
        } else if (topicDay['presence'] === false) {
          topicStats.absentCount += 1;
        }
      }
    });
  });

  return summary;
}
