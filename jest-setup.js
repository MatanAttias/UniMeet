import '@testing-library/jest-native/extend-expect';

// Mock של React Native modules
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn(),
}));

// Mock של Alert
global.alert = jest.fn();
jest.mock('react-native', () => {
  return {
    StyleSheet: {
      create: jest.fn(x => x),
    },
    Text: 'Text',
    View: 'View',
    TouchableOpacity: 'TouchableOpacity',
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      select: jest.fn(),
    },
    Dimensions: {
      get: jest.fn(() => ({
        width: 375,
        height: 812,
      })),
    },
  };
});

// Mock של Expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

// Mock של Supabase
jest.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      ilike: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    })),
  },
}));

// Mock של הקומפוננטים שלך
jest.mock('./components/ScreenWrapper', () => 'ScreenWrapper');
jest.mock('./components/CustomBackButton', () => 'CustomBackButton');
jest.mock('./components/input', () => 'Input');
jest.mock('./components/Button', () => 'Button');
jest.mock('./assets/icons', () => () => 'Icon');

// Mock של הקבועים
jest.mock('./constants/helpers/common', () => ({
  hp: jest.fn(x => x),
  wp: jest.fn(x => x),
}));

jest.mock('./constants/theme', () => ({
  theme: {
    colors: {
      dark: '#000',
      textPrimary: '#fff',
      primary: '#007AFF',
    },
    fonts: {
      bold: '700',
      semibold: '600',
    },
    radius: {
      md: 8,
    },
  },
}));