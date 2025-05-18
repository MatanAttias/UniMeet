import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { hp, wp } from '../constants/helpers/common'
import { theme } from '../constants/theme'
import Button from '../components/Button'

export default function SelectType() {
  const router = useRouter()

  const handleSelect = (role) => () => {
    router.push({ pathname: '/signUp', params: { role } })
  }

  const handleSelectUser = () => {
    router.push('/signUp/signUpUser')
  }

  const handleBack = () => {
    router.push('/welcome')
  }

  return (
    <View style={styles.safe}>
      {/* כפתור חזור */}
      <Pressable style={styles.backToWelcomeButton} onPress={handleBack}>
        <Text style={styles.backToWelcomeText}>חזור</Text>
      </Pressable>

      {/* תוכן מרכזי כולל כפתורים */}
      <View style={styles.container}>
        <Text style={styles.title}>איך נרצה להכיר אותך?</Text>

        <Button
          title="צור חשבון הורה"
          buttonStyle={styles.button}
          textStyle={styles.btnText}
          onPress={handleSelect('parent')}
        />
        <Button
          title="צור חשבון אישי"
          buttonStyle={styles.button}
          textStyle={styles.btnText}
          onPress={handleSelectUser}
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
    gap: hp(3.5),
    writingDirection: 'rtl',
  },
  title: {
    fontSize: hp(3.1),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  button: {
    width: '80%',
    minHeight: hp(6.5),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  btnText: {
    color: theme.colors.primary,
    fontSize: hp(2.3),
    fontWeight: theme.fonts.semibold,
    textAlign: 'center',
    flexShrink: 1, // מונע חיתוך של טקסט
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
})
