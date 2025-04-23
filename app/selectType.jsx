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

  const handleSelectUser = () => {
    router.push('/signUpUser')
  }

  const handleBack = () => {
    router.push('/welcome')
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* כפתור חזור מעוצב */}
      <Pressable style={styles.backToWelcomeButton} onPress={handleBack}>
        <Text style={styles.backToWelcomeText}>חזור</Text>
      </Pressable>

      <View style={styles.container}>
        <Text style={styles.title}>איך נרצה להכיר אותך?</Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={handleSelect('parent')}
          accessibilityLabel="צור חשבון הורה"
        >
          <Text style={styles.btnText}>צור חשבון הורה</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={handleSelectUser}
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
    backgroundColor: theme.colors.background,
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
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  button: {
    width: '80%',
    backgroundColor: theme.colors.card,
    paddingVertical: hp(2),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  pressed: {
    opacity: 0.85,
  },
  btnText: {
    fontSize: hp(2.2),
    color: theme.colors.primary,
    fontWeight: theme.fonts.semibold,
  },
  backToWelcomeButton: {
    position: 'absolute',
    top: hp(4),
    left: hp(4),
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    zIndex: 1,
  },
  backToWelcomeText: {
    color: theme.colors.textPrimary,
    fontWeight: theme.fonts.bold,
    fontSize: hp(2),
  },
})
