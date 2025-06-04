// app/_layout.jsx - גרסה מתוקנת עם SplashScreen
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { getUserData } from '../services/userService';
import { LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen'; // שינוי כאן
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';

// מניעת הסתרה אוטומטית של splash screen
SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  'Warning: TNodeChildrenRenderer',
  'Warning: MemoizedTNodeRenderer',
  'Warning: TRenderEngineProvider',
  'VirtualizedList: You have a large list that is slow to update',
  'expo-app-loading is deprecated',
  'expo-notifications: Android Push notifications',
]);

const _layout = () => (
  <AuthProvider>
    <MainLayout />
  </AuthProvider>
);

const MainLayout = () => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
    Poppins_600SemiBold,
  });
  const { setAuth, setUserData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!fontsLoaded) return;

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setAuth(session.user);
          await updateUserData(session.user, session.user.email);
          router.replace('/home');
        } else {
          setAuth(null);
          router.replace('/welcome');
        }
      } catch (error) {
        console.error('Session error:', error);
        router.replace('/welcome');
      } finally {
        // הסתר את splash screen כשהכל מוכן
        await SplashScreen.hideAsync();
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth change event:', _event);
      console.log('Session user:', session?.user?.id);

      if (session) {
        setAuth(session.user);
        updateUserData(session.user, session.user.email);
        router.replace('/home');
      } else {
        setAuth(null);
        router.replace('/welcome');
      }
    });

    return () => {
      listener.subscription?.unsubscribe();
    };
  }, [fontsLoaded]);

  const updateUserData = async (user, email) => {
    try {
      let res = await getUserData(user?.id);
      if (res?.success) {
        setUserData({ ...res.data, email });
        console.log('User data updated successfully');
      }
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  // אל תחזיר כלום עד שהפונטים נטענים
  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="(main)/postDetails"
        options={{
          presentation: 'modal',
        }}
      />
    </Stack>
  );
};

export default _layout;
