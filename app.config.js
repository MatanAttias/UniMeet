export default {
  expo: {
    name: 'UniMeet',
    slug: 'UniMeet',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'myapp',
    userInterfaceStyle: 'automatic',

    splash: {
      image: './assets/images/logos.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },

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

    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          // מיישר ל־splash הראשי
          image: './assets/images/logos.png',
          resizeMode: 'contain',
          backgroundColor: '#000000',
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