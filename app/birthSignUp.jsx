import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../components/Button';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';

const BirthSignUp = () => {
  const router = useRouter();
  const { fullName, email } = useLocalSearchParams();
  const [date, setDate] = useState(new Date());

  const goToPreviousStep = () => {
    router.back();
  };

  const onNext = () => {
    Alert.alert('נשמר תאריך לידה', date.toDateString());
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backToWelcomeButton} onPress={goToPreviousStep}>
        <Text style={styles.backToWelcomeText}>חזור</Text>
      </Pressable>

      <Text style={styles.title}>מתי יום ההולדת שלך? </Text>
      <Text style={styles.punchline}>יום שהוא רק בשבילך!</Text>

      <View style={styles.datePickerWrapper}>
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          onChange={(event, selectedDate) => {
            if (selectedDate) setDate(selectedDate);
          }}
          style={styles.datePicker}
          {...(Platform.OS === 'ios' ? { textColor: 'white' } : {})} // textColor עובד רק ב-iOS
        />
      </View>

      <Button
        title="הבא"
        buttonStyle={styles.bottomButton}
        textStyle={styles.btnText}
        onPress={onNext}
      />
    </View>
  );
};

export default BirthSignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(6),
    paddingTop: hp(25),
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: hp(2),
  },
  punchline: {
    textAlign: 'center',
    paddingHorizontal: wp(6),
    fontSize: hp(1.8),
    color: theme.colors.textPrimary,
    marginBottom: hp(4),
  },
  datePickerWrapper: {
    width: '100%',
    backgroundColor: 'transparent',
    marginBottom: hp(10),
  },
  datePicker: {
    width: '100%',
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
  btnText: {
    color: '#FF69B4',
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
  },
});