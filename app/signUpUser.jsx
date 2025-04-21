import React, { useRef, useState } from 'react'
import { View, Text, Alert, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import Input from '../components/input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { hp } from '../constants/helpers/common'
import { theme } from '../constants/theme'

export default function SignUpUser() {
  const router = useRouter()

  const nameRef = useRef('')
  const emailRef = useRef('')
  const passwordRef = useRef('')

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const goToNextStep = () => {
    if (step === 1 && !nameRef.current.trim()) {
      return Alert.alert('שגיאה', 'אנא הכנס שם מלא')
    }
    if (step === 2 && !emailRef.current.trim()) {
      return Alert.alert('שגיאה', 'אנא הכנס אימייל')
    }
    if (step === 3 && !passwordRef.current.trim()) {
      return Alert.alert('שגיאה', 'אנא הכנס סיסמה')
    }

    if (step < 3) {
      setStep(prev => prev + 1)
    } else {
      onSubmit()
    }
  }

  const onSubmit = async () => {
    const name = nameRef.current.trim()
    const email = emailRef.current.trim()
    const password = passwordRef.current.trim()

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: 'user' }
      }
    })
    setLoading(false)

    if (error) {
      Alert.alert('שגיאה', error.message)
    } else {
      Alert.alert('הצלחה', 'ההרשמה בוצעה בהצלחה')
      router.push('/login')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.stepTitle}>שלב {step} מתוך 3</Text>

      {step === 1 && (
        <>
          <Text style={styles.label}>מה שמך?</Text>
          <Input
            placeholder="שם מלא"
            onChangeText={value => (nameRef.current = value)}
          />
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.label}>כתובת אימייל</Text>
          <Input
            placeholder="הכנס אימייל"
            keyboardType="email-address"
            onChangeText={value => (emailRef.current = value)}
          />
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.label}>בחר סיסמה</Text>
          <Input
            placeholder="הכנס סיסמה"
            secureTextEntry
            onChangeText={value => (passwordRef.current = value)}
          />
        </>
      )}

      <Button
        title={step < 3 ? 'המשך' : 'צור חשבון'}
        loading={loading}
        onPress={goToNextStep}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: hp(4),
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: hp(4),
    textAlign: 'center',
    marginBottom: hp(4),
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  label: {
    fontSize: hp(2.5),
    marginBottom: hp(1),
    color: theme.colors.text,
    textAlign: 'right',
  },
})