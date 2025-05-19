import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const FinalStep = () => {
  const router = useRouter();
  const rawParams = useLocalSearchParams();

  const [
    {
      fullName,
      email,
      password,
      birth_date,
      gender,
      connectionTypes,
      image,
      wantsNotifications,
      location,
      preferredMatch,
      traits,
      showTraits,
      hobbies,
      showHobbies,
      identities,
      showIdentities,
      supportNeeds,
      showSupportNeeds,
      introduction,
      audio,
      prompt,
      status,
    },
    setParams
  ] = useState(() => {
    // פרסינג של ערכים מה-params
    const parseBool = (val) => val === 'true';
    const parseJson = (val) => {
      try {
        return typeof val === 'string' ? JSON.parse(val) : val;
      } catch (e) {
        return null;
      }
    };

    return {
      fullName: rawParams.fullName ?? '',
      email: rawParams.email ?? '',
      password: rawParams.password ?? '',
      birth_date: rawParams.birth_date ?? '',
      gender: rawParams.gender ?? '',
      connectionTypes: rawParams.connectionTypes ?? '',
      image: rawParams.image ?? '',
      wantsNotifications: parseBool(rawParams.wantsNotifications),
      location: parseJson(rawParams.location), 
      preferredMatch: rawParams.preferredMatch ?? '',
      traits: parseJson(rawParams.traits),
      showTraits: parseBool(rawParams.showTraits),
      hobbies: parseJson(rawParams.hobbies),
      showHobbies: parseBool(rawParams.showHobbies),
      identities: parseJson(rawParams.identities),
      showIdentities: parseBool(rawParams.showIdentities),
      supportNeeds: parseJson(rawParams.supportNeeds),
      showSupportNeeds: parseBool(rawParams.showSupportNeeds),
      introduction: rawParams.introduction ?? '',
      audio: rawParams.audio ?? '',
      prompt: rawParams.prompt ?? '',
      status: rawParams.status ?? '',
    };
  });

  const [loading, setLoading] = useState(false);

  const onNext = async () => {
    // ולידציה
    if (
      !email ||
      !password ||
      !fullName ||
      !birth_date ||
      !gender ||
      !connectionTypes
    ) {
      Alert.alert('שגיאה', 'נא לוודא שכל שדות החובה מולאו');
      return;
    }
  
    try {
      setLoading(true);
  
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            role: 'user',
          },
        },
      });
  
      if (error) throw error;
      if (!data?.user) throw new Error('User not returned from signUp');
  
      // 🧠 טיפול בפרמטר מיקום שמגיע כמחרוזת JSON
      let parsedLocation = null;
      if (location) {
        try {
          parsedLocation =
            typeof location === 'string' ? JSON.parse(location) : location;
  
          if (
            typeof parsedLocation !== 'object' ||
            parsedLocation.latitude == null ||
            parsedLocation.longitude == null
          ) {
            console.warn('Invalid location structure:', parsedLocation);
            parsedLocation = null;
          }
        } catch (parseErr) {
          console.warn('Failed to parse location JSON:', parseErr);
          parsedLocation = null;
        }
      }
  
      const { error: upsertError } = await supabase
        .from('users')
        .upsert([
          {
            id: data.user.id,
            email,
            name: fullName,
            birth_date,
            gender,
            connectionTypes,
            image,
            wantsNotifications,
            location: parsedLocation, // 👈 בדיוק כמו שביקשת - נשמר כ-jsonb רגיל
            preferredMatch,
            traits,
            showTraits,
            hobbies,
            showHobbies,
            identities,
            showIdentities,
            supportNeeds,
            showSupportNeeds,
            introduction,
            audio,
            prompt,
            status,
          },
        ]);
  
      if (upsertError) throw upsertError;
  
      Alert.alert('הצלחה', 'נרשמת בהצלחה!');
      router.push('/(main)/profile');
    } catch (err) {
      console.error('Sign up error:', err);
      Alert.alert('שגיאה', 'הרישום נכשל, אנא נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => router.back();

  const tips = [
    'תמיד תיפגשו ותישארו במקומות ציבוריים שבהם יש אנשים נוספים',
    'אל תמסרו מספר טלפון אישי או כתובת',
    'ספרו לחברים או למשפחה על התוכניות שלכם',
    'היו עם תחבורה משלכם למפגש ומהמפגש, ואל תיכנסו לרכב עם מישהו שאתם לא מכירים היטב',
    'הישארו פיכחים',
    'אל תשלחו כסף או תשתפו פרטים אישיים כמו תעודת זהות, פרטי חשבון בנק או פרטי אבטחה',
    'דווחו על כל התנהגות חשודה לצוות האפליקציה',
    'תהנו, ותהיו אתם עצמכם!',
  ];

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={goBack}>
        <Text style={styles.backText}>חזור</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>טיפים לשמירה על בטיחות</Text>
        <Text style={styles.description}>
          UniMeet נועדה לאפשר יצירת קשרים וקהילות מדהימות, אבל חשוב תמיד לשים לב לבטיחות. הנה כמה כללים חשובים:
        </Text>

        {tips.map((tip, index) => (
          <View key={index} style={styles.tipContainer}>
            <Ionicons name="checkmark-circle" size={hp(2.5)} color="#FF2D7A" />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}

        <Pressable style={styles.nextButton} onPress={onNext} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.nextButtonText}>הבנתי, בואו נתחיל</Text>
          )}
        </Pressable>

        <Pressable style={styles.backButton} onPress={goBack}>
          <Text style={styles.backText}>חזור</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default FinalStep;

// styles (לא השתנה)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  scroll: {
    paddingBottom: hp(10),
    paddingHorizontal: wp(8),
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: hp(12),
  },
  title: {
    fontSize: hp(3),
    fontWeight: theme.fonts.bold,
    color: '#FF2D7A',
    textAlign: 'center',
    marginBottom: hp(2),
    marginTop: hp(2),
  },
  description: {
    fontSize: hp(2),
    color: '#FF2D7A',
    textAlign: 'right',
    lineHeight: hp(3),
    marginBottom: hp(4),
  },
  tipContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: hp(2),
    alignSelf: 'flex-end',
    gap: wp(2),
  },
  tipText: {
    fontSize: hp(2),
    color: '#FF2D7A',
    textAlign: 'right',
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#FF2D7A',
    paddingVertical: hp(2),
    paddingHorizontal: wp(10),
    borderRadius: theme.radius.lg,
    marginTop: hp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    color: theme.colors.white,
    fontSize: hp(2.4),
    fontWeight: theme.fonts.semibold,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: hp(8),
    right: hp(4),
    backgroundColor: '#FF2D7A',
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: hp(8),
  },
  backText: {
    color: theme.colors.black,
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
});