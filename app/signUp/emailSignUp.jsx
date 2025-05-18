import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import Icon from '../../assets/icons';
import { StatusBar } from 'expo-status-bar';
import CustomBackButton from '../../components/CustomBackButton';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import Input from '../../components/input';
import Button from '../../components/Button';
import { supabase } from '../../lib/supabase';

const EmailSignUp = () => {
  const router = useRouter();
  const emailRef = useRef('');
  const [loading, setLoading] = useState(false);
  const { fullName } = useLocalSearchParams();

  const goToPreviousStep = () => {
    router.back();
  };

  const goToNextStep = () => {
    const email = emailRef.current.trim();

    if (!email) {
      return Alert.alert('שגיאה', 'אנא הכנס אימייל');
    }

    router.push({
      pathname: '/signUp/passSignUp',
      params: { email, fullName },
    });
  };

  return (
    <View style={styles.safe}>
      <Pressable style={styles.backToWelcomeButton} onPress={goToPreviousStep}>
        <Text style={styles.backToWelcomeText}>חזור</Text>
      </Pressable>

      <View style={styles.container}>
        <Text style={styles.title}>ברוך הבא {fullName}! מה האימייל שלך?</Text>
        <Text style={styles.punchline}>כך שתמיד תוכל לגשת לחשבון שלך</Text>

        <Input
          placeholder="אימייל"
          keyboardType="email-address"
          onChangeText={(text) => (emailRef.current = text)}
          containerStyle={{
            borderColor: 'white',
            borderWidth: 1,
          }}
          inputStyle={{
            color: 'white',
            textAlign: 'right',
          }}
          placeholderTextColor="white"
        />
      </View>

      <Button
        title="הבא"
        buttonStyle={styles.bottomButton}
        textStyle={styles.btnText}
        onPress={goToNextStep}
        loading={loading}
      />
    </View>
  );
};

export default EmailSignUp;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(3),
    writingDirection: 'rtl',
  },
  backToWelcomeButton: {
    position: 'absolute',
    top: hp(8),
    right: hp(4),
    width: '14%',
    backgroundColor: theme.colors.card,
    paddingVertical: hp(1.0),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  backToWelcomeText: {
    color: theme.colors.primary,
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
  title: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: hp(-12),
  },
  punchline: {
    textAlign: 'center',
    paddingHorizontal: wp(6),
    fontSize: hp(1.8),
    color: theme.colors.textPrimary,
  },
  btnText: {
    color: theme.colors.primary,
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
  },
  bottomButton: {
    position: 'absolute',
    bottom: hp(4),
    left: wp(6),
    right: wp(6),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});