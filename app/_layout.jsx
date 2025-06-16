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

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs([
  'Warning: TNodeChildrenRenderer',
  'Warning: MemoizedTNodeRenderer',
  'Warning: TRenderEngineProvider',
  'VirtualizedList: You have a large list that is slow to update',
  'expo-app-loading is deprecated',
  'expo-notifications: Android Push notifications',
  'Warning: tried to subscribe multiple times', 
]);

const _layout = () => (
  <AuthProvider>
    <MainLayout />
  </AuthProvider>
);

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

  const cleanupChannels = async (userId) => {
    
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
      
      postChannel = null;
      notificationChannel = null;
      commentsChannel = null;
      
    } catch (error) {
    }
  };

  const setupRealtimeChannels = async (userId) => {
    if (!userId) return;
    
    if (postChannel || notificationChannel || commentsChannel) {
      await cleanupChannels(userId);
    }
    
    
    try {
      const timestamp = Date.now();
      
      postChannel = supabase
        .channel(`posts-${userId}-${timestamp}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'posts'
        }, (payload) => {
        })
        .subscribe((status) => {
        });

      notificationChannel = supabase
        .channel(`notifications-${userId}-${timestamp}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
        })
        .subscribe((status) => {
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
        });
        
      console.log('✅ All channels set up successfully');
        
    } catch (error) {
      console.error('Error setting up channels:', error);
    }
  };

  useEffect(() => {
    if (!fontsLoaded) return;

    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          await setAuthWithFullData(session.user); 
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

      if (session) {
        await setAuthWithFullData(session.user); 
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

    return () => {
      listener.subscription?.unsubscribe();
      cleanupChannels();
    };
  }, [fontsLoaded]);

  const updateUserData = async (user, email) => {
    try {
      let res = await getUserData(user?.id);
      if (res?.success) {
        setUserData({ ...res.data, email });
      }
    } catch (error) {
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