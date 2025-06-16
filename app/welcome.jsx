import { StyleSheet, Text, View, Image, Pressable, Alert } from 'react-native'
import React from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import { hp, wp } from '../constants/helpers/common'
import Button from '../components/Button'
import { useRouter } from 'expo-router'
import { theme } from '../constants/theme'
import BottomButtonContainer from '../components/BottomButtonContainer'
import { MotiView, MotiText } from 'moti'
import { useAuth } from '../contexts/AuthContext'

const Welcome = () => {
  const router = useRouter()
  const { debugAuthState, clearAuthStorage } = useAuth()


  return (
    <ScreenWrapper bg={theme.colors.dark}>
      <StatusBar style="light" />
      <View style={styles.container}>

        {/* image */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
        >
          <Image
            style={styles.welcomeImage}
            resizeMode="cover"
            source={require('../assets/images/welcome.png')}
          />
        </MotiView>

        {/* texts */}
        <View style={styles.textContainer}>
          <MotiText
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200, type: 'timing', duration: 600 }}
            style={styles.title}
          >
            UniMeet - מקום להכיר להתחבר ולצמוח יחד
          </MotiText>

          <MotiText
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 400, type: 'timing', duration: 600 }}
            style={styles.punchline}
          >
            ב-UniMeet כל אחד יכול להרגיש שייך. כאן תוכל להכיר חברים חדשים,
            ליצור קשרים אמיתיים ואפילו למצוא אהבה.
          </MotiText>
          <MotiText
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 600, type: 'timing', duration: 600 }}
            style={styles.punchline}
          >
            כי לכל אחד מגיע מקום מיוחד, ולכל אחד יש סיפור. ב-UniMeet, הסיפורים
            מתחברים ויוצרים קהילה אחת תומכת ומכילה.
          </MotiText>
        </View>
      </View>

      {/* bottom actions */}
      <BottomButtonContainer>
        <Button
          title="התחל"
          buttonStyle={styles.button}
          textStyle={styles.btnText}
          onPress={() => router.push('selectType')}
        />
        <View style={styles.bottomTextContainer}>
          <Text style={styles.loginText}>כבר יש לך חשבון?</Text>
          <Pressable onPress={() => router.push('login')}>
            <Text style={styles.loginLink}>התחבר</Text>
          </Pressable>
        </View>
      </BottomButtonContainer>
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
    alignSelf: 'center',
    marginBottom: hp(3),
  },
  textContainer: {
    gap: hp(1)
  },
  title: {
    color: theme.colors.primary,
    fontSize: hp(3.8),
    textAlign: 'center',
    fontWeight: theme.fonts.bold,
    marginBottom: hp(2.5),
  },
  punchline: {
    textAlign: 'center',
    fontSize: hp(1.9),
    lineHeight: hp(2.6),
    fontWeight: theme.fonts.medium,
    color: '#FFFFFF',
    paddingHorizontal: wp(10),
    marginTop: hp(1),
    marginBottom: hp(2),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    opacity: 0.9,
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
    marginBottom: 0,
  },
  btnText: {
    color: theme.colors.primary,
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
  },
  bottomTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5
  },
  loginText: {
    color: theme.colors.textPrimary,
    fontSize: hp(1.6),
    marginBottom: 30,
  },
  loginLink: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.bold,
    fontSize: hp(1.6),
    marginBottom: 30,
  },
  debugContainer: {
    backgroundColor: 'rgba(228, 113, 163, 0.2)', 
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  debugTitle: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  debugButton: {
    backgroundColor: 'rgba(228, 113, 163, 0.3)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(228, 113, 163, 0.5)',
  },
  debugButtonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
})