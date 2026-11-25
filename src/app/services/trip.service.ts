
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare var BackgroundGeolocation: any;

export interface TripLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class TripService {

  private tracking = false;
  private initialized = false;
  private completionInProgress = false;

  private locations: TripLocation[] = [];
  private distance = 0;
  private tripStartTime = 0;

  private destination: TripLocation | null = null;
  private destinationRadius = 0.05;

  distance$ = new BehaviorSubject<number>(0);
  tracking$ = new BehaviorSubject<boolean>(false);
  locations$ = new BehaviorSubject<TripLocation[]>([]);

  constructor(private ngZone: NgZone) {}

  async initialize() {
    if (this.initialized) {
      return;
    }

    if (typeof BackgroundGeolocation === 'undefined') {
      throw new Error('Background Geolocation plugin is unavailable');
    }

    await BackgroundGeolocation.ready({
      reset: false,
      desiredAccuracy: 0,
      distanceFilter: 10,
      stopOnTerminate: false,
      startOnBoot: false,
      debug: false,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      notification: {
        title: 'TaskApp Location Tracking',
        text: 'Background location tracking is active'
      }
    });

    BackgroundGeolocation.onLocation(
      (location: any) => {
        this.ngZone.run(() => {
          if (!this.tracking) {
            return;
          }

          const newLocation: TripLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date(location.timestamp).getTime()
          };

          this.addLocation(newLocation);
        });
      },
      (error: any) => {
        console.error('GPS error:', error);
      }
    );

    this.initialized = true;
  }

  async getCurrentPosition(): Promise<TripLocation> {
    const location =
      await BackgroundGeolocation.getCurrentPosition({
        timeout: 30,
        maximumAge: 5000,
        desiredAccuracy: 10
      });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: new Date(location.timestamp).getTime()
    };
  }

  setDestination(
    latitude: number,
    longitude: number,
    radiusInMeters: number = 50
  ) {
    this.destination = {
      latitude,
      longitude,
      timestamp: Date.now()
    };

    this.destinationRadius = radiusInMeters / 1000;
  }

  async startTrip() {
    if (this.tracking) {
      return;
    }

    this.locations = [];
    this.distance = 0;
    this.completionInProgress = false;

    this.ngZone.run(() => {
      this.locations$.next([]);
      this.distance$.next(0);
    });

    const firstLocation = await this.getCurrentPosition();

    this.ngZone.run(() => {
      this.locations.push(firstLocation);
      this.locations$.next([...this.locations]);

      this.tripStartTime = Date.now();
      this.tracking = true;
      this.tracking$.next(true);
    });

    await BackgroundGeolocation.start();
  }

  private addLocation(location: TripLocation) {
    if (this.locations.length > 0) {
      const previous = this.locations[this.locations.length - 1];

      const calculatedDistance = this.calculateDistance(
        previous.latitude,
        previous.longitude,
        location.latitude,
        location.longitude
      );

      // Ignore inaccurate GPS jumps greater than 1 KM.
      if (calculatedDistance > 1) {
        return;
      }

      this.distance += calculatedDistance;
      this.distance$.next(this.distance);
    }

    this.locations.push(location);
    this.locations$.next([...this.locations]);

    // Automatically complete tracking at destination.
    if (this.destination && !this.completionInProgress) {
      const remainingDistance = this.calculateDistance(
        location.latitude,
        location.longitude,
        this.destination.latitude,
        this.destination.longitude
      );

      if (remainingDistance <= this.destinationRadius) {
        this.completionInProgress = true;

        this.endTrip().catch(error => {
          console.error('Automatic trip completion error:', error);
        });
      }
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const earthRadius = 6371;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

    return earthRadius * c;
  }

  async endTrip() {
    if (!this.tracking) {
      return;
    }

    this.ngZone.run(() => {
      this.tracking = false;
      this.tracking$.next(false);
    });

    await BackgroundGeolocation.stop();
  }

  getLocations() {
    return [...this.locations];
  }

  isTracking() {
    return this.tracking;
  }

  getTripDistance() {
    return this.distance;
  }

  getTripStartTime() {
    return this.tripStartTime;
  }
}
