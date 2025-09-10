import { useState, useEffect, useCallback } from 'react';
import { dataService, StudySession, TimerState } from '@/services/DataService';
import { orientationService } from '@/services/OrientationService';
import { emailService } from '@/services/EmailService';
import { TimeUtils } from '@/utils/TimeUtils';

export function useTimer() {
  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    startTime: null,
    currentSession: null,
    flipCount: 0
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedElapsed, setPausedElapsed] = useState(0);

  // Load timer state on mount
  useEffect(() => {
    loadTimerState();
  }, []);

  // Set up orientation listener
  useEffect(() => {
    const handleOrientationChange = async (flipped: boolean) => {
      setIsFlipped(flipped);
      
      const settings = await dataService.getSettings();
      
      if (flipped && !timerState.isActive && !isPaused) {
        startTimer();
      } else if (!flipped && timerState.isActive) {
        if (settings.pauseOnFlip) {
          pauseTimer();
        } else {
          stopTimer();
        }
      } else if (flipped && isPaused) {
        resumeTimer();
      }
    };

    orientationService.addCallback(handleOrientationChange);
    
    return () => {
      orientationService.removeCallback(handleOrientationChange);
    };
  }, [timerState.isActive, isPaused]);

  // Update elapsed time every second when timer is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerState.isActive && timerState.startTime && !isPaused) {
      interval = setInterval(() => {
        const elapsed = TimeUtils.getElapsedTime(timerState.startTime!) + pausedElapsed;
        setElapsedTime(elapsed);
        
        // Check for timer alerts
        checkTimerAlerts(elapsed);
      }, 1000);
    } else if (isPaused) {
      // Keep the elapsed time static when paused
      setElapsedTime(pausedElapsed + (timerState.startTime ? TimeUtils.getElapsedTime(timerState.startTime!) : 0));
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState.isActive, timerState.startTime, isPaused, pausedElapsed]);

  const loadTimerState = async () => {
    try {
      const state = await dataService.getTimerState();
      setTimerState(state);
      
      if (state.isActive && state.startTime) {
        const elapsed = TimeUtils.getElapsedTime(state.startTime) + pausedElapsed;
        setElapsedTime(elapsed);
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
    }
  };

  const startTimer = useCallback(async () => {
    try {
      const worldTime = await TimeUtils.getCurrentWorldTime();
      const sessionId = TimeUtils.generateId();
      
      const newState = {
        isActive: true,
        startTime: worldTime.toISOString(),
        currentSession: sessionId,
        flipCount: timerState.flipCount + 1
      };

      setTimerState(newState);
      await dataService.updateTimerState(newState);
      setElapsedTime(0);
      setIsPaused(false);
      setPausedElapsed(0);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  }, [timerState.flipCount]);

  const stopTimer = useCallback(async () => {
    try {
      if (!timerState.isActive || !timerState.startTime || !timerState.currentSession) {
        return;
      }

      const worldTime = await TimeUtils.getCurrentWorldTime();
      const duration = TimeUtils.calculateDuration(timerState.startTime, worldTime.toISOString()) + pausedElapsed;

      // Create study session record
      const session: StudySession = {
        id: timerState.currentSession,
        startTime: timerState.startTime,
        endTime: worldTime.toISOString(),
        duration,
        createdAt: worldTime.toISOString(),
        isManual: false
      };

      await dataService.addSession(session);

      const newState = {
        isActive: false,
        startTime: null,
        currentSession: null,
        flipCount: timerState.flipCount
      };

      setTimerState(newState);
      await dataService.updateTimerState(newState);
      setElapsedTime(0);
      setIsPaused(false);
      setPausedElapsed(0);
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  }, [timerState]);

  const checkTimerAlerts = async (elapsed: number) => {
    try {
      const settings = await dataService.getSettings();
      
      if (settings.timerAlerts && elapsed > settings.maxSessionTime * 60) {
        // Send email alert if enabled
        if (settings.emailNotifications) {
          await emailService.sendTimerAlert(elapsed, settings.maxSessionTime);
        }
      }
    } catch (error) {
      console.error('Error checking timer alerts:', error);
    }
  };

  const pauseTimer = useCallback(async () => {
    try {
      if (!timerState.isActive || !timerState.startTime) {
        return;
      }

      const currentElapsed = TimeUtils.getElapsedTime(timerState.startTime);
      setPausedElapsed(pausedElapsed + currentElapsed);
      setIsPaused(true);
      
      // Update timer state to inactive but keep session info
      const newState = {
        ...timerState,
        isActive: false,
        startTime: null
      };
      
      setTimerState(newState);
      await dataService.updateTimerState(newState);
    } catch (error) {
      console.error('Error pausing timer:', error);
    }
  }, [timerState, pausedElapsed]);

  const resumeTimer = useCallback(async () => {
    try {
      if (!isPaused || !timerState.currentSession) {
        return;
      }

      const worldTime = await TimeUtils.getCurrentWorldTime();
      
      const newState = {
        ...timerState,
        isActive: true,
        startTime: worldTime.toISOString()
      };

      setTimerState(newState);
      await dataService.updateTimerState(newState);
      setIsPaused(false);
    } catch (error) {
      console.error('Error resuming timer:', error);
    }
  }, [timerState, isPaused]);

  const resetTimer = useCallback(async () => {
    try {
      const newState = {
        isActive: false,
        startTime: null,
        currentSession: null,
        flipCount: timerState.flipCount
      };

      setTimerState(newState);
      await dataService.updateTimerState(newState);
      setElapsedTime(0);
      setIsPaused(false);
      setPausedElapsed(0);
    } catch (error) {
      console.error('Error resetting timer:', error);
    }
  }, [timerState.flipCount]);

  return {
    isActive: timerState.isActive || isPaused,
    isPaused,
    elapsedTime,
    isFlipped,
    flipCount: timerState.flipCount,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    resetTimer
  };
}