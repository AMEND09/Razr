import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Bell, Clock, Trash2, TestTube } from 'lucide-react-native';
import { dataService, AppSettings } from '@/services/DataService';
import { emailService } from '@/services/EmailService';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    emailNotifications: false,
    notificationEmail: '',
    smtpConfig: {
      host: '',
      port: 587,
      secure: false,
      user: '',
      pass: '',
    },
    timerAlerts: true,
    maxSessionTime: 120,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const appSettings = await dataService.getSettings();
      setSettings(appSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await dataService.updateSettings(settings);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const testEmailConfiguration = async () => {
    try {
      const success = await emailService.testEmailConfiguration();
      if (success) {
        Alert.alert('Success', 'Test email sent successfully!');
      } else {
        Alert.alert('Error', 'Failed to send test email. Please check your configuration.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test email configuration');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your study sessions, statistics, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.clearAllData();
              Alert.alert('Success', 'All data has been cleared');
              await loadSettings();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Timer Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color="#2563EB" />
            <Text style={styles.sectionTitle}>Timer Settings</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Timer Alerts</Text>
              <Text style={styles.settingDescription}>
                Get notified when sessions exceed maximum time
              </Text>
            </View>
            <Switch
              value={settings.timerAlerts}
              onValueChange={(value) => setSettings({ ...settings, timerAlerts: value })}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Maximum Session Time (minutes)</Text>
            <TextInput
              style={styles.numberInput}
              value={settings.maxSessionTime.toString()}
              onChangeText={(text) =>
                setSettings({ ...settings, maxSessionTime: parseInt(text) || 120 })
              }
              keyboardType="numeric"
              placeholder="120"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Pause on Flip</Text>
              <Text style={styles.settingDescription}>
                When enabled, flipping device up pauses timer instead of stopping it
              </Text>
            </View>
            <Switch
              value={settings.pauseOnFlip}
              onValueChange={(value) => setSettings({ ...settings, pauseOnFlip: value })}
            />
          </View>
        </View>

        {/* Email Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mail size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>Email Notifications</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Email Alerts</Text>
              <Text style={styles.settingDescription}>
                Receive email notifications for timer alerts
              </Text>
            </View>
            <Switch
              value={settings.emailNotifications}
              onValueChange={(value) => setSettings({ ...settings, emailNotifications: value })}
            />
          </View>

          {settings.emailNotifications && (
            <>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Notification Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.notificationEmail}
                  onChangeText={(text) =>
                    setSettings({ ...settings, notificationEmail: text })
                  }
                  placeholder="your-email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>SMTP Host</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.smtpConfig.host}
                  onChangeText={(text) =>
                    setSettings({
                      ...settings,
                      smtpConfig: { ...settings.smtpConfig, host: text },
                    })
                  }
                  placeholder="smtp.gmail.com"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>SMTP Port</Text>
                <TextInput
                  style={styles.numberInput}
                  value={settings.smtpConfig.port.toString()}
                  onChangeText={(text) =>
                    setSettings({
                      ...settings,
                      smtpConfig: { ...settings.smtpConfig, port: parseInt(text) || 587 },
                    })
                  }
                  keyboardType="numeric"
                  placeholder="587"
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>SMTP Username</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.smtpConfig.user}
                  onChangeText={(text) =>
                    setSettings({
                      ...settings,
                      smtpConfig: { ...settings.smtpConfig, user: text },
                    })
                  }
                  placeholder="your-email@example.com"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>SMTP Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.smtpConfig.pass}
                  onChangeText={(text) =>
                    setSettings({
                      ...settings,
                      smtpConfig: { ...settings.smtpConfig, pass: text },
                    })
                  }
                  placeholder="App password or regular password"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <Pressable style={styles.testButton} onPress={testEmailConfiguration}>
                <TestTube size={16} color="#2563EB" />
                <Text style={styles.testButtonText}>Test Email Configuration</Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Actions</Text>
          </View>

          <Pressable style={styles.saveButton} onPress={saveSettings}>
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </Pressable>

          <Pressable style={styles.dangerButton} onPress={clearAllData}>
            <Trash2 size={16} color="#FFFFFF" />
            <Text style={styles.dangerButtonText}>Clear All Data</Text>
          </Pressable>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Email Notifications</Text>
          <Text style={styles.infoText}>
            Email notifications require SMTP configuration. For Gmail, use "smtp.gmail.com" as host and port 587.
            You'll need to generate an "App Password" instead of using your regular password.
          </Text>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  numberInput: {
    width: 80,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 8,
  },
  testButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  infoSection: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#A16207',
    lineHeight: 18,
  },
});