import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';
import Icon from '../assets/icons';
import { useLocalSearchParams } from 'expo-router';

const GenderSignUp = () => {
  const router = useRouter();
  const [selectedGender, setSelectedGender] = useState(null);
  const {
      fullName,
      email,
      birth_date,
      connectionTypes,
      image,
      wantsNotifications = 'false', // טיפול במידה ולא הגיע מהעמוד הקודם
    } = useLocalSearchParams();
    const onNext = () => {
    if (!selectedGender) {
      Alert.alert('שגיאה', 'אנא בחר/י מין להמשך');
      return;
    }

    router.push({
      pathname: '/matchSignUp',
      params: {
        fullName,
        email,
        birth_date,
        wantsNotifications: wantsNotifications === 'true',
        connectionTypes,
        image,
        location: true,
        gender: selectedGender,
      },
    });
  };
  const goBack = () => router.back();

  return (
    <View style={styles.container}>
       <Pressable style={styles.backButton} onPress={goBack}>
              <Text style={styles.backText}>חזור</Text>
        </Pressable>
      <Text style={styles.title}>בחר/י את המין שלך</Text>
      <Text style={styles.subtitle}>אנא בחר/י אחת מהאופציות הבאות</Text>

      <View style={styles.buttonsContainer}>
      <Pressable
        style={[
          styles.button,
          selectedGender === 'female' && styles.selectedButton,
          styles.genderButton,
        ]}
        onPress={() => setSelectedGender('female')}
      >
        <Icon name="female" size={26} strokeWidth={1.6} color={theme.colors.textLight} />
        <Text style={[styles.buttonText, selectedGender === 'female' && styles.selectedText]}>נקבה</Text>
      </Pressable>

      {/* זכר – ימין */}
      <Pressable
        style={[
          styles.button,
          selectedGender === 'male' && styles.selectedButton,
          styles.genderButton,
        ]}
        onPress={() => setSelectedGender('male')}
      >
        <Icon name="male" size={26} strokeWidth={1.6} color={theme.colors.textLight} />
        <Text style={[styles.buttonText, selectedGender === 'male' && styles.selectedText]}>זכר</Text>
    </Pressable>
      </View>

      <Pressable style={styles.nextButton} onPress={onNext}>
        <Text style={styles.nextButtonText}>המשך</Text>
      </Pressable>
    </View>
  );
};

export default GenderSignUp;

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
    marginBottom: hp(5),
  },
  subtitle: {
    fontSize: hp(2.2),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: hp(4),
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: hp(4),
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp(5), 
    marginBottom: hp(4),
  },
  
  genderButton: {
    marginHorizontal: wp(2),
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