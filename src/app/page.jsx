'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import DateNavigator from '../components/DateNavigator';
import TopicCard from '../components/TopicCard';
import AddCustomTopicModal from '../components/AddCustomTopicModal';
import MonthlyAnalysis from '../components/MonthlyAnalysis';
import SupabaseSetupModal from '../components/SupabaseSetupModal';
import { getTodayIST } from '../lib/dateUtils';
import {
  getTopics,
  saveTopics,
  deleteTopic,
  getDailyCheckins,
  toggleCheckin,
  subscribeToCheckins,
  subscribeToTopics
} from '../lib/storage';
import { Plus, ListFilter, Sparkles } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'monthly'
  const [selectedDate, setSelectedDate] = useState(getTodayIST());
  const [topics, setTopics] = useState([]);
  const [dayData, setDayData] = useState({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);

  // Load topics
  const loadTopics = useCallback(async () => {
    const list = await getTopics();
    setTopics(list);
  }, []);

  // Load checkins for selected date
  const loadDayData = useCallback(async (dateStr) => {
    const checkins = await getDailyCheckins(dateStr);
    setDayData(checkins);
  }, []);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      await loadTopics();
      if (mounted) {
        await loadDayData(selectedDate);
        setLoading(false);
      }
    };
    init();

    return () => {
      mounted = false;
    };
  }, [loadTopics, loadDayData, selectedDate]);

  // Real-time synchronization subscription (updates UI live when other roommates tick)
  useEffect(() => {
    const unsubscribeCheckins = subscribeToCheckins(selectedDate, () => {
      loadDayData(selectedDate);
    });

    const unsubscribeTopics = subscribeToTopics(() => {
      loadTopics();
    });

    return () => {
      unsubscribeCheckins();
      unsubscribeTopics();
    };
  }, [selectedDate, loadDayData, loadTopics]);

  // Midnight IST auto-reset watcher
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToday = getTodayIST();
      // If user is currently looking at "today", and the IST day rolled over past midnight, update date
      setSelectedDate((prev) => {
        if (prev !== currentToday && prev === getTodayIST()) {
          return currentToday;
        }
        return prev;
      });
    }, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  // Handle toggle checkin
  const handleToggleCheckin = async (topicId, itemKey, newVal) => {
    // Optimistic UI update
    setDayData((prev) => {
      const topicObj = prev[topicId] || {};
      const newTopicObj = { ...topicObj };
      if (newVal === null || newVal === undefined) {
        delete newTopicObj[itemKey];
      } else {
        newTopicObj[itemKey] = newVal;
      }
      return {
        ...prev,
        [topicId]: newTopicObj
      };
    });

    await toggleCheckin(selectedDate, topicId, itemKey, newVal);
  };

  // Add custom topic
  const handleAddTopic = async (newTopic) => {
    const updated = [...topics, newTopic];
    setTopics(updated);
    await saveTopics(updated);
  };

  // Add person to existing topic
  const handleAddPersonToTopic = async (topicId, personName) => {
    const updated = topics.map((t) => {
      if (t.id === topicId) {
        const peopleList = t.people || [];
        if (!peopleList.includes(personName)) {
          return { ...t, people: [...peopleList, personName] };
        }
      }
      return t;
    });
    setTopics(updated);
    await saveTopics(updated);
  };

  // Remove person from existing topic
  const handleRemovePersonFromTopic = async (topicId, personName) => {
    const updated = topics.map((t) => {
      if (t.id === topicId) {
        const peopleList = (t.people || []).filter((p) => p !== personName);
        return { ...t, people: peopleList };
      }
      return t;
    });
    setTopics(updated);
    await saveTopics(updated);
  };

  // Delete custom topic
  const handleDeleteTopic = async (topicId) => {
    const filtered = await deleteTopic(topicId);
    setTopics(filtered);
  };

  // Extract distinct people for modal suggestion
  const existingPeople = Array.from(
    new Set(topics.flatMap((t) => t.people || []))
  );

  return (
    <main>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCloudSetup={() => setIsCloudModalOpen(true)}
      />

      {activeTab === 'daily' && (
        <section>
          {/* Date Navigator */}
          <DateNavigator
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />

          {/* Topics List */}
          {loading ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Loading your daily checklist...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  dayData={dayData}
                  selectedDate={selectedDate}
                  onToggleCheckin={handleToggleCheckin}
                  onAddPersonToTopic={handleAddPersonToTopic}
                  onRemovePersonFromTopic={handleRemovePersonFromTopic}
                  onDeleteTopic={handleDeleteTopic}
                />
              ))}

              {/* Add Custom Topic Button */}
              <button
                onClick={() => setIsAddTopicModalOpen(true)}
                className="add-topic-btn"
              >
                <Plus size={18} />
                <span>+ Add Custom Topic / Member Checklist</span>
              </button>
            </div>
          )}
        </section>
      )}

      {activeTab === 'monthly' && (
        <section>
          <MonthlyAnalysis
            topics={topics}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setActiveTab('daily');
            }}
          />
        </section>
      )}

      {/* Modals */}
      <AddCustomTopicModal
        isOpen={isAddTopicModalOpen}
        onClose={() => setIsAddTopicModalOpen(false)}
        onAddTopic={handleAddTopic}
        existingPeople={existingPeople.length > 0 ? existingPeople : ['Divyam', 'Kanishk']}
      />

      <SupabaseSetupModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
      />
    </main>
  );
}
