import { StyleSheet, Text, View, TextInput, Pressable, Alert } from 'react-native'
import React, { useRef, useState } from 'react'
import ScreenWrapper from '../components/ScreenWrapper'
import Icon from '../assets/icons'
import { StatusBar } from 'expo-status-bar'
import BackButton from '../components/BackButton'
import { useRouter } from 'expo-router'
import { hp, wp } from '../constants/helpers/common'
import { theme } from '../constants/theme'
import Input from '../components/input'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'


const Login = () => {
    const router = useRouter()
    const emailRef = useRef("")
    const passwordRef = useRef("")
    const [loading, setLoading] = useState(false)

    const onSubmit = async ()=>{
        if(!emailRef.current || !passwordRef.current){
            Alert.alert('התחברות', "אנא מלא את כל השדות!")
            return
        }
        const email = emailRef.current.trim();
        const password = passwordRef.current.trim();


        setLoading(true);


        const {error} = await supabase.auth.signInWithPassword ( {
            email,
            password,
        });
        
        setLoading(false);
        

        console.log('error: ', error);
        if(error){
            Alert.alert('התחברות', error.message);
        }

        
    }

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={[styles.container, { writingDirection: 'rtl' }]}>
        <BackButton router={router} />
        
        {/* ברוך הבא */}
        <View>
            <Text style={[styles.welcomeText, { textAlign: 'right' }]}>היי,</Text>
            <Text style={[styles.welcomeText, { textAlign: 'right' }]}>ברוך שובך! </Text>
        </View>

        {/* טופס התחברות */}
        <View style={styles.form}>
            <Text style={[{fontSize: hp(1.5), color: theme.colors.text}, { textAlign: 'right' }]}>
                אנא היכנס כדי להמשיך
            </Text>
            <Input
                icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
                placeholder='הכנס את כתובת האימייל שלך'
                onChangeText={value=> emailRef.current = value}
                style={{ textAlign: 'right' }}  // טקסט בתיבת הקלט
            />
            <Input
                icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                placeholder='הכנס את הסיסמה שלך'
                secureTextEntry
                onChangeText={value=> passwordRef.current = value}
                style={{ textAlign: 'right' }}  // טקסט בתיבת הקלט
            />
            <Text style={[styles.forgotPassword, { textAlign: 'right' }]}>
                שכחת סיסמה?
            </Text>
            {/* כפתור התחברות */}
            <Button title={'התחבר'} loading={loading} onPress={onSubmit} />
        </View>
        {/* כותרת תחתונה */}
        <View style={styles.footer}>
            <Text style={[styles.footerText, { textAlign: 'right' }]}>
                אין לך חשבון?
            </Text>
            <Pressable onPress={() => router.push('signUp')}>
                <Text style={[styles.footerText, {color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold, textAlign: 'right' }]} >
                    הירשם
                </Text>
            </Pressable>
        </View>


      </View>

    </ScreenWrapper>
  )
}

export default Login

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 45,
        paddingHorizontal: wp(5),
        textAlign: 'right', // הכיוון של כל הטקסט
    },
    welcomeText: {
        fontSize: hp(4),
        textAlign: 'right', // גם כאן הכיוון מימין לשמאל
    },
    form: {
        gap: 25,
    },
    footer:{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    },
    footerText: {
        textAlign: 'right',
        color: theme.colors.text,
        fontSize: hp(1.6)
    }

})