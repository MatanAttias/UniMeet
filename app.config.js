require('dotenv').config();

export default {
  expo: {
    name: 'UniMeet',
    slug: 'UniMeet',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.anonymous.UniMeet',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.anonymous.UniMeet',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    splash: {
      image: './assets/images/logos.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      'expo-font',
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      openaiApiKey: process.env.OPENAI_API_KEY,
    },
  },
};
