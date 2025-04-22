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
    router.push('/signUpUser')
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
    width: '100%',
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
    top: hp(8), // העברת כפתור למטה (שינוי ערך לפי הצורך)
    right: hp(4), // העברה לצד ימין של המסך
    width: '14%', // רוחב קטן יותר מכפתור ה-"הבא"
    backgroundColor: theme.colors.card, // צבע רקע כמו כפתור הבא
    paddingVertical: hp(1.0), // גובה קטן יותר מהכפתור הבא
    borderRadius: theme.radius.md, // רדיוס פינות כמו כפתור הבא
    alignItems: 'center', // מרכז את הטקסט בכפתור
    justifyContent: 'center', // מוודא שהתוכן ממורכז
    shadowColor: theme.colors.shadow, // הצללה כמו כפתור הבא
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  backToWelcomeText: {
    color: theme.colors.primary, // צבע טקסט כמו כפתור הבא
    fontSize: hp(2), // גודל טקסט קטן יותר מהכפתור הבא
    fontWeight: theme.fonts.semibold, // משקל פונט כמו כפתור הבא
  },
})
