import { StyleSheet, Text, View, Image } from 'react-native'
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
                <Text style={styles.title} >LinkUp!</Text>
                <Text style={styles.punchline} >
                    Where every thought finds a home and every image tells a story.
                </Text>
            </View>
        

            {/* footer */}
            <View style={styles.footer}>
                <Button
                    title="Getting Started"
                    buttonStyle={{marginHorizontal: wp(3)}}
                    onPress={()=>{}}
                />
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
        frontSize: hp(4),
        textAlign: 'center',
        frontWeight: theme.fonts.extraBold
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

    }

})