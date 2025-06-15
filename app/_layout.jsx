// app/_layout.jsx - גרסה מתוקנת עם SplashScreen ו-Realtime Channels
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { getUserData } from '../services/userService';
import { LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
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
  'Warning: tried to subscribe multiple times', // הוסף את זה
]);

const _layout = () => (
  <AuthProvider>
    <MainLayout />
  </AuthProvider>
);

// 🔧 הוצא את המשתנים מחוץ לקומפוננטה כדי שישמרו בין renders
let postChannel = null;
let notificationChannel = null;
let commentsChannel = null;

const MainLayout = () => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
    Poppins_600SemiBold,
  });
  const { setAuth, setAuthWithFullData, setUserData } = useAuth();
  const router = useRouter();

  // 🔧 פונקציה לניקוי channels משופרת
  const cleanupChannels = async (userId) => {
    console.log('Cleaning up realtime channels for user:', userId || 'unknown');
    
    try {
      const channelsToClean = [
        { channel: postChannel, name: 'postChannel' },
        { channel: notificationChannel, name: 'notificationChannel' },
        { channel: commentsChannel, name: 'commentsChannel' }
      ];

      for (const { channel, name } of channelsToClean) {
        if (channel) {
          console.log(`${name} status:`, channel.state);
          try {
            await supabase.removeChannel(channel);
            console.log(`${name} removed successfully`);
          } catch (error) {
            console.warn(`Error removing ${name}:`, error);
          }
        }
      }
      
      // אפס את המשתנים
      postChannel = null;
      notificationChannel = null;
      commentsChannel = null;
      
    } catch (error) {
      console.error('Error cleaning up channels:', error);
    }
  };

  // 🔧 פונקציה להגדרת channels משופרת
  const setupRealtimeChannels = async (userId) => {
    if (!userId) return;
    
    // בדוק אם כבר יש channels פעילים
    if (postChannel || notificationChannel || commentsChannel) {
      console.log('⚠️ Channels already exist, cleaning up first...');
      await cleanupChannels(userId);
    }
    
    console.log('Setting up realtime channels for user:', userId);
    
    try {
      const timestamp = Date.now();
      
      // צור channels חדשים עם שמות ייחודיים
      postChannel = supabase
        .channel(`posts-${userId}-${timestamp}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'posts'
        }, (payload) => {
          console.log('Post change received:', payload);
        })
        .subscribe((status) => {
          console.log('postChannel status:', status);
        });

      notificationChannel = supabase
        .channel(`notifications-${userId}-${timestamp}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          console.log('Notification change received:', payload);
        })
        .subscribe((status) => {
          console.log('notificationChannel status:', status);
        });

      commentsChannel = supabase
        .channel(`comments-${userId}-${timestamp}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'comments'
        }, (payload) => {
          console.log('Comment change received:', payload);
        })
        .subscribe((status) => {
          console.log('commentsChannel status:', status);
        });
        
      console.log('✅ All channels set up successfully');
        
    } catch (error) {
      console.error('Error setting up channels:', error);
    }
  };

  useEffect(() => {
    if (!fontsLoaded) return;
  
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
  
        if (session) {
          // 🔧 השתמש בפונקציה החדשה שטוענת נתונים מלאים
          await setAuthWithFullData(session.user); // במקום setAuth
          router.replace('/home');
        } else {
          setAuth(null);
          router.replace('/welcome');
        }
      } catch (error) {
        console.error('Session error:', error);
        router.replace('/splash');
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth change event:', _event);
      console.log('Session user:', session?.user?.id);

      if (session) {
        // 🔧 השתמש בפונקציה החדשה
        await setAuthWithFullData(session.user); // במקום setAuth
        if (_event === 'SIGNED_IN') {
          await setupRealtimeChannels(session.user.id);
        }
        router.replace('/home');
      } else {
        await cleanupChannels(session?.user?.id);
        setAuth(null);
        router.replace('/splash');
      }
    });

    // 🔧 cleanup function
    return () => {
      listener.subscription?.unsubscribe();
      // נקה channels כשהקומפוננטה נהרסת
      cleanupChannels();
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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
};

export default _layout;