import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';

const BuildProfile = () => {
  const router = useRouter();

  const onNext = () => {
    router.push('/yourNextStep'); // שנה לשם הדף הבא
  };
  const goBack = () => router.back();

  return (
    <View style={styles.container}>
         <Pressable style={styles.backButton} onPress={goBack}>
                      <Text style={styles.backText}>חזור</Text>
         </Pressable>
      <Image
        source={require('../assets/images/profile-illustration.png')} // החלף לתמונה הרצויה שלך
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>עכשיו הגיע הזמן לבנות את הפרופיל שלך!</Text>
      <Text style={styles.description}>
        זוהי ההזדמנות שלך להראות לעולם מי אתה ואיך אתה רוצה להתחבר לאחרים. השאלות שנציג בפניך יעזרו לך להעמיק בדברים שבאמת חשובים כשמכירים מישהו חדש – כמו סגנון התקשורת שלך, הצרכים הרגשיים שלך, והתחומים שמעניינים אותך באמת.

        {"\n\n"}אנחנו מאמינים שפרופילים כנים יוצרים חיבורים כנים. אז תרגיש חופשי לבטא את עצמך – וככה תמצא את האנשים שמתאימים לך באמת.
      </Text>

      <Pressable style={styles.nextButton} onPress={onNext}>
        <Text style={styles.nextButtonText}>המשך</Text>
      </Pressable>
    </View>
  );
};

export default BuildProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4FF', // צבע רקע מרגיע
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingTop: hp(6),
  },
  image: {
    width: wp(60),
    height: hp(30),
    marginBottom: hp(4),
  },
  title: {
    fontSize: hp(3),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: hp(2),
  },
  description: {
    fontSize: hp(2),
    color: theme.colors.textDisabled,
    textAlign: 'right',
    lineHeight: hp(3),
    marginBottom: hp(5),
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(2),
    paddingHorizontal: wp(10),
    borderRadius: theme.radius.lg,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  nextButtonText: {
    color: theme.colors.white,
    fontSize: hp(2.4),
    fontWeight: theme.fonts.semibold,
  },
  backButton: {
    position: 'absolute',
    top: hp(8),
    right: hp(4),
    backgroundColor: theme.colors.primary,
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
  },
  backText: {
    color: theme.colors.black,
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
});