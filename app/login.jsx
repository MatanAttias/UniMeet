import { StyleSheet, Text, View, Alert } from 'react-native';
import React, { useRef, useState } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import Icon from '../assets/icons';
import { StatusBar } from 'expo-status-bar';
import CustomBackButton from '../components/CustomBackButton';
import { useRouter } from 'expo-router';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';
import Input from '../components/input';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import { TouchableOpacity } from 'react-native';

const Login = () => {
  const router = useRouter();
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert('התחברות', 'אנא מלא את כל השדות!');
      return;
    }
    const email = emailRef.current.trim();
    const password = passwordRef.current.trim();

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('התחברות', error.message);
    } else {
      router.replace('/home');
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.dark}>
      <StatusBar style="light" />

      <CustomBackButton to="/welcome" style={styles.backButton} />

      <View style={[styles.container, { writingDirection: 'rtl' }]}>
        <View>
          <Text style={styles.welcomeText}>היי,</Text>
          <Text style={styles.welcomeText}>ברוך שובך!</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.subtext}>אנא היכנס כדי להמשיך</Text>
          <Input
            icon={<Icon name="mail" size={26} strokeWidth={1.6} color={theme.colors.textLight} />}
            iconPosition="right"
            placeholder="הכנס את כתובת האימייל שלך"
            onChangeText={(value) => (emailRef.current = value)}
            style={{ 
              textAlign: 'right', 
              color: 'white' 
            }}
          />
          <Input
            icon={<Icon name="lock" size={26} strokeWidth={1.6} color={theme.colors.textLight} />}
            iconPosition="right"
            placeholder="הכנס את הסיסמה שלך"
            secureTextEntry
            onChangeText={(value) => (passwordRef.current = value)}
            style={{ 
              textAlign: 'right', 
              color: 'white' 
            }}          />
          <TouchableOpacity onPress={() => router.push('/forgotPassword')}>
            <Text style={styles.forgotPassword}>שכחת סיסמה?</Text>
          </TouchableOpacity>
          <Button title={'התחבר'} loading={loading} onPress={onSubmit} />
        </View>

        {/* כותרת תחתונה */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>אין לך חשבון?</Text>
          <Text
            onPress={() => router.push('selectType')}
            style={styles.signupText}
          >
            הירשם
          </Text>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Login;

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
    paddingHorizontal: wp(5),
    paddingTop: hp(14),
    paddingBottom: hp(4),
    gap: hp(4),
    justifyContent: 'flex-start',
    color: theme.colors.primary,

  },
  welcomeText: {
    fontSize: hp(4),
    color: theme.colors.textPrimary,
    textAlign: 'right',
    fontWeight: theme.fonts.bold,
    
  },
  subtext: {
    fontSize: hp(1.6),
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  form: {
    gap: 25,

  },
  forgotPassword: {
    textAlign: 'right',
    color: theme.colors.textSecondary,
    fontSize: hp(1.6),
  },
  footer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: hp(1.6),
  },
  signupText: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.semibold,
    fontSize: hp(1.6),
  },
});




