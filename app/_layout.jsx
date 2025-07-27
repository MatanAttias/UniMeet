import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';

// השתקת האזהרות
LogBox.ignoreLogs([
  'Warning: TNodeChildrenRenderer',
  'Warning: MemoizedTNodeRenderer',
  'Warning: TRenderEngineProvider',
  'VirtualizedList: You have a large list that is slow to update',
  'expo-app-loading is deprecated',
  'expo-notifications: Android Push notifications',
  'Warning: tried to subscribe multiple times',
  'Internal React error: Expected static flag was missing',
  '[Reanimated] Reading from `value` during component render',
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

  // Prevent native splash from auto-hiding until we're ready
  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => {
      /* ignore */
    });
  }, []);

  // Once fonts are loaded, check session, navigate and hide splash
  useEffect(() => {
    if (!fontsLoaded) return;

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const success = await setAuthWithFullData(session.user);

          if (success) {
            await setupRealtimeChannels(session.user.id);
            router.replace('/home');
          } else {
            router.replace('/splash');
          }
        } else {
          setAuth(null);
          router.replace('/splash');
        }
      } catch {
        router.replace('/splash');
      } finally {
        // Now that navigation decision is made, hide the native splash
        await SplashScreen.hideAsync();
      }
    };

    init();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'SIGNED_OUT') {
        await cleanupChannels(session?.user?.id);
        setAuth(null);
        setTimeout(() => router.replace('/splash'), 100);
        return;
      }

      if (session?.user) {
        const success = await setAuthWithFullData(session.user);
        if (_event === 'SIGNED_IN') {
          await setupRealtimeChannels(session.user.id);
        }
        if (success) {
          setTimeout(() => router.replace('/home'), 100);
        } else {
          router.replace('/splash');
        }
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
      cleanupChannels().catch(() => {
        /* ignore */
      });
    };
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

async function cleanupChannels(userId) {
  try {
    for (const channel of [postChannel, notificationChannel, commentsChannel]) {
      if (channel) {
        await supabase.removeChannel(channel).catch(() => {});
      }
    }
  } catch {}
  postChannel = notificationChannel = commentsChannel = null;
}

async function setupRealtimeChannels(userId) {
  if (!userId) return;
  await cleanupChannels(userId);

  const timestamp = Date.now();
  postChannel = supabase
    .channel(`posts-${userId}-${timestamp}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {})
    .subscribe(() => {});

  notificationChannel = supabase
    .channel(`notifications-${userId}-${timestamp}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      () => {}
    )
    .subscribe(() => {});

  commentsChannel = supabase
    .channel(`comments-${userId}-${timestamp}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {})
    .subscribe(() => {});
}

export default _layout;
