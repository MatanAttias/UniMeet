import React, { useRef, useState } from 'react'
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import Icon from '../assets/icons'
import { StatusBar } from 'expo-status-bar'
import BackButton from '../components/BackButton'
import { hp, wp } from '../constants/helpers/common'
import { theme } from '../constants/theme'
import Input from '../components/input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'


export default function SignUp() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const role = params.role || 'user'  

  const nameRef = useRef('')
  const emailRef = useRef('')
  const passwordRef = useRef('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    if (!emailRef.current.trim() || !passwordRef.current.trim()) {
      return Alert.alert('הרשמה', 'אנא מלא את כל השדות!')
    }

    const name = nameRef.current.trim()
    const email = emailRef.current.trim()
    const password = passwordRef.current.trim()

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role }
      }
    })
    setLoading(false)

    if (error) {
      Alert.alert('הרשמה', error.message)
    } else {
      console.log('מטה-נתונים של משתמש חדש:', data.user.user_metadata)
      Alert.alert(
        'הרשמה',
        `החשבון נוצר בהצלחה כ-${data.user.user_metadata.role}`
      )
      router.push('login')
    }
  }

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton router={router} />

        {/* כותרת */}
        <View>
          <Text style={styles.welcomeText}>בוא נתחיל</Text>
          <Text style={styles.welcomeText}>הירשם עכשיו</Text>
        </View>

        {/* טופס הרשמה */}
        <View style={styles.form}>
        <Text style={{ 
            fontSize: hp(1.5), 
            color: theme.colors.text, 
            textAlign: 'right',  // כיוון הטקסט מימין לשמאל
            writingDirection: 'rtl'  // כיוון התוכן מימין לשמאל
          }}>
            אנא מלא את הפרטים כדי ליצור חשבון
          </Text>

          <Input
            icon={<Icon name="user" size={26} strokeWidth={1.6} />}
            placeholder="הכנס את שמך"
            onChangeText={value => (nameRef.current = value)}
            style={styles.input}  // הוספתי סטייל כאן
          />

          <Input
            icon={<Icon name="mail" size={26} strokeWidth={0.5} />}
            placeholder="הכנס את כתובת האימייל שלך"
            onChangeText={value => (emailRef.current = value)}
            style={styles.input}  // הוספתי סטייל כאן
          />

          <Input
            icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
            placeholder="הכנס את הסיסמה שלך"
            secureTextEntry
            onChangeText={value => (passwordRef.current = value)}
            style={styles.input}  // הוספתי סטייל כאן
          />

          <Button title="הרשם" loading={loading} onPress={onSubmit} />
        </View>

        {/* ניווט לעמוד התחברות */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>כבר יש לך חשבון?</Text>
          <Pressable onPress={() => router.push('login')}>
            <Text
              style={[
                styles.footerText,
                { color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold }
              ]}
            >
              התחבר
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 45,
    paddingHorizontal: wp(5),
    textAlign: 'right', // כיוון הטקסט מימין לשמאל
    writingDirection: 'rtl', // כיוון התוכן מימין לשמאל
  },
  welcomeText: {
    fontSize: hp(4),
    textAlign: 'right', // כיוון הטקסט מימין לשמאל
    writingDirection: 'rtl', // כיוון התוכן מימין לשמאל
  },
  form: {
    gap: 25
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: hp(1.6),
    writingDirection: 'rtl', // כיוון התוכן מימין לשמאל
  },
  input: {
    textAlign: 'right', // כיוון הטקסט מימין לשמאל
    writingDirection: 'rtl', // כיוון התוכן מימין לשמאל
  }
})