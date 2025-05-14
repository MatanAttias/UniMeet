import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';
import Input from '../components/input';
import Button from '../components/Button';

const PassSignUp = () => {
  const router = useRouter();
  const { fullName, email } = useLocalSearchParams();

  const [password, setPassword] = useState(''); // שינוי מ-useRef ל-useState
  const [confirmPassword, setConfirmPassword] = useState(''); // שינוי מ-useRef ל-useState
  const [loading, setLoading] = useState(false);

  const goToPreviousStep = () => {
    router.back();
  };

  const goToNextStep = () => {
    console.log('password:', password);

    // משתמשים בערכים ישירות מה-state במקום מה-ref
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedPassword || !trimmedConfirm) {
      return Alert.alert('שגיאה', 'נא למלא את שני השדות');
    }

    if (trimmedPassword.length < 6) {
      return Alert.alert('שגיאה', 'הסיסמה צריכה להכיל לפחות 6 תווים');
    }

    if (trimmedPassword !== trimmedConfirm) {
      return Alert.alert('שגיאה', 'הסיסמאות לא תואמות');
    }

    // מעבר לדף הבא עם כל הפרמטרים
    router.push({
      pathname: '/birthSignUp',
      params: { 
        fullName, 
        email, 
        password: trimmedPassword // שימוש בערך מה-state
      },
    });
  };

  return (
    <View style={styles.safe}>
      <Pressable style={styles.backToWelcomeButton} onPress={goToPreviousStep}>
        <Text style={styles.backToWelcomeText}>חזור</Text>
      </Pressable>

      <View style={styles.container}>
        <Text style={styles.title}>צור סיסמה חדשה</Text>
        <Text style={styles.punchline}>אנחנו ממליצים על סיסמה חזקה</Text>

        <Input
          placeholder="סיסמה"
          secureTextEntry
          onChangeText={(text) => setPassword(text)} // שימוש ב-setState במקום ref
          containerStyle={styles.inputContainer}
          inputStyle={styles.inputText}
          placeholderTextColor="white"
          value={password} // הוספת ערך מקושר ל-state
        />

        <Input
          placeholder="אימות סיסמה"
          secureTextEntry
          onChangeText={(text) => setConfirmPassword(text)} // שימוש ב-setState במקום ref
          containerStyle={styles.inputContainer}
          inputStyle={styles.inputText}
          placeholderTextColor="white"
          value={confirmPassword} // הוספת ערך מקושר ל-state
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

export default PassSignUp;

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
    marginTop: hp(-10),
  },
  punchline: {
    textAlign: 'center',
    paddingHorizontal: wp(6),
    fontSize: hp(1.8),
    color: theme.colors.textPrimary,
  },
  inputContainer: {
    borderColor: 'white',
    borderWidth: 1,
  },
  inputText: {
    color: 'white',
    textAlign: 'right',
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