import { dataService, AppSettings } from './DataService';

class EmailService {
  async sendTimerAlert(sessionDuration: number, maxDuration: number): Promise<boolean> {
    try {
      const settings = await dataService.getSettings();
      
      if (!settings.emailNotifications || !settings.notificationEmail) {
        return false;
      }

      const subject = '⏰ Study Timer Alert';
      const body = `
        Your study session has exceeded the maximum duration!
        
        Current session: ${this.formatDuration(sessionDuration)}
        Maximum allowed: ${this.formatDuration(maxDuration * 60)}
        
        Time to take a break! 📚
      `;

      // In a real app, this would send to your backend API endpoint
      // For now, we'll simulate the email sending
      console.log('Email would be sent:', { 
        to: settings.notificationEmail, 
        subject, 
        body 
      });

      return await this.simulateEmailSend(settings, subject, body);
    } catch (error) {
      console.error('Error sending timer alert:', error);
      return false;
    }
  }

  private async simulateEmailSend(settings: AppSettings, subject: string, body: string): Promise<boolean> {
    // This simulates API call to backend email service
    // In production, this would be replaced with actual email service integration
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📧 Email sent successfully (simulated)');
        resolve(true);
      }, 1000);
    });
  }

  async testEmailConfiguration(): Promise<boolean> {
    try {
      const settings = await dataService.getSettings();
      
      const subject = '✅ Flip Timer - Email Test';
      const body = 'This is a test email from your Flip Timer app. Configuration is working correctly!';

      return await this.simulateEmailSend(settings, subject, body);
    } catch (error) {
      console.error('Error testing email configuration:', error);
      return false;
    }
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}

export const emailService = new EmailService();