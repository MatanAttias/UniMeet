import { StyleSheet, Text, View, Pressable, Alert } from 'react-native'
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


const SignUp = () => {
    const router = useRouter()
    const nameRef = useRef("")
    const lastNameRef = useRef("")
    const emailRef = useRef("")
    const passwordRef = useRef("")
    const confirmPassRef = useRef("")
    const [loading, setLoading] = useState(false)
    
    const onSubmit = async ()=>{
        if(!emailRef.current || !passwordRef.current || !nameRef.current || !lastNameRef.current || !confirmPassRef.current){
            Alert.alert('Sign Up', "Please fill all the fields!")
            return
        }
        if(passwordRef.current !== confirmPassRef.current){
            Alert.alert('Sign up', 'Passwords do not match!')
            return  
          }

        let name = nameRef.current.trim()
        let lastName = lastNameRef.current.trim()
        let email = emailRef.current.trim()
        let password = passwordRef.current.trim()
        let confirmPass = confirmPassRef.current.trim()

        setLoading(true)

        const {data: {session}, error} = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name
              }
            }
        })

        setLoading(false)
        console.log('session: ', session)
        console.log('error: ', error)
        if(error){
          Alert.alert('Sign up', error.message)
        }
    }


  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton router={router} />
        
        {/* welcome */}
        <View>
            <Text style={styles.welcomeText}>Let's</Text>
            <Text style={styles.welcomeText}>Get Started</Text>
        </View>

        {/* form */}
        <View style={styles.form}>
            <Text style={{fontSize: hp(1.5), color: theme.colors.text}}>
                Please fill the details to create an account
            </Text>
            <Input
                icon={<Icon name="user" size={26} strokeWidth={1.6} />}
                placeholder='Enter your name'
                onChangeText={value=> nameRef.current = value}
            />
            <Input
                icon={<Icon name="user" size={26} strokeWidth={1.6} />}
                placeholder='Enter your last name'
                onChangeText={value=> lastNameRef.current = value}
            />
            <Input
                icon={<Icon name="mail" size={26} strokeWidth={0.5} />}
                placeholder='Enter your email'
                onChangeText={value=> emailRef.current = value}
            />
            <Input
                icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
                placeholder='Enter your password'
                secureTextEntry
                onChangeText={value=> passwordRef.current = value}
            />
            <Input
                icon={<Icon name="confirm" size={26} strokeWidth={1.6} />}
                placeholder='Confirm password'
                secureTextEntry
                onChangeText={value=> confirmPassRef.current = value}
            />
            {/* login button */}
            <Button title={'Sign up'} loading={loading} onPress={onSubmit} />
        </View>

        {/* footer */}
        <View style={styles.footer}>
            <Text style={styles.footerText}>
                Already have an account!
            </Text>
            <Pressable onPress={() => router.push('login')}>
                <Text style={[styles.footerText, {color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold}]} >Login</Text>
            </Pressable>
        </View>


      </View>

    </ScreenWrapper>
  )
}

export default SignUp

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 45,
        paddingHorizontal: wp(5),
    },
    welcomeText: {
        fontSize: hp(4),
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
        textAlign: 'center',
        color: theme.colors.text,
        fontSize: hp(1.6)
    }

})