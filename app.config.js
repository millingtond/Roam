import 'dotenv/config';

export default {
  expo: {
    name: "Audio Tour",
    slug: "audio-tour-app",
    version: "1.0.0",
    sdkVersion: "54.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0891b2"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.daniels.audiotour",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app needs your location to guide you through the walking tour and trigger audio at each stop.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs your location to guide you through the walking tour and trigger audio at each stop.",
        UIBackgroundModes: ["location", "audio"]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0891b2"
      },
      package: "com.daniels.audiotour",
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE"
      ],
      config: {
        googleMaps: {
          // This line securely reads the key from your .env file
          apiKey: process.env.GOOGLE_MAPS_API_KEY 
        }
      }
    },
    plugins: [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Audio Tour to use your location to guide you through walking tours."
        }
      ]
    ]
  }
};