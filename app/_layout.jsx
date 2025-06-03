import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { getUserData } from '../services/userService';
import { LogBox } from 'react-native';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_700Bold,
  Poppins_600SemiBold,
} from '@expo-google-fonts/poppins';
import AppLoading from 'expo-app-loading';

LogBox.ignoreLogs([
  'Warning: TNodeChildrenRenderer',
  'Warning: MemoizedTNodeRenderer',
  'Warning: TRenderEngineProvider',
]);

const _layout = () => (
  <AuthProvider>
    <MainLayout />
  </AuthProvider>
);

const MainLayout = () => {
  // כל ה-hooks בראש
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
    Poppins_600SemiBold,
  });
  const { setAuth, setUserData } = useAuth();
  const router = useRouter();

  // useEffect תמיד קיים! בודק בתוך ה-hook אם יש פונטים
  useEffect(() => {
    if (!fontsLoaded) return; // כלום עד שהפונטים נטענים

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session user:', session?.user?.id);

      if (session) {
        setAuth(session.user);
        updateUserData(session.user, session.user.email);
        router.replace('/home');
      } else {
        setAuth(null);
        router.replace('/splash');
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
        router.replace('/splash');
      }
    });

    return () => {
      listener.subscription?.unsubscribe();
    };
    // eslint-disable-next-line
  }, [fontsLoaded]); // תלוי גם ב-fontsLoaded

  const updateUserData = async (user, email) => {
    let res = await getUserData(user?.id);
    if (res?.success) setUserData({ ...res.data, email });
  };

  // עכשיו אפשר להחזיר AppLoading אם הפונטים לא נטענו
  if (!fontsLoaded) return <AppLoading />;

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
