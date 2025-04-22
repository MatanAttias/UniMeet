import { StyleSheet, Text, View, Image, Pressable } from 'react-native'
import React from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import { hp, wp } from '../constants/helpers/common'
import Button from '../components/Button'
import { useRouter } from 'expo-router'
import { theme } from '../constants/theme'

const Welcome = () => {
  const router = useRouter()

  return (
    <ScreenWrapper bg={theme.colors.dark}>
      <StatusBar style="light" />
      <View style={styles.container}>

        {/* image */}
        <Image
          style={styles.welcomeImage}
          resizeMode="cover"
          source={require('../assets/images/welcome.png')}
        />

        {/* texts */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            UniMeet - מקום להכיר להתחבר ולצמוח יחד
          </Text>
          <Text style={styles.punchline}>
            ב-UniMeet כל אחד יכול להרגיש שייך. כאן תוכל להכיר חברים חדשים,
            ליצור קשרים אמיתיים ואפילו למצוא אהבה.
          </Text>
          <Text style={styles.punchline}>
            כי לכל אחד מגיע מקום מיוחד, ולכל אחד יש סיפור. ב-UniMeet, הסיפורים
            מתחברים ויוצרים קהילה אחת תומכת ומכילה.
          </Text>
        </View>

        {/* actions */}
        <View style={styles.footer}>
          <Button
            title="התחל"
            buttonStyle={styles.button}
            onPress={() => router.push('selectType')}
          />
          <View style={styles.bottomTextContainer}>
            <Text style={styles.loginText}>כבר יש לך חשבון?</Text>
            <Pressable onPress={() => router.push('login')}>
              <Text style={styles.loginLink}>התחבר</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Welcome

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.dark
  },
  welcomeImage: {
    height: hp(30),
    width: wp(100),
    alignSelf: 'center'
  },
  textContainer: {
    gap: hp(1)
  },
  title: {
    color: theme.colors.primary,
    fontSize: hp(3.8),
    textAlign: 'center',
    fontWeight: theme.fonts.bold
  },
  punchline: {
    textAlign: 'center',
    paddingHorizontal: wp(6),
    fontSize: hp(1.8),
    color: theme.colors.textPrimary
  },
  footer: {
    gap: 30,
    width: '100%'
  },
  button: {
    marginHorizontal: wp(3),
    backgroundColor: theme.colors.primary,
    color: theme.colors.text,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4
  },
  bottomTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5
  },
  loginText: {
    color: theme.colors.textPrimary,
    fontSize: hp(1.6)
  },
  loginLink: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.bold,
    fontSize: hp(1.6)
  }
})