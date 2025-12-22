// Tour and Stop Types

export interface TourStop {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  triggerRadius: number; // meters
  audioFile: string;
  imageFile?: string;
  script?: string;
  directionToNext?: string;
  estimatedDuration?: number; // seconds
}

export interface TourStartPoint {
  latitude: number;
  longitude: number;
  address?: string;
  instructions?: string;
}

export interface TourAccessibility {
  wheelchairAccessible?: boolean;
  hasStairs?: boolean;
  strollerFriendly?: boolean;
  terrainType?: 'paved' | 'gravel' | 'mixed' | 'rough';
}

export interface Tour {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  language: string;
  stops: TourStop[];
  startPoint: TourStartPoint;
  coverImage?: string;
  totalDistance?: number; // km
  estimatedDuration: number; // minutes
  difficulty?: 'easy' | 'moderate' | 'challenging';
  accessibility?: TourAccessibility;
  bestTimeToVisit?: string;
  tips?: string;
  route?: TourRoute;
  createdAt?: string;
  updatedAt?: string;
}

export interface TourRoute {
  coordinates: Array<{
    latitude: number;
    longitude: number;
  }>;
  detailedPath?: GeoJSON.LineString;
}

// Location Types

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

export interface LocationState {
  location: UserLocation | null;
  error: string | null;
  isTracking: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
}

// Audio Types

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  duration: number; // milliseconds
  position: number; // milliseconds
  error: string | null;
}

export interface AudioPlayerControls {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  loadAudio: (uri: string) => Promise<void>;
}

// Progress Types

export interface TourProgress {
  currentStopIndex: number;
  completedStopIds: number[];
  isComplete: boolean;
}

export interface SavedProgress {
  tourId: string;
  currentStopIndex: number;
  completedStopIds: number[];
  lastPlayedAt: string;
  audioPosition?: number;
  isComplete: boolean;
  totalStops: number;
}

// Settings Types

export interface AppSettings {
  autoPlayAudio: boolean;
  hapticFeedback: boolean;
  keepScreenOn: boolean;
  audioVolume: number;
  distanceUnit: 'km' | 'miles';
  defaultTriggerRadius: number;
  showTranscripts: boolean;
  highContrastMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoPlayAudio: true,
  hapticFeedback: true,
  keepScreenOn: true,
  audioVolume: 1.0,
  distanceUnit: 'km',
  defaultTriggerRadius: 30,
  showTranscripts: true,
  highContrastMode: false,
};

// Geofence Types

export interface GeofenceEvent {
  stopIndex: number;
  enteredAt: Date;
  exitedAt?: Date;
}

export interface GeofenceState {
  isInGeofence: boolean;
  currentGeofenceStopId: number | null;
  distanceToNextStop: number | null;
  events: GeofenceEvent[];
}

// Offline Types

export interface OfflineStatus {
  audio: boolean;
  images: boolean;
  maps: boolean;
}

export interface DownloadProgress {
  downloaded: number;
  total: number;
  currentFile: string;
  stage: 'audio' | 'images' | 'maps' | 'complete';
}

// Navigation Types

export type RootStackParamList = {
  Home: undefined;
  TourDetail: { tour: Tour };
  Tour: { tour: Tour; resumeFromStop?: number };
  Settings: undefined;
};

// Direction Types

export interface WalkingDirection {
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
  maneuver?: string;
}

export interface RouteSegment {
  fromStopId: number;
  toStopId: number;
  distance: number; // meters
  duration: number; // seconds
  directions: WalkingDirection[];
  geometry?: GeoJSON.LineString;
}

// GeoJSON Types (simplified for our use)
declare namespace GeoJSON {
  interface LineString {
    type: 'LineString';
    coordinates: Array<[number, number]>;
  }
}

// Export convenience type for stop with optional properties filled
export type CompleteStop = Required<TourStop>;

// Map Types

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapMarker {
  id: string | number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  pinColor?: string;
}
