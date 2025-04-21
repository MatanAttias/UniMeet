import React from 'react'
import { SafeAreaView, View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { hp, wp } from '../constants/helpers/common'
import { theme } from '../constants/theme'

export default function SelectType() {
  const router = useRouter()
  const handleSelect = (role) => () => {
    router.push({ pathname: '/signUp', params: { role } })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>איך נרצה להכיר אותך?</Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={handleSelect('parent')}
          android_ripple={{ color: theme.colors.primary + '20' }}
          accessibilityLabel="צור חשבון הורה"
        >
          <Text style={styles.btnText}>צור חשבון הורה</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() => router.push('/signUpUser')}
          android_ripple={{ color: theme.colors.primary + '20' }}
          accessibilityLabel="צור חשבון אישי"
        >
        <Text style={styles.btnText}>צור חשבון אישי</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    paddingHorizontal: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(4),
    writingDirection: 'rtl',
  },
  title: {
    fontSize: hp(3),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  button: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    paddingVertical: hp(2),
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    opacity: 0.8,
  },
  btnText: {
    fontSize: hp(2.2),
    color: theme.colors.primary,
    fontWeight: '600',
  },
})
