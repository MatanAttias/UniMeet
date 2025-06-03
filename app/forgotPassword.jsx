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

const ForgotPassword = () => {
  const router = useRouter();
  const emailRef = useRef('');
  const [loading, setLoading] = useState(false);

  const onResetPassword = async () => {
    if (!emailRef.current) {
      Alert.alert('איפוס סיסמא', 'אנא הזן את כתובת האימייל שלך.');
      return;
    }

    const email = emailRef.current.trim();

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'yourapp://reset-password', // החלף לכתובת הרלוונטית לאפליקציה שלך אם יש
    });
    setLoading(false);

    if (error) {
      Alert.alert('שגיאה', error.message);
    } else {
      Alert.alert(
        'איפוס סיסמא',
        'נשלחה לך הודעה למייל עם הוראות לאיפוס הסיסמא.'
      );
      router.back();
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.dark}>
      <StatusBar style="light" />
      <CustomBackButton to="/login" style={styles.backButton} />

      <View style={[styles.container, { writingDirection: 'rtl' }]}>
        <Text style={styles.title}>שחזור סיסמא</Text>
        <Text style={styles.subtext}>
          הכנס את כתובת האימייל שלך ונשלח לך קישור לאיפוס סיסמא.
        </Text>

        <Input
          icon={<Icon name="mail" size={26} strokeWidth={1.6} color={theme.colors.textLight} />}
          iconPosition="right"
          placeholder="הכנס את כתובת האימייל שלך"
          onChangeText={(value) => (emailRef.current = value)}
          style={{ textAlign: 'right' }}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          title="שלח הוראות איפוס"
          loading={loading}
          onPress={onResetPassword}
        />
      </View>
    </ScreenWrapper>
  );
};

export default ForgotPassword;

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
  },
  title: {
    fontSize: hp(4),
    color: theme.colors.textPrimary,
    fontWeight: theme.fonts.bold,
    textAlign: 'right',
    marginBottom: hp(1),
  },
  subtext: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginBottom: hp(4),
  },
});