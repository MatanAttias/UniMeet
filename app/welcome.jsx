import { StyleSheet, Text, View, Image, Pressable } from 'react-native'
import React from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import { hp, wp } from '../constants/helpers/common'
import { theme } from '../constants/theme'
import Button from '../components/Button'

const Welcome = () => {
  return (
    <ScreenWrapper bg="white">
        <StatusBar style="dark" />
        <View style={styles.container}>
            {/* welcome image */}
            <Image style={styles.welcomeImage} resizeMode='cover' source={require('../assets/images/welcome.png')} />

            {/* title */}
            <View style={{gap: 20}} >
                <Text style={styles.title} >UniMeet - מקום להכיר להתחבר ולצמוח יחד</Text>
                <Text style={styles.punchline} >
                ב-UniMeet כל אחד יכול להרגיש שייך. כאן תוכל להכיר חברים חדשים, ליצור קשרים אמיתיים ואפילו למצוא אהבה.
                כי לכל אחד מגיע מקום מיוחד, ולכל אחד יש סיפור. ב-UniMeet, הסיפורים מתחברים ויוצרים קהילה אחת תומכת ומכילה.
                </Text>
            </View>
        

            {/* footer */}
            <View style={styles.footer}>
                <Button
                    title="Getting Started"
                    buttonStyle={{marginHorizontal: wp(3)}}
                    onPress={()=>{}}
                />
                <View style={styles.bottomTextContainer}>
                    <Text style={styles.loginText}>
                        Already have an account!
                    </Text>
                    <Pressable>
                        <Text style={[styles.loginText, {color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold}]}>
                            Login
                        </Text>
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
        backgroundColor: 'white',
        paddingHorizontal: wp(4)

    },
    welcomeImage: {
        height: hp(50),
        width: wp(100),
        alignSelf: 'center'
    },
    title: {
        color: theme.colors.text,
        fontSize: hp(4),
        textAlign: 'center',
        fontWeight: theme.fonts.extraBold
    },
    punchline: {
        textAlign: 'center',
        paddingHorizontal: wp(10),
        fontSize: hp(1.7),
        color: theme.colors.text
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
        color: theme.colors.text,
        fontSize: hp(1.6)
    }

})