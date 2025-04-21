import { StyleSheet, Text, View, Image, Pressable } from 'react-native'
import React from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import { hp, wp } from '../constants/helpers/common'
import Button from '../components/Button'
import { useRouter } from 'expo-router'

const Welcome = () => {
  const router = useRouter()

  return (
    <ScreenWrapper bg="#2A262F">
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* welcome image */}
        <Image
          style={styles.welcomeImage}
          resizeMode="cover"
          source={require('../assets/images/welcome.png')}
        />

        {/* title */}
        <View style={{ gap: 20 }}>
          <Text style={styles.title}>
            UniMeet - מקום להכיר להתחבר ולצמוח יחד
          </Text>
          <Text style={styles.punchline}>
            ב-UniMeet כל אחד יכול להרגיש שייך. כאן תוכל להכיר חברים חדשים, ליצור קשרים אמיתיים ואפילו למצוא אהבה.
            כי לכל אחד מגיע מקום מיוחד, ולכל אחד יש סיפור. ב-UniMeet, הסיפורים מתחברים ויוצרים קהילה אחת תומכת ומכילה.
          </Text>
        </View>

        {/* footer */}
        <View style={styles.footer}>
          <Button
            title="התחל"
            buttonStyle={{
              marginHorizontal: wp(3),
              backgroundColor: '#FFB3C1',
              color: '#2A262F'
            }}
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
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#2A262F',
    paddingHorizontal: wp(4)
  },
  welcomeImage: {
    height: hp(30),
    width: wp(100),
    alignSelf: 'center'
  },
  title: {
    color: '#FFB3C1',
    fontSize: hp(4),
    textAlign: 'center',
    fontWeight: 'bold'
  },
  punchline: {
    textAlign: 'center',
    paddingHorizontal: wp(10),
    fontSize: hp(1.7),
    color: '#F2F2F2'
  },
  footer: {
    gap: 30,
    width: '100%'
  },
  bottomTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5
  },
  loginText: {
    textAlign: 'center',
    color: '#F2F2F2',
    fontSize: hp(1.6)
  },
  loginLink: {
    textAlign: 'center',
    color: '#FFB3C1',
    fontWeight: 'bold',
    fontSize: hp(1.6)
  }
})