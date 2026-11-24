
import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef
} from '@angular/core';

import {
  Platform,
  IonInput
} from '@ionic/angular';

import { Subscription } from 'rxjs';

import { TripService } from '../../services/trip.service';

declare const google: any;

@Component({
  selector: 'app-trip',
  templateUrl: './trip.page.html',
  styleUrls: ['./trip.page.scss'],
  standalone: false
})
export class TripPage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('mapElement')
  mapElement!: ElementRef<HTMLDivElement>;

  @ViewChild('fromInput')
  fromInput!: IonInput;

  @ViewChild('toInput')
  toInput!: IonInput;

  // Google Maps API key.
  // Replace this with your actual API key.
  private googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY';

  private map: any;
  private directionsService: any;
  private directionsRenderer: any;
  private geocoder: any;

  private fromAutocomplete: any;
  private toAutocomplete: any;

  private currentMarker: any;

  fromAddress = 'Detecting current location...';
  toAddress = '';

  fromLocation: any = null;
  toLocation: any = null;

  routeDistance = '--';
  routeDuration = '--';

  actualDistance = 0;

  isTracking = false;
  trackingStarted = false;
  trackingCompleted = false;

  loading = true;
  mapReady = false;

  errorMessage = '';

  private distanceSubscription?: Subscription;
  private trackingSubscription?: Subscription;
  private locationSubscription?: Subscription;

  constructor(
    private tripService: TripService,
    private platform: Platform
  ) {}

  async ngOnInit() {

    await this.platform.ready();

    try {

      await this.tripService.initialize();

      this.distanceSubscription =
        this.tripService.distance$.subscribe(value => {
          this.actualDistance = value;
        });

      this.trackingSubscription =
        this.tripService.tracking$.subscribe(value => {

          this.isTracking = value;

          if (value) {
            this.trackingStarted = true;
          }

          if (!value && this.trackingStarted) {
            this.trackingCompleted = true;
          }

        });

      this.locationSubscription =
        this.tripService.locations$.subscribe(locations => {

          if (locations.length > 0) {

            const last = locations[locations.length - 1];

            this.updateCurrentMarker(
              last.latitude,
              last.longitude
            );

          }

        });

    } catch (error) {

      console.error('GPS initialization error:', error);

      this.errorMessage =
        'Unable to initialize background GPS tracking.';

    }
  }

  async ngAfterViewInit() {

    try {

      await this.loadGoogleMaps();

      this.initializeMap();

      this.initializeAutocomplete();

      await this.detectCurrentLocation();

    } catch (error) {

      console.error('Google Maps error:', error);

      this.errorMessage =
        'Unable to load Google Maps. Please check your API key and API settings.';

    } finally {

      this.loading = false;

    }
  }

  // Load Google Maps JavaScript API.
  loadGoogleMaps(): Promise<void> {

    return new Promise((resolve, reject) => {

      const existingWindow = window as any;

      if (existingWindow.google?.maps?.places) {
        resolve();
        return;
      }

      const existingScript =
        document.querySelector('#google-maps-script');

      if (existingScript) {

        existingScript.addEventListener('load', () => resolve());

        existingScript.addEventListener('error', () => reject());

        return;
      }

      const script = document.createElement('script');

      script.id = 'google-maps-script';

      script.src =
        'https://maps.googleapis.com/maps/api/js' +
        '?key=' + this.googleMapsApiKey +
        '&libraries=places';

      script.async = true;
      script.defer = true;

      script.onload = () => resolve();

      script.onerror = () => reject(
        new Error('Google Maps script failed to load')
      );

      document.head.appendChild(script);

    });
  }

  // Initialize map.
  initializeMap() {

    this.map = new google.maps.Map(
      this.mapElement.nativeElement,
      {
        center: {
          lat: 13.0827,
          lng: 80.2707
        },

        zoom: 14,

        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,

        zoomControl: true,

        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      }
    );

    this.directionsService =
      new google.maps.DirectionsService();

    this.directionsRenderer =
      new google.maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#2878ff',
          strokeWeight: 6
        }
      });

    this.geocoder = new google.maps.Geocoder();

    this.mapReady = true;
  }

  // Enable address search suggestions.
  async initializeAutocomplete() {

    const fromElement =
      await this.fromInput.getInputElement();

    const toElement =
      await this.toInput.getInputElement();

    const options = {
      componentRestrictions: {
        country: 'in'
      },

      fields: [
        'formatted_address',
        'geometry',
        'name'
      ]
    };

    this.fromAutocomplete =
      new google.maps.places.Autocomplete(
        fromElement,
        options
      );

    this.toAutocomplete =
      new google.maps.places.Autocomplete(
        toElement,
        options
      );

    this.fromAutocomplete.addListener(
      'place_changed',
      () => {

        const place =
          this.fromAutocomplete.getPlace();

        if (!place.geometry?.location) {
          return;
        }

        this.fromLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };

        this.fromAddress =
          place.formatted_address || place.name;

        this.calculateRoute();
      }
    );

    this.toAutocomplete.addListener(
      'place_changed',
      () => {

        const place =
          this.toAutocomplete.getPlace();

        if (!place.geometry?.location) {
          return;
        }

        this.toLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };

        this.toAddress =
          place.formatted_address || place.name;

        this.calculateRoute();
      }
    );

  }

  // Detect current GPS location.
  async detectCurrentLocation() {

    try {

      const location =
        await this.tripService.getCurrentPosition();

      this.fromLocation = {
        lat: location.latitude,
        lng: location.longitude
      };

      this.fromAddress =
        await this.getAddress(
          location.latitude,
          location.longitude
        );

      this.map.setCenter(this.fromLocation);

      this.updateCurrentMarker(
        location.latitude,
        location.longitude
      );

    } catch (error) {

      console.error('Current location error:', error);

      this.errorMessage =
        'Unable to detect current location. Enable GPS permission.';

    }

  }

  // Reverse geocoding.
  getAddress(
    latitude: number,
    longitude: number
  ): Promise<string> {

    return new Promise(resolve => {

      this.geocoder.geocode(
        {
          location: {
            lat: latitude,
            lng: longitude
          }
        },

        (results: any, status: any) => {

          if (
            status === 'OK' &&
            results &&
            results.length > 0
          ) {

            resolve(results[0].formatted_address);

          } else {

            resolve('Current location');

          }

        }
      );

    });

  }

  // Calculate route, distance and estimated duration.
  calculateRoute() {

    if (!this.fromLocation || !this.toLocation) {
      return;
    }

    this.directionsService.route(

      {
        origin: this.fromLocation,

        destination: this.toLocation,

        travelMode: google.maps.TravelMode.DRIVING

      },

      async (result: any, status: any) => {

        if (
          status === google.maps.DirectionsStatus.OK
        ) {

          this.directionsRenderer.setDirections(result);

          const leg = result.routes[0].legs[0];

          this.routeDistance =
            leg.distance?.text || '--';

          this.routeDuration =
            leg.duration?.text || '--';

          // Set destination for automatic GPS completion.
          this.tripService.setDestination(
            this.toLocation.lat,
            this.toLocation.lng,
            50
          );

          // Start background tracking automatically.
          if (!this.isTracking && !this.trackingCompleted) {

            await this.startBackgroundTracking();

          }

        } else {

          console.error('Directions error:', status);

          this.errorMessage =
            'Unable to calculate route. Please try another location.';

        }

      }

    );

  }

  // Automatically start background tracking.
  async startBackgroundTracking() {

    try {

      this.loading = true;

      await this.tripService.startTrip();

      this.trackingStarted = true;

      this.trackingCompleted = false;

    } catch (error) {

      console.error('Background tracking error:', error);

      this.errorMessage =
        'Unable to start background GPS tracking.';

    } finally {

      this.loading = false;

    }

  }

  // Update current GPS marker.
  updateCurrentMarker(
    latitude: number,
    longitude: number
  ) {

    if (!this.mapReady) {
      return;
    }

    const position = {
      lat: latitude,
      lng: longitude
    };

    if (!this.currentMarker) {

      this.currentMarker =
        new google.maps.Marker({
          position: position,
          map: this.map,
          title: 'Current Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: '#2878ff',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
          }
        });

    } else {

      this.currentMarker.setPosition(position);

    }

  }

  // Clear destination and route.
  clearDestination() {

    if (this.isTracking) {
      return;
    }

    this.toAddress = '';
    this.toLocation = null;

    this.routeDistance = '--';
    this.routeDuration = '--';

    this.directionsRenderer.setDirections({
      routes: []
    });

    this.errorMessage = '';

  }

  ngOnDestroy() {

    this.distanceSubscription?.unsubscribe();

    this.trackingSubscription?.unsubscribe();

    this.locationSubscription?.unsubscribe();

    // Do not stop Background GPS here.
    // GPS must continue when the page is closed.

  }

}
