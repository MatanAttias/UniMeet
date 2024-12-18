import { StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import { hp, wp } from '../constants/helpers/common'


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
    }
    

})