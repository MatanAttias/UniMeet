import React from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Button from '../components/Button';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';

const GetNotify = () => {
  const router = useRouter();
  const { fullName, email, birth_date } = useLocalSearchParams();

  const goToPreviousStep = () => {
    router.back();
  };

  const goToNextStep = (wantsNotifications) => {
    router.push({
      pathname: '/connectionType',
      params: {
        fullName,
        email,
        birth_date,
        wantsNotifications,
      },
    });
  };

  const handlePermissionRequest = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('שים לב', 'לא תוכל לקבל עידכונים בזמן אמת');
      goToNextStep(false); // המשתמש לא אישר
    } else {
      goToNextStep(true); // המשתמש אישר
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backToWelcomeButton} onPress={goToPreviousStep}>
        <Text style={styles.backToWelcomeText}>חזור</Text>
      </Pressable>

      <Text style={styles.title}>רוצה לקבל עידכונים לטלפון?</Text>
      <Text style={styles.description}>
        הפעל התראות ולעולם לא תפספס אף התראה - אנו נעדכן אותך ברגע שיעשו לך לייק או ישלחו הודעה!
      </Text>

      <Button
        title="כן, שלחו לי עידכונים"
        onPress={handlePermissionRequest}
        buttonStyle={styles.button}
        textStyle={styles.buttonText}
      />

      <Button
        title="לא עכשיו"
        onPress={() => goToNextStep(false)}
        buttonStyle={[styles.button, styles.secondaryButton]}
        textStyle={[styles.buttonText, { color: theme.colors.textPrimary }]}
      />
    </View>
  );
};

export default GetNotify;

// styles (נשארו אותו דבר)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: hp(3.5),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: hp(2),
  },
  description: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.textPrimary,
    marginBottom: hp(4),
  },
  button: {
    width: '100%',
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.md,
    marginBottom: hp(2),
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: '#FF69B4',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
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
});