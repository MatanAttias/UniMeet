import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Button from '../../components/Button';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';

const LocationPermission = () => {
  const router = useRouter();
  const {
    fullName,
    email,
    password,
    birth_date,
    connectionTypes,
    image,
    wantsNotifications = 'false', 
    role,
  } = useLocalSearchParams();

  const handleSkip = () => {
    const params = {
      fullName,
      email,
      password,
      birth_date,
      wantsNotifications: wantsNotifications === 'true',
      connectionTypes,
      image,
      location: null,
      role,
    };
    router.push({ pathname: '/signUp/genderSignUp', params });
  };

  const handleLocationPermission = async () => {
    try {
      // בקש הרשאת מיקום (אם לא נתנה עדיין)
      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== Location.PermissionStatus.GRANTED) {
        const res = await Location.requestForegroundPermissionsAsync();
        status = res.status;
      }

      if (status === Location.PermissionStatus.GRANTED) {
        const { coords } = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          timeout: 10000,
          maximumAge: 5000,
        });

        const loc = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

        const params = {
          fullName,
          email,
          password,
          birth_date,
          wantsNotifications: wantsNotifications === 'true',
          connectionTypes,
          image,
          role,
          location: JSON.stringify(loc),
        };
        router.push({ pathname: '/signUp/genderSignUp', params });
      } else {
        Alert.alert(
          'גישה למיקום חסומה',
          'כדי להמשיך עם חווית משתמש מלאה, אנא אפשר גישה למיקום בהגדרות האפליקציה.',
          [
            { text: 'פתח הגדרות', onPress: () => Linking.openSettings() },
            { text: 'המשך בלי', style: 'cancel', onPress: handleSkip },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'שגיאה',
        'לא הצלחנו לקבל את המיקום שלך.',
        [{ text: 'המשך ללא מיקום', onPress: handleSkip }]
      );
    }
  };

  const goBack = () => router.back();

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/location.png')}
        style={styles.image}
        resizeMode="contain"
      />

      <Pressable style={styles.backButton} onPress={goBack}>
        <Text style={styles.backText}>חזור</Text>
      </Pressable>

      <Text style={styles.title}>איפה אתה גר?</Text>
      <Text style={styles.description}>
        נשמח לדעת את המיקום שלך כדי שנוכל להתאים עבורך את התוכן, הקהילה והאנשים שבקרבתך 🌍
      </Text>

      <Button
        title="אפשר מיקום"
        onPress={handleLocationPermission}
        buttonStyle={styles.button}
        textStyle={styles.buttonText}
      />

      <Button
        title="לא עכשיו"
        onPress={handleSkip}
        buttonStyle={[styles.button, styles.secondaryButton]}
        textStyle={[styles.buttonText, { color: theme.colors.textPrimary }]}
      />
    </View>
  );
};

export default LocationPermission;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: wp(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: wp(70),
    height: hp(30),
    marginBottom: hp(3),
  },
  title: {
    fontSize: hp(3.5),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: hp(2),
  },
  description: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.textPrimary,
    marginBottom: hp(4),
    paddingHorizontal: wp(4),
  },
  button: {
    width: '100%',
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.md,
    marginBottom: hp(2),
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: '#FF69B4',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  backButton: {
    position: 'absolute',
    top: hp(8),
    right: hp(4),
    backgroundColor: theme.colors.card,
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
    color: theme.colors.primary,
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
});