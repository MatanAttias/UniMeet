import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';
import Icon from '../assets/icons'; // לוודא שהייבוא תואם לקובץ הראשון

const GenderSignUp = () => {
  const router = useRouter();
  const [selectedGender, setSelectedGender] = useState(null);

  const onNext = () => {
    if (!selectedGender) {
      Alert.alert('שגיאה', 'אנא בחר/י מין להמשך');
      return;
    }

    // שולחים את המידע לדף הבא
    router.push({
      pathname: '/nextStep', // שנה לדף הבא שלך
      params: { gender: selectedGender },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>בחר/י את המין שלך</Text>
      <Text style={styles.subtitle}>אנא בחר/י אחת מהאופציות הבאות</Text>

      <View style={styles.buttonsContainer}>
        <Pressable
          style={[styles.button, selectedGender === 'male' && styles.selectedButton]}
          onPress={() => setSelectedGender('male')}
        >
           icon={<Icon name="male" size={26} strokeWidth={1.6} color={theme.colors.textLight} />}

          <Text style={[styles.buttonText, selectedGender === 'male' && styles.selectedText]}>זכר</Text>
        </Pressable>

        <Pressable
          style={[styles.button, selectedGender === 'female' && styles.selectedButton]}
          onPress={() => setSelectedGender('female')}
        >
         icon={<Icon name="female" size={26} strokeWidth={1.6} color={theme.colors.textLight} />}

          <Text style={[styles.buttonText, selectedGender === 'female' && styles.selectedText]}>נקבה</Text>
        </Pressable>

        <Pressable
          style={[styles.button, selectedGender === 'other' && styles.selectedButton]}
          onPress={() => setSelectedGender('other')}
        >
           icon={<Icon name="gendarnatural" size={26} strokeWidth={1.6} color={theme.colors.textLight} />}

          <Text style={[styles.buttonText, selectedGender === 'other' && styles.selectedText]}>לא-מוגדר</Text>
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
    marginBottom: hp(2),
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
});