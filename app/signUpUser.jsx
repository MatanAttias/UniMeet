import React, { useRef, useState } from 'react'
import { View, Text, Alert, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import Input from '../components/input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { hp } from '../constants/helpers/common'

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

  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1)
    }
  }

  const goToWelcome = () => {
    router.push('/welcome')
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
      {step === 1 && (
        <TouchableOpacity style={styles.backToWelcomeButton} onPress={goToWelcome}>
          <Text style={styles.backToWelcomeText}>חזור</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.stepTitle}>שלב {step} מתוך 3</Text>

      {/* סרגל התקדמות */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(step / 3) * 100}%` }]} />
      </View>

      {/* עיגולי שלבים */}
      <View style={styles.stepIndicators}>
        {[1, 2, 3].map(s => (
          <Text
            key={s}
            style={[
              styles.stepCircle,
              step === s && styles.activeStepCircle
            ]}
          >
            {s}
          </Text>
        ))}
      </View>

      <View style={styles.stepContent}>
        {step === 1 && (
          <>
            <Text style={styles.label}>מה שמך?</Text>
            <Input
              placeholder="שם מלא"
              onChangeText={value => (nameRef.current = value)}
              style={{ backgroundColor: '#3E3A45', color: '#FFFFFF' }}
              placeholderTextColor="#AAAAAA"
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
              style={{ backgroundColor: '#3E3A45', color: '#FFFFFF' }}
              placeholderTextColor="#AAAAAA"
            />
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.label}>בחר סיסמה</Text>
            <Input
              placeholder="הכנס סיסמה"
              onChangeText={value => (passwordRef.current = value)}
              style={{ backgroundColor: '#3E3A45', color: '#FFFFFF' }}
              placeholderTextColor="#AAAAAA"
            />
          </>
        )}
      </View>

      <View style={styles.buttonGroup}>
        <Button
          title={step < 3 ? 'המשך' : 'צור חשבון'}
          loading={loading}
          onPress={goToNextStep}
          style={{ backgroundColor: '#3E3A45', color: '#FFFFFF' }}
          placeholderTextColor="#AAAAAA"
        />
        {step > 1 && (
          <Button
            title="חזור"
            onPress={goToPreviousStep}
            style={{ backgroundColor: '#3E3A45', color: '#FFFFFF' }}
            placeholderTextColor="#AAAAAA"
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: hp(4),
    backgroundColor: '#2A262F',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: hp(3),
    textAlign: 'center',
    marginBottom: hp(3),
    fontWeight: 'bold',
    color: '#FFB3C1',
  },
  progressContainer: {
    height: 10,
    backgroundColor: '#3E3A45',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: hp(2),
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFB3C1',
  },
  stepIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hp(3),
  },
  stepCircle: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    borderWidth: 1,
    borderColor: '#FFB3C1',
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#FFB3C1',
    fontWeight: 'bold',
    backgroundColor: '#3E3A45',
  },
  activeStepCircle: {
    backgroundColor: '#FFB3C1',
    color: '#2A262F',
  },
  label: {
    fontSize: hp(2.5),
    marginBottom: hp(1),
    color: '#F2F2F2',
    textAlign: 'right',
  },
  stepContent: {
    marginBottom: hp(4),
  },
  buttonGroup: {
    marginTop: hp(2),
    gap: hp(1.5),
  },
  backToWelcomeButton: {
    position: 'absolute',
    top: hp(4),
    left: hp(4),
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#6A4C9C', // צבע סגול
    borderRadius: 10,
    zIndex: 1,
  },
  backToWelcomeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
})