import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RotateCcw, Play, Pause } from 'lucide-react-native';
import { useTimer } from '@/hooks/useTimer';
import { TimeUtils } from '@/utils/TimeUtils';

export default function TimerScreen() {
  const { isActive, isPaused, elapsedTime, isFlipped, flipCount, resetTimer } = useTimer();

  const handleResetConfirm = () => {
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the timer? Current progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetTimer }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Timer</Text>
        <Text style={styles.subtitle}>
          {isFlipped ? 'Device is flipped' : 'Flip device to start/stop timer'}
        </Text>
      </View>

      <View style={styles.timerContainer}>
        <View style={[styles.timerCircle, isActive && styles.activeTimer]}>
          <Text style={styles.timerText}>
            {TimeUtils.formatDuration(elapsedTime)}
          </Text>
          
          {isActive && !isPaused ? (
            <Pause size={24} color="#10B981" style={styles.timerIcon} />
          ) : isPaused ? (
            <Play size={24} color="#F59E0B" style={styles.timerIcon} />
          ) : (
            <Play size={24} color="#6B7280" style={styles.timerIcon} />
          )}
        </View>

        <Text style={styles.statusText}>
          {isActive && !isPaused ? 'Timer Running' : isPaused ? 'Timer Paused' : 'Timer Stopped'}
        </Text>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to use:</Text>
        <Text style={styles.instructionsText}>
          • Flip your device face down to start the timer
        </Text>
        <Text style={styles.instructionsText}>
          • Flip it back up to stop and save your session
        </Text>
        <Text style={styles.instructionsText}>
          • Sessions are automatically saved with world time
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{flipCount}</Text>
          <Text style={styles.statLabel}>Total Flips</Text>
        </View>
        
        <Pressable 
          style={styles.resetButton} 
          onPress={handleResetConfirm}
          disabled={!isActive && !isPaused}
        >
          <RotateCcw size={20} color={(isActive || isPaused) ? "#EF4444" : "#9CA3AF"} />
          <Text style={[styles.resetText, (!isActive && !isPaused) && styles.disabledText]}>
            Reset
          </Text>
        </Pressable>
      </View>

      <View style={styles.orientationIndicator}>
        <View style={[
          styles.deviceIndicator, 
          isFlipped && styles.flippedDevice
        ]}>
          <Text style={styles.deviceText}>📱</Text>
        </View>
        <Text style={styles.orientationText}>
          {isFlipped ? 'Face Down' : 'Face Up'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  activeTimer: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  timerIcon: {
    opacity: 0.7,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#64748B',
  },
  instructionsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 6,
  },
  disabledText: {
    color: '#9CA3AF',
  },
  orientationIndicator: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  deviceIndicator: {
    transform: [{ rotate: '0deg' }],
    marginBottom: 8,
  },
  flippedDevice: {
    transform: [{ rotate: '180deg' }],
  },
  deviceText: {
    fontSize: 32,
  },
  orientationText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
});