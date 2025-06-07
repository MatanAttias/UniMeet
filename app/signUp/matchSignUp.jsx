import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';

const MatchSignUp = () => {
  const router = useRouter();

  const {
    fullName,
    email,
    password,
    birth_date,
    gender,
    connectionTypes,
    image,
    wantsNotifications = 'false',
    location,
  } = useLocalSearchParams();
  const wantsNotificationsBool = wantsNotifications === 'true';

  const [preferredMatch, setPreferredMatch] = useState(null);

  const goBack = () => router.back();

  const onNext = () => {


    if (!preferredMatch) {
      Alert.alert('שגיאה', 'אנא בחר/י העדפה להמשך');
      return;
    }

    router.push({

      pathname: '/signUp/buildProfile',
      params: {
        fullName,
        email,
        password,
        birth_date,
        gender,
        connectionTypes,
        image,
        wantsNotificationsBool,
        location,
        preferredMatch, // העברה נכונה
      },
    });
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={goBack}>
        <Text style={styles.backText}>חזור</Text>
      </Pressable>

      <Text style={styles.title}>עם מי היית רוצה להתאים?</Text>
      <Text style={styles.subtitle}>אנא בחר/י את האנשים שאתה רוצה להתאים אליהם</Text>

      <View style={styles.buttonsContainer}>
      <Pressable
      style={[
        styles.button,
        preferredMatch === 'נשים' && styles.selectedButton,
        styles.genderButton,
      ]}
      onPress={() => setPreferredMatch('נשים')}
    >
      <Icon name="female" size={26} strokeWidth={1.6} color={theme.colors.textLight} />
      <Text style={[styles.buttonText, preferredMatch === 'נשים' && styles.selectedText]}>נשים</Text>
    </Pressable>

    <Pressable
      style={[
        styles.button,
        preferredMatch === 'גברים' && styles.selectedButton,
        styles.genderButton,
      ]}
      onPress={() => setPreferredMatch('גברים')}
    >
      <Icon name="male" size={26} strokeWidth={1.6} color={theme.colors.textLight} />
      <Text style={[styles.buttonText, preferredMatch === 'גברים' && styles.selectedText]}>גברים</Text>
    </Pressable>
      </View>

      <Pressable style={styles.nextButton} onPress={onNext}>
        <Text style={styles.nextButtonText}>המשך</Text>
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
    color: theme.colors.textSecondary,
    marginTop: hp(1),
  },
  selectedText: {
    color: theme.colors.white,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(2),
    paddingHorizontal: wp(10),
    borderRadius: theme.radius.lg,
    marginTop: hp(3),
  },
  nextButtonText: {
    color: theme.colors.textSecondary,
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
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
});