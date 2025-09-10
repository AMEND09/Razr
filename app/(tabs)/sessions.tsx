import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Alert,
  TextInput,
  Modal 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Clock, CreditCard as Edit3, Trash2, Save, X } from 'lucide-react-native';
import { dataService, StudySession } from '@/services/DataService';
import { TimeUtils } from '@/utils/TimeUtils';

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    notes: '',
    duration: '',
    startTime: '',
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const sessionData = await dataService.getSessions();
      // Sort sessions by start time (newest first)
      const sortedSessions = sessionData.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
      setSessions(sortedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (session?: StudySession) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        subject: session.subject || '',
        notes: session.notes || '',
        duration: Math.floor(session.duration / 60).toString(), // Convert to minutes
        startTime: new Date(session.startTime).toISOString().slice(0, 16),
      });
    } else {
      setEditingSession(null);
      setFormData({
        subject: '',
        notes: '',
        duration: '',
        startTime: new Date().toISOString().slice(0, 16),
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingSession(null);
    setFormData({
      subject: '',
      notes: '',
      duration: '',
      startTime: '',
    });
  };

  const saveSession = async () => {
    try {
      const duration = parseInt(formData.duration) * 60; // Convert minutes to seconds
      const startTime = new Date(formData.startTime);
      const endTime = new Date(startTime.getTime() + duration * 1000);

      if (duration <= 0) {
        Alert.alert('Error', 'Duration must be greater than 0');
        return;
      }

      const sessionData: StudySession = {
        id: editingSession?.id || TimeUtils.generateId(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration,
        subject: formData.subject.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        createdAt: editingSession?.createdAt || new Date().toISOString(),
        isManual: true
      };

      if (editingSession) {
        await dataService.updateSession(editingSession.id, sessionData);
      } else {
        await dataService.addSession(sessionData);
      }

      await loadSessions();
      closeModal();
    } catch (error) {
      console.error('Error saving session:', error);
      Alert.alert('Error', 'Failed to save session');
    }
  };

  const deleteSession = (session: StudySession) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this study session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.deleteSession(session.id);
              await loadSessions();
            } catch (error) {
              console.error('Error deleting session:', error);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Study Sessions</Text>
        <Pressable style={styles.addButton} onPress={() => openModal()}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Session</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={48} color="#94A3B8" />
            <Text style={styles.emptyStateTitle}>No sessions yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first study session or start a timer session
            </Text>
          </View>
        ) : (
          sessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionDuration}>
                    {TimeUtils.formatDuration(session.duration)}
                  </Text>
                  <Text style={styles.sessionDate}>
                    {TimeUtils.formatDate(session.startTime)} • {
                      new Date(session.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    }
                  </Text>
                </View>
                
                <View style={styles.sessionActions}>
                  <Pressable 
                    style={styles.actionButton}
                    onPress={() => openModal(session)}
                  >
                    <Edit3 size={16} color="#6B7280" />
                  </Pressable>
                  <Pressable 
                    style={styles.actionButton}
                    onPress={() => deleteSession(session)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </Pressable>
                </View>
              </View>

              {session.subject && (
                <Text style={styles.sessionSubject}>{session.subject}</Text>
              )}

              {session.notes && (
                <Text style={styles.sessionNotes}>{session.notes}</Text>
              )}

              <View style={styles.sessionFooter}>
                <Text style={[
                  styles.sessionType,
                  session.isManual ? styles.manualType : styles.timerType
                ]}>
                  {session.isManual ? 'Manual Entry' : 'Timer Session'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={closeModal}>
              <X size={24} color="#6B7280" />
            </Pressable>
            <Text style={styles.modalTitle}>
              {editingSession ? 'Edit Session' : 'Add Session'}
            </Text>
            <Pressable onPress={saveSession}>
              <Save size={24} color="#2563EB" />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={formData.subject}
                onChangeText={(text) => setFormData({...formData, subject: text})}
                placeholder="e.g., Mathematics, Physics, etc."
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Duration (Minutes) *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.duration}
                onChangeText={(text) => setFormData({...formData, duration: text})}
                placeholder="e.g., 25, 60, 120"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Start Time *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.startTime}
                onChangeText={(text) => setFormData({...formData, startTime: text})}
                placeholder="YYYY-MM-DDTHH:MM"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({...formData, notes: text})}
                placeholder="Add any notes about this study session..."
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDuration: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    color: '#64748B',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563EB',
    marginBottom: 8,
  },
  sessionNotes: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionType: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  manualType: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  timerType: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});