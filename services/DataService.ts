import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StudySession {
  id: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  subject?: string;
  notes?: string;
  createdAt: string;
  isManual: boolean;
}

export interface TimerState {
  isActive: boolean;
  startTime: string | null;
  currentSession: string | null;
  flipCount: number;
}

export interface UserStats {
  totalStudyTime: number;
  totalSessions: number;
  averageSessionDuration: number;
  longestSession: number;
  currentStreak: number;
  lastStudyDate: string | null;
}

export interface AppSettings {
  emailNotifications: boolean;
  notificationEmail: string;
  smtpConfig: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  timerAlerts: boolean;
  maxSessionTime: number; // in minutes
  pauseOnFlip: boolean; // true = pause, false = reset
}

class DataService {
  private storageKeys = {
    sessions: 'study_sessions',
    timerState: 'timer_state',
    settings: 'app_settings',
  };

  // Session management
  async getSessions(): Promise<StudySession[]> {
    try {
      const data = await AsyncStorage.getItem(this.storageKeys.sessions);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  async addSession(session: StudySession): Promise<void> {
    try {
      const sessions = await this.getSessions();
      sessions.push(session);
      await AsyncStorage.setItem(this.storageKeys.sessions, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error adding session:', error);
    }
  }

  async updateSession(sessionId: string, updates: Partial<StudySession>): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const index = sessions.findIndex(s => s.id === sessionId);
      if (index !== -1) {
        sessions[index] = { ...sessions[index], ...updates };
        await AsyncStorage.setItem(this.storageKeys.sessions, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const filtered = sessions.filter(s => s.id !== sessionId);
      await AsyncStorage.setItem(this.storageKeys.sessions, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  // Timer state management
  async getTimerState(): Promise<TimerState> {
    try {
      const data = await AsyncStorage.getItem(this.storageKeys.timerState);
      return data ? JSON.parse(data) : {
        isActive: false,
        startTime: null,
        currentSession: null,
        flipCount: 0
      };
    } catch (error) {
      console.error('Error getting timer state:', error);
      return {
        isActive: false,
        startTime: null,
        currentSession: null,
        flipCount: 0
      };
    }
  }

  async updateTimerState(state: Partial<TimerState>): Promise<void> {
    try {
      const currentState = await this.getTimerState();
      const newState = { ...currentState, ...state };
      await AsyncStorage.setItem(this.storageKeys.timerState, JSON.stringify(newState));
    } catch (error) {
      console.error('Error updating timer state:', error);
    }
  }

  // Settings management
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(this.storageKeys.settings);
      return data ? JSON.parse(data) : {
        emailNotifications: false,
        notificationEmail: '',
        smtpConfig: {
          host: '',
          port: 587,
          secure: false,
          user: '',
          pass: ''
        },
        timerAlerts: true,
        maxSessionTime: 120, // 2 hours default
        pauseOnFlip: false // default to reset behavior
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        emailNotifications: false,
        notificationEmail: '',
        smtpConfig: {
          host: '',
          port: 587,
          secure: false,
          user: '',
          pass: ''
        },
        timerAlerts: true,
        maxSessionTime: 120,
        pauseOnFlip: false
      };
    }
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(this.storageKeys.settings, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }

  // Statistics calculation
  async getStats(): Promise<UserStats> {
    try {
      const sessions = await this.getSessions();
      
      if (sessions.length === 0) {
        return {
          totalStudyTime: 0,
          totalSessions: 0,
          averageSessionDuration: 0,
          longestSession: 0,
          currentStreak: 0,
          lastStudyDate: null
        };
      }

      const totalStudyTime = sessions.reduce((sum, session) => sum + session.duration, 0);
      const totalSessions = sessions.length;
      const averageSessionDuration = totalStudyTime / totalSessions;
      const longestSession = Math.max(...sessions.map(s => s.duration));
      
      // Calculate current streak
      const sortedSessions = sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      let currentStreak = 0;
      const today = new Date();
      let checkDate = new Date(today);
      
      for (const session of sortedSessions) {
        const sessionDate = new Date(session.startTime);
        const diffDays = Math.floor((checkDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
          currentStreak++;
          checkDate = sessionDate;
        } else {
          break;
        }
      }

      return {
        totalStudyTime,
        totalSessions,
        averageSessionDuration,
        longestSession,
        currentStreak,
        lastStudyDate: sortedSessions[0]?.startTime || null
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return {
        totalStudyTime: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        longestSession: 0,
        currentStreak: 0,
        lastStudyDate: null
      };
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.storageKeys.sessions,
        this.storageKeys.timerState,
        this.storageKeys.settings
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}

export const dataService = new DataService();