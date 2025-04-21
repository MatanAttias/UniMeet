// app/signUp.jsx

import { StyleSheet, Text, View, Pressable, Alert } from 'react-native'
import React, { useRef, useState } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Icon from '../assets/icons'
import { StatusBar } from 'expo-status-bar'
import BackButton from '../components/BackButton'
import { useRouter } from 'expo-router'
import { hp, wp } from '../constants/helpers/common'
import { theme } from '../constants/theme'
import Input from '../components/input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'

const SignUp = () => {
  const router = useRouter()

  const nameRef = useRef('')
  const emailRef = useRef('')
  const passwordRef = useRef('')
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState('user') // יכול להיות 'user' או 'parent'

  const onSubmit = async () => {
    if (!emailRef.current || !passwordRef.current) {
      Alert.alert('Sign Up', 'Please fill all the fields!')
      return
    }

    const name = nameRef.current.trim()
    const email = emailRef.current.trim()
    const password = passwordRef.current.trim()

    setLoading(true)
    try {
      // שונה: שיניתי את השדה metadata מ־type ל־role
      // ושיניתי את הפירוק כדי לקבל את אובייקט data המלא במקום רק session
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: userType  // שונה: השתמשתי ב־role במקום type
          }
        }
      })

      setLoading(false)
      if (error) {
        Alert.alert('Sign up', error.message)
      } else {
        // שונה: הוספת לוג לקונסולה כדי לוודא מה התקבל ב‑user_metadata
        console.log('New user metadata:', data.user.user_metadata)

        // שונה: הצגת הודעה עם סוג המשתמש שנשמר
        Alert.alert(
          'Sign up',
          `Account created successfully as ${data.user.user_metadata.role}`
        )
        router.push('login') // מעבר לעמוד ההתחברות
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      Alert.alert(
        'Sign up',
        'An unexpected error occurred. Please try again.'
      )
      setLoading(false)
    }
  }

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton router={router} />

        {/* כותרת */}
        <View>
          <Text style={styles.welcomeText}>Let's</Text>
          <Text style={styles.welcomeText}>Get Started</Text>
        </View>

        {/* טופס הרשמה */}
        <View style={styles.form}>
          <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
            Please fill the details to create an account
          </Text>

          <Input
            icon={<Icon name="user" size={26} strokeWidth={1.6} />}
            placeholder="Enter your name"
            onChangeText={value => (nameRef.current = value)}
          />

          <Input
            icon={<Icon name="mail" size={26} strokeWidth={0.5} />}
            placeholder="Enter your email"
            onChangeText={value => (emailRef.current = value)}
          />

          <Input
            icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
            placeholder="Enter your password"
            secureTextEntry
            onChangeText={value => (passwordRef.current = value)}
          />

          {/* בחירת סוג משתמש */}
          <View style={{ flexDirection: 'row', gap: 15 }}>
            <Pressable onPress={() => setUserType('user')}>
              <Text
                style={{
                  padding: 10,
                  backgroundColor:
                    userType === 'user' ? theme.colors.primary : '#ccc',
                  color: 'white',
                  borderRadius: 5
                }}
              >
                משתמש רגיל
              </Text>
            </Pressable>
            <Pressable onPress={() => setUserType('parent')}>
              <Text
                style={{
                  padding: 10,
                  backgroundColor:
                    userType === 'parent' ? theme.colors.primary : '#ccc',
                  color: 'white',
                  borderRadius: 5
                }}
              >
                הורה
              </Text>
            </Pressable>
          </View>

          {/* כפתור הרשמה */}
          <Button title="Sign up" loading={loading} onPress={onSubmit} />
        </View>

        {/* ניווט לעמוד התחברות */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account!</Text>
          <Pressable onPress={() => router.push('login')}>
            <Text
              style={[
                styles.footerText,
                {
                  color: theme.colors.primaryDark,
                  fontWeight: theme.fonts.semibold
                }
              ]}
            >
              Login
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default SignUp

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 45,
    paddingHorizontal: wp(5)
  },
  welcomeText: {
    fontSize: hp(4)
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
    fontSize: hp(1.6)
  }
})
