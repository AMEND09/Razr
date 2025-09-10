import { Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

export type OrientationCallback = (isFlipped: boolean) => void;

class OrientationService {
  private callbacks: OrientationCallback[] = [];
  private isFlipped = false;
  private subscription: any = null;
  private webOrientationHandler: ((event: DeviceOrientationEvent) => void) | null = null;
  // smoothing / stability state
  private emaZ: number | null = null; // exponential moving average of z (mobile)
  private alpha = 0.25; // EMA smoothing factor (0..1)
  private flipEnterThreshold = -0.6; // when EMA z is below this, consider entering flipped
  private flipExitThreshold = -0.2; // when EMA z rises above this, consider exiting flipped
  private stableRequired = 3; // number of consecutive samples required to change state
  private flipStableCount = 0;
  private unflipStableCount = 0;

  constructor() {
    this.startListening();
  }

  addCallback(callback: OrientationCallback) {
    this.callbacks.push(callback);
  }

  removeCallback(callback: OrientationCallback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  private notifyCallbacks(isFlipped: boolean) {
    if (this.isFlipped !== isFlipped) {
      this.isFlipped = isFlipped;
      this.callbacks.forEach(callback => callback(isFlipped));
    }
  }

  private startListening() {
    if (Platform.OS === 'web') {
      this.startWebOrientation();
    } else {
      this.startMobileOrientation();
    }
  }

  private startWebOrientation() {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      this.webOrientationHandler = (event: DeviceOrientationEvent) => {
        const { beta } = event;
        if (beta !== null) {
          // DeviceOrientation beta: front-to-back tilt (-180 .. 180)
          // For face-down we expect beta near -180 or 180; using a tighter threshold
          // plus a small hysteresis so the UI isn't jittery when near the edge.
          const absBeta = Math.abs(beta);
          // thresholds (degrees)
          const enterDeg = 150; // enter flipped when > 150deg
          const exitDeg = 30; // exit flipped when < 30deg

          // simple stability counters to avoid rapid toggles
          if (absBeta > enterDeg) {
            this.flipStableCount += 1;
            this.unflipStableCount = 0;
          } else if (absBeta < exitDeg) {
            this.unflipStableCount += 1;
            this.flipStableCount = 0;
          } else {
            // in-between: decay counters slowly
            this.flipStableCount = Math.max(0, this.flipStableCount - 1);
            this.unflipStableCount = Math.max(0, this.unflipStableCount - 1);
          }

          if (this.flipStableCount >= this.stableRequired) {
            this.notifyCallbacks(true);
          } else if (this.unflipStableCount >= this.stableRequired) {
            this.notifyCallbacks(false);
          }
        }
      };

      // Request permission for iOS
      if ((DeviceOrientationEvent as any).requestPermission) {
        (DeviceOrientationEvent as any).requestPermission().then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', this.webOrientationHandler!);
          }
        });
      } else {
        window.addEventListener('deviceorientation', this.webOrientationHandler);
      }
    }
  }

  private startMobileOrientation() {
    // Increase responsiveness while keeping noise reasonable
    DeviceMotion.setUpdateInterval(100);

    this.subscription = DeviceMotion.addListener((motion) => {
      // prefer accelerationIncludingGravity if available, fall back to acceleration
      // expo DeviceMotion payload may include `acceleration` and/or `accelerationIncludingGravity`
      // use any available z value
      const accAny: any = (motion as any).accelerationIncludingGravity ?? (motion as any).acceleration;
      if (!accAny || typeof accAny.z !== 'number') return;

      const z = accAny.z as number;

      // initialize EMA
      if (this.emaZ === null) this.emaZ = z;
      // update EMA
      this.emaZ = this.alpha * z + (1 - this.alpha) * this.emaZ;

      // hysteresis + stability counters
      if (this.emaZ < this.flipEnterThreshold) {
        this.flipStableCount += 1;
        this.unflipStableCount = 0;
      } else if (this.emaZ > this.flipExitThreshold) {
        this.unflipStableCount += 1;
        this.flipStableCount = 0;
      } else {
        // near threshold - decay counters to avoid rapid toggles
        this.flipStableCount = Math.max(0, this.flipStableCount - 1);
        this.unflipStableCount = Math.max(0, this.unflipStableCount - 1);
      }

      if (this.flipStableCount >= this.stableRequired) {
        this.notifyCallbacks(true);
      } else if (this.unflipStableCount >= this.stableRequired) {
        this.notifyCallbacks(false);
      }
    });
  }

  getCurrentOrientation(): boolean {
    return this.isFlipped;
  }

  destroy() {
    if (Platform.OS === 'web' && this.webOrientationHandler) {
      window.removeEventListener('deviceorientation', this.webOrientationHandler);
      this.webOrientationHandler = null;
    } else if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    
    this.callbacks = [];
  }
}

export const orientationService = new OrientationService();