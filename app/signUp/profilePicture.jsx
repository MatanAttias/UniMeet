import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import Icon from '../../assets/icons';

const ProfilePicture = () => {
  const router = useRouter();
  const {
    fullName,
    email,
    password,
    birth_date,
    wantsNotifications,
    connectionTypes,
  } = useLocalSearchParams();

  const [image, setImage] = useState(null);
  
  // בדיקת הרשאות בעת טעינת המסך
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('שגיאה', 'צריך הרשאה לגישה לגלריה כדי לאפשר בחירת תמונה');
        }
      }
    })();
  }, []);

  const goToPreviousStep = () => {
    router.back();
  };

  const onPickImage = async () => {
    try {
      console.log('ניסיון לפתוח את בורר התמונות');
      
      // בדיקת הרשאה לגישה לגלריה
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('שגיאה', 'לא קיבלנו הרשאה לגישה לגלריה');
        return;
      }

      // פתיחת הגלריה - ✅ תוקן כאן
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      console.log('תוצאת בחירת התמונה:', result);

      // בדיקה האם המשתמש בחר תמונה
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('תמונה נבחרה:', result.assets[0].uri);
        setImage(result.assets[0]);
      }
    } catch (error) {
      console.error('שגיאה בבחירת תמונה:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בעת בחירת התמונה: ' + error.message);
    }
  };

  const onNext = () => {
    if (!image) {
      Alert.alert('נא להוסיף תמונה', 'אנא בחר/י תמונת פרופיל להמשך');
      return;
    }

    router.push({
      pathname: '/signUp/getLocation',
      params: {
        fullName,
        email,
        password,
        birth_date,
        wantsNotifications: wantsNotifications === 'true',
        connectionTypes,
        image: image.uri,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backToWelcomeButton} onPress={goToPreviousStep}>
        <Text style={styles.backToWelcomeText}>חזור</Text>
      </Pressable>

      <Animated.Text entering={FadeInUp} style={styles.title}>
        הגיע הזמן להכיר אותך!
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(200)} style={styles.subtitle}>
        בחר/י תמונת פרופיל שכולם יראו כשיפגשו אותך
      </Animated.Text>

      <Pressable 
        style={styles.imageWrapper} 
        onPress={onPickImage}
        accessibilityLabel="הוסף תמונת פרופיל"
        accessibilityHint="לחץ כדי לבחור תמונת פרופיל מהגלריה שלך"
      >
        {image ? (
          <Image 
            source={{ uri: image.uri }} 
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.placeholder}>
            <Icon name="camera" size={40} color="#aaa" />
            <Text style={styles.placeholderText}>הוספת תמונה</Text>
          </View>
        )}
      </Pressable>

      <Pressable 
        style={styles.button} 
        onPress={onNext}
        accessibilityLabel="כפתור המשך"
      >
        <Text style={styles.buttonText}>המשך</Text>
      </Pressable>
    </View>
  );
};

export default ProfilePicture;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  title: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: hp(2.2),
    color: 'rgba(224, 212, 212, 0.85)',
    textAlign: 'center',
    marginVertical: hp(3),
  },
  imageWrapper: {
    height: hp(25),
    width: hp(25),
    borderRadius: hp(12.5),
    borderWidth: 2,
    borderColor: theme.colors.card,
    overflow: 'hidden',
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(4),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: hp(1.8),
    color: '#888',
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(2),
    paddingHorizontal: wp(10),
    borderRadius: theme.radius.lg,
  },
  buttonText: {
    color: 'white',
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
  },
  backToWelcomeButton: {
    position: 'absolute',
    top: hp(8),
    right: hp(4),
    width: '14%',
    backgroundColor: theme.colors.card,
    paddingVertical: hp(1.0),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  backToWelcomeText: {
    color: theme.colors.primary,
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
});