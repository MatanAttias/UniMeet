import React, { useRef } from 'react'
import { View, Text, Alert, StyleSheet, Pressable } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router';
import Input from '../../components/input'
import Button from '../../components/Button'
import { hp, wp } from '../../constants/helpers/common'
import { theme } from '../../constants/theme'

export default function SignUpUser() {
  const router = useRouter()

  const nameRef = useRef('')
  const lastNameRef = useRef('')
   const { role } = useLocalSearchParams()

  const handleNext = () => {
    const name = nameRef.current.trim();
    const lastName = lastNameRef.current.trim();
  
    if (!name) {
      return Alert.alert('שגיאה', 'אנא הכנס שם פרטי');
    }
  
    if (!lastName) {
      return Alert.alert('שגיאה', 'אנא הכנס שם משפחה');
    }
  
    const fullName = `${name} ${lastName}`;
  
    router.push({
      pathname: '/signUp/emailSignUp',
      params: { role, fullName },
    });
  };

  return (
    <View style={styles.safe}>
      <Pressable style={styles.backToWelcomeButton} onPress={() => router.push('/selectType')}>
        <Text style={styles.backToWelcomeText}>חזור</Text>
      </Pressable>

      <View style={styles.container}>
        <Text style={styles.title}>מה השם שלך?</Text>
        <Text style={styles.punchline}>אנחנו מתרגשים לראות אותך!</Text>

        <Input
          placeholder="שם פרטי..."
          onChangeText={(text) => (nameRef.current = text)}
          containerStyle={styles.inputContainer}
          inputStyle={styles.inputText}
          placeholderTextColor="gray"
        />
        <Input
          placeholder="שם משפחה..."
          onChangeText={(text) => (lastNameRef.current = text)}
          containerStyle={styles.inputContainer}
          inputStyle={styles.inputText}
          placeholderTextColor="gray"
        />

        <Button
          title="הבא"
          buttonStyle={styles.bottomButton}
          textStyle={styles.btnText}
          onPress={handleNext}
        />
      </View>
    </View>
  )
}

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
  title: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: hp(-10),
  },
  punchline: {
    fontSize: hp(2.2),
    color: 'white',
    marginBottom: hp(1),
  },
  inputContainer: {
    borderColor: 'white',
    borderWidth: 1,
    width: '100%',
  },
  inputText: {
    color: 'white',
    textAlign: 'right',
  },
  button: {
    width: '80%',
    backgroundColor: theme.colors.card,
    paddingVertical: hp(2),
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
    color: theme.colors.primary,
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
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
    fontWeight: 'bold',
    fontSize: hp(2),
  },
  bottomButton: {
    position: 'absolute',
    bottom: hp(4), // גובה מהרצפה
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
})