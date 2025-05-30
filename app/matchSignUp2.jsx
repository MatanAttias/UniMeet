import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';
import Icon from '../assets/icons';
import { supabase } from '../lib/supabase';

const MatchSignUp = () => {
  const router = useRouter();
  const {
    fullName,
    email,
    birth_date,
    gender,
    connectionTypes,
    image,
    wantsNotifications = 'false',
    location = null,    // קיבלנו מחרוזת JSON או null
  } = useLocalSearchParams();

  const [preferredMatch, setPreferredMatch] = useState(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ➤ פענוח ה-location משורת הפרמטרים
  let parsedLocation = null;
  if (location) {
    try {
      parsedLocation = JSON.parse(location);
    } catch (err) {
      console.warn('Failed to parse location parameter:', location);
    }
  }

  const goBack = () => router.back();

  const onNext = async () => {
    // 1. ולידציות
    if (!preferredMatch) {
      return Alert.alert('שגיאה', 'אנא בחר/י העדפה להמשך');
    }
    if (!password || password.length < 6) {
      return Alert.alert('שגיאה', 'נא להזין סיסמה בת 6 תווים לפחות');
    }
    if (!email || !fullName || !birth_date || !gender) {
      return Alert.alert('שגיאה', 'פרטי משתמש חסרים');
    }

    try {
      setLoading(true);
      console.log('Parsed location:', parsedLocation);

      // 2. ראשית – הרשמה ב-Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            role: 'user',
          },
        },
      });
      if (signUpError) throw signUpError;
      if (!signUpData?.user) throw new Error('User object missing after signUp');

      // 3. חשיפת userId ואז upsert לשולחן המשתמשים
      const userId = signUpData.user.id;
      const payload = {
        id: userId,
        email,
        name: fullName,
        birth_date,
        gender,
        connectionTypes: preferredMatch,
        wantsNotifications: wantsNotifications === 'true',
        image,
        // ➤ כאן שולחים אובייקט JSON, לא boolean
        location: parsedLocation,
      };

      const { error: upsertError } = await supabase
        .from('users')
        .upsert([payload], { returning: 'minimal' });
      if (upsertError) throw upsertError;

      // 4. הצלחה
      Alert.alert('הצלחה', 'נרשמת בהצלחה!');
      router.push('/home');
    } catch (error) {
      console.error('SignUp Error:', error);
      Alert.alert('שגיאה', error.message || 'הרישום נכשל, אנא נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={goBack}>
        <Text style={styles.backText}>חזור</Text>
      </Pressable>

      <Text style={styles.title}>עם מי היית רוצה להתאים?</Text>
      <Text style={styles.subtitle}>
        אנא בחר/י את האנשים שאתה רוצה להתאים אליהם
      </Text>

      <View style={styles.buttonsContainer}>
        <Pressable
          style={[
            styles.button,
            preferredMatch === 'female' && styles.selectedButton,
            styles.genderButton,
          ]}
          onPress={() => setPreferredMatch('female')}
        >
          <Icon
            name="female"
            size={26}
            strokeWidth={1.6}
            color={theme.colors.textLight}
          />
          <Text
            style={[
              styles.buttonText,
              preferredMatch === 'female' && styles.selectedText,
            ]}
          >
            נשים
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.button,
            preferredMatch === 'male' && styles.selectedButton,
            styles.genderButton,
          ]}
          onPress={() => setPreferredMatch('male')}
        >
          <Icon
            name="male"
            size={26}
            strokeWidth={1.6}
            color={theme.colors.textLight}
          />
          <Text
            style={[
              styles.buttonText,
              preferredMatch === 'male' && styles.selectedText,
            ]}
          >
            גברים
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        placeholder="הזן סיסמה"
        placeholderTextColor="#ccc"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable
        style={styles.nextButton}
        onPress={onNext}
        disabled={loading}
      >
        <Text style={styles.nextButtonText}>
          {loading ? 'טוען...' : 'המשך'}
        </Text>
      </Pressable>
    </View>
  );
};

export default MatchSignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(6),
  },
  backButton: {
    position: 'absolute',
    top: hp(8),
    right: hp(4),
    backgroundColor: theme.colors.card,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
  title: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: hp(3),
  },
  subtitle: {
    fontSize: hp(2.2),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: hp(3),
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(5),
    marginBottom: hp(3),
  },
  genderButton: {
    marginHorizontal: wp(2),
  },
  button: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedButton: {
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.primary,
    marginTop: hp(1),
  },
  selectedText: {
    color: theme.colors.white,
  },
  input: {
    width: '100%',
    height: hp(6),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(4),
    fontSize: hp(2),
    marginTop: hp(1),
    backgroundColor: 'white',
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(2),
    paddingHorizontal: wp(10),
    borderRadius: theme.radius.lg,
    marginTop: hp(3),
  },
  nextButtonText: {
    color: theme.colors.white,
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
  },
});
