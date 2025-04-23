import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScreenWrapper from '../components/ScreenWrapper';
import Icon from '../assets/icons';
import { StatusBar } from 'expo-status-bar';
import CustomBackButton from '../components/CustomBackButton';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';
import Input from '../components/input';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

export default function SignUp() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = params.role || 'user';

  const nameRef = useRef('');
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!emailRef.current.trim() || !passwordRef.current.trim()) {
      return Alert.alert('הרשמה', 'אנא מלא את כל השדות!');
    }

    const name = nameRef.current.trim();
    const email = emailRef.current.trim();
    const password = passwordRef.current.trim();

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('הרשמה', error.message);
    } else {
      Alert.alert('הרשמה', `החשבון נוצר בהצלחה כ-${data.user.user_metadata.role}`);
      router.push('login');
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.dark}>
      <StatusBar style="light" />

      {/* כפתור חזור */}
      <CustomBackButton to="/selectType" style={styles.backButton} />

      <View style={styles.container}>
        {/* כותרת */}
        <View>
          <Text style={styles.welcomeText}>בוא נתחיל</Text>
          <Text style={styles.welcomeText}>הירשם עכשיו</Text>
        </View>

        {/* טופס הרשמה */}
        <View style={styles.form}>
          <Text style={styles.loginText}>אנא מלא את הפרטים כדי ליצור חשבון</Text>

          <Input
            icon={<Icon name="user" size={26} strokeWidth={1.6} />}
            iconPosition="right"
            placeholder="הכנס את שמך"
            onChangeText={(value) => (nameRef.current = value)}
            style={styles.input}
          />

          <Input
            icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
            iconPosition="right"
            placeholder="הכנס את כתובת האימייל שלך"
            onChangeText={(value) => (emailRef.current = value)}
            style={styles.input}
          />

          <Input
            icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
            iconPosition="right"
            placeholder="הכנס את הסיסמה שלך"
            secureTextEntry
            onChangeText={(value) => (passwordRef.current = value)}
            style={styles.input}
          />

          <Button title="הרשם" loading={loading} onPress={onSubmit} />
        </View>

        {/* ניווט לעמוד התחברות */}
        <View style={styles.footer}>
          <Text style={styles.loginText}>כבר יש לך חשבון?</Text>
          <Pressable onPress={() => router.push('login')}>
            <Text style={styles.signupText}>התחבר</Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: hp(7.5),
    right: wp(4),
    paddingVertical: hp(0.7),
    paddingHorizontal: hp(1.5),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    zIndex: 10,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  container: {
    flex: 1,
    gap: 30,
    paddingHorizontal: wp(5),
    paddingTop: hp(14),
    paddingBottom: hp(2),
    writingDirection: 'rtl',
  },
  welcomeText: {
    fontSize: hp(4.2),
    color: theme.colors.textPrimary,
    textAlign: 'right',
    fontWeight: theme.fonts.bold,
    lineHeight: hp(5.2),
  },
  subtext: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    textAlign: 'right',
    lineHeight: hp(2.4),
  },
  form: {
    gap: 20,
    marginTop: hp(2),
  },
  input: {
    textAlign: 'right',
    writingDirection: 'rtl',
    borderRadius: 12,
  },
  footer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(3),
    gap: 6,
  },
  footerText: {
    color: theme.colors.textLight,
    fontSize: hp(1.6),
  },
  signupText: {
    color: theme.colors.primaryDark,
    fontWeight: theme.fonts.semibold,
    fontSize: hp(1.6),
  },
  loginText: {
    color: theme.colors.textPrimary,
    fontSize: hp(1.6),
    textAlign: 'right',
    lineHeight: hp(2.2),
  },
  loginLink: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.bold,
    fontSize: hp(1.6),
  },
});
