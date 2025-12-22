// Tour data structure types

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface TourStop {
  id: number;
  name: string;
  nameTranslated?: string | null;
  latitude: number;
  longitude: number;
  triggerRadius: number; // meters - how close user needs to be to trigger
  audioFile: string; // relative path within tour folder
  audioDuration: number; // seconds
  imageFile?: string; // relative path within tour folder
  script: string; // full transcript text
  directionToNext?: string; // navigation instruction to next stop
  distanceToNext?: number; // meters to next stop
}

export interface TourRoute {
  type: 'walking' | 'cycling';
  waypoints: [number, number][]; // [latitude, longitude] pairs for drawing route
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  language: string;
  estimatedDuration: number; // minutes
  totalDistance: number; // kilometers
  createdDate: string;
  author: string;
  coverImage?: string;
  startPoint: {
    latitude: number;
    longitude: number;
    instruction: string;
  };
  stops: TourStop[];
  route: TourRoute;
}

// Runtime state types

export interface TourProgress {
  tourId: string;
  currentStopIndex: number;
  visitedStops: Set<number>;
  isPlaying: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

export interface AudioState {
  isLoaded: boolean;
  isPlaying: boolean;
  position: number; // milliseconds
  duration: number; // milliseconds
  playbackSpeed: number;
}

export interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  timestamp: number;
}

// Settings types

export interface AppSettings {
  defaultPlaybackSpeed: number;
  autoPlayEnabled: boolean;
  defaultTriggerRadius: number;
  keepScreenOn: boolean;
  showDistanceInMeters: boolean; // vs feet
  autoPlayDirections: boolean; // Speak navigation directions after main audio
  defaultToManualMode: boolean; // Start in manual mode by default
}

// Navigation types for React Navigation

export type RootStackParamList = {
  Home: undefined;
  Tour: { tourId: string };
  Settings: undefined;
  TourCreator: undefined;
};

export type TabParamList = {
  Tours: undefined;
  Settings: undefined;
};
