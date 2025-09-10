import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, Target, TrendingUp, Calendar } from 'lucide-react-native';
import { dataService, UserStats } from '@/services/DataService';
import { TimeUtils } from '@/utils/TimeUtils';

export default function StatisticsScreen() {
  const [stats, setStats] = useState<UserStats>({
    totalStudyTime: 0,
    totalSessions: 0,
    averageSessionDuration: 0,
    longestSession: 0,
    currentStreak: 0,
    lastStudyDate: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const userStats = await dataService.getStats();
      setStats(userStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Study Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Clock size={24} color="#2563EB" />
            <Text style={styles.statValue}>
              {TimeUtils.formatDuration(stats.totalStudyTime)}
            </Text>
            <Text style={styles.statLabel}>Total Study Time</Text>
          </View>

          <View style={styles.statCard}>
            <Target size={24} color="#10B981" />
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={24} color="#F59E0B" />
            <Text style={styles.statValue}>
              {TimeUtils.formatDuration(Math.round(stats.averageSessionDuration))}
            </Text>
            <Text style={styles.statLabel}>Average Session</Text>
          </View>

          <View style={styles.statCard}>
            <Calendar size={24} color="#EF4444" />
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Longest Session</Text>
            <Text style={styles.detailValue}>
              {TimeUtils.formatDuration(stats.longestSession)}
            </Text>
          </View>

          {stats.lastStudyDate && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Last Study Session</Text>
              <Text style={styles.detailValue}>
                {TimeUtils.formatDate(stats.lastStudyDate)}
              </Text>
            </View>
          )}

          {stats.totalSessions > 0 && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Average Daily Study Time</Text>
              <Text style={styles.detailValue}>
                {TimeUtils.formatDuration(Math.round(stats.totalStudyTime / Math.max(1, stats.currentStreak || 1)))}
              </Text>
            </View>
          )}
        </View>

        {stats.totalSessions === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No study sessions yet</Text>
            <Text style={styles.emptyStateText}>
              Start your first study session by flipping your device face down!
            </Text>
          </View>
        )}

        <View style={styles.motivationContainer}>
          <Text style={styles.motivationTitle}>Keep it up! 🚀</Text>
          <Text style={styles.motivationText}>
            {getMotivationMessage(stats)}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getMotivationMessage(stats: UserStats): string {
  if (stats.totalSessions === 0) {
    return "Ready to start your learning journey? Every expert was once a beginner!";
  }
  
  if (stats.currentStreak === 0) {
    return "Let's get back on track! Start a new session today.";
  }
  
  if (stats.currentStreak >= 7) {
    return `Amazing! ${stats.currentStreak} days in a row. You're building an incredible habit!`;
  }
  
  if (stats.totalStudyTime >= 3600) {
    return "You've put in some serious study time! Your dedication is inspiring.";
  }
  
  return "Great progress! Every session brings you closer to your goals.";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  motivationContainer: {
    backgroundColor: '#FEF3C7',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  motivationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: '#A16207',
    lineHeight: 20,
  },
});