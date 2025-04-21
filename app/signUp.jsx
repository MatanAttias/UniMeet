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
      return Alert.alert('Sign Up', 'Please fill all the fields!')
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
      Alert.alert('Sign up', error.message)
    } else {
      console.log('New user metadata:', data.user.user_metadata)
      Alert.alert(
        'Sign up',
        `Account created successfully as ${data.user.user_metadata.role}`
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

          <Button title="Sign up" loading={loading} onPress={onSubmit} />
        </View>

        {/* ניווט לעמוד התחברות */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account!</Text>
          <Pressable onPress={() => router.push('login')}>
            <Text
              style={[
                styles.footerText,
                { color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold }
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
