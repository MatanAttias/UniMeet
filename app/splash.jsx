import React, { useEffect } from 'react'
import { View, StyleSheet, I18nManager, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { MotiText, MotiView } from 'moti'
import { theme } from '../constants/theme'
import { hp } from '../constants/helpers/common'
import Icon from 'react-native-vector-icons/Ionicons'

const { width, height } = Dimensions.get('window')

const SplashScreen = () => {
  const router = useRouter()

  useEffect(() => {
    const hide = async () => {
      await SplashScreen.hideAsync(); // ✅ הסתרת ה־Splash ה־native ברגע שהמסך שלך מוכן
    };
  
    hide();
    
    const timer = setTimeout(() => {
      router.replace('/welcome')
    }, 4500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      {/* ניצוצות רקע */}
      <Sparkle />

      {/* כותרת אנימטיבית */}
      <MotiText
        from={{ opacity: 0, translateY: 40, scale: 0.9 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ duration: 800 }}
        style={styles.logoText}
      >
        UniMeet
      </MotiText>

      {/* משפט צבעוני + אפקטים */}
      <MotiText
        style={styles.subtitle}
        from={{ opacity: 0, scale: 0.8, translateY: 30 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ delay: 1200, duration: 1200 }}
      >
        מקום להכיר, להתחבר{'\n'}ולצמוח יחד
      </MotiText>
      <MotiView
        from={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [1, 1.2, 1], opacity: 1 }}
        transition={{
            loop: true,
            type: 'timing',
            duration: 1200,
            delay: 2500,
        }}
        >
        <Icon name="heart" size={hp(5)} color="#ff3366" style={styles.heart} />
        </MotiView>
    </View>
  )
}

export default SplashScreen

const Sparkle = () => {
    const sparkles = Array.from({ length: 20 })
  
    return (
      <>
        {sparkles.map((_, index) => {
          const size = Math.random() * 4 + 2
          const top = Math.random() * height
          const left = Math.random() * width
          const duration = 2000 + Math.random() * 2000
  
          return (
            <MotiView
              key={index}
              from={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration,
                loop: true,
                delay: index * 100,
              }}
              style={{
                position: 'absolute',
                top,
                left,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                shadowColor: '#fff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 4,
              }}
            />
          )
        })}
      </>
    )
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1c1c1e', // סגלגל כהה
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoText: {
      fontSize: hp(8),
      color: '#fff',
      fontWeight: 'bold',
      textShadowColor: theme.colors.primary,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 15,
    },
    subtitle: {
      marginTop: hp(4),
      fontSize: hp(2.6),
      color: theme.colors.primary,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: hp(3.8),
      textShadowColor: '#fff',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 12,
      writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
    },
    heart: {
        fontSize: hp(5),
        marginTop: hp(3),
        textAlign: 'center',
        textShadowColor: '#fff',
        textShadowRadius: 10,
      },
  })