import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';
import Button from '../components/Button';

const ConnectionType = () => {
  const router = useRouter();
  const { fullName, email, password, birth_date, wantsNotifications } = useLocalSearchParams();

  // המרה של wantsNotifications מ-string ל-boolean
  const wantsNotificationsBool = wantsNotifications === 'true';

  const [selectedTypes, setSelectedTypes] = useState([]);

  const goToPreviousStep = () => {
    router.back();
  };

  const toggleSelection = (type) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const goNext = () => {

    if (selectedTypes.length === 0) return;
    router.push({
      pathname: '/profilePicture',
      params: {
        fullName,
        email,
        password,
        birth_date,
        wantsNotifications: wantsNotificationsBool, // מועבר כערך בוליאני
        connectionTypes: selectedTypes.join(','),
      },
    });
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backToWelcomeButton} onPress={goToPreviousStep}>
        <Text style={styles.backToWelcomeText}>חזור</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>איזה קשר אתה מחפש?</Text>
        <Text style={styles.punchline}>אנו ניצור תור התאמה שיתאים להעדפותיך</Text>
      </View>

      <View style={styles.optionsContainer}>
        {/* דייטים */}
        <Pressable
          style={[
            styles.optionBox,
            selectedTypes.includes('דייטים') && styles.optionBoxSelected,
          ]}
          onPress={() => toggleSelection('דייטים')}
        >
          <FontAwesome name="heart" size={hp(5)} color="#FF69B4" />
          <Text style={styles.optionTitle}>דייטים</Text>
          <Text style={styles.optionDescription}>
            למצוא את הניצוץ הזה עם אנשים שמבינים אותך
          </Text>
        </Pressable>

        {/* חברויות */}
        <Pressable
          style={[
            styles.optionBox,
            selectedTypes.includes('חברויות') && styles.optionBoxSelected,
          ]}
          onPress={() => toggleSelection('חברויות')}
        >
          <FontAwesome name="smile-o" size={hp(5)} color="#FF69B4" />
          <Text style={styles.optionTitle}>חברויות</Text>
          <Text style={styles.optionDescription}>
            צור חברים לכל החיים בכל שלב בחייך
          </Text>
        </Pressable>
      </View>

      <Button
        title="המשך"
        buttonStyle={styles.continueButton}
        textStyle={styles.continueButtonText}
        onPress={goNext}
        disabled={selectedTypes.length === 0}
      />
    </View>
  );
};

export default ConnectionType;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: wp(6),
    paddingTop: hp(14),
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(6),
  },
  title: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: hp(4),
  },
  punchline: {
    fontSize: hp(2.2),
    color: 'white',
    textAlign: 'center',
  },
  optionsContainer: {
    gap: hp(3),
  },
  optionBox: {
    backgroundColor: theme.colors.card,
    padding: hp(3),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionBoxSelected: {
    borderColor: '#FF69B4',
  },
  optionTitle: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.bold,
    color: '#FF69B4',
    marginTop: hp(1),
  },
  optionDescription: {
    fontSize: hp(2),
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: hp(0.5),
  },
  continueButton: {
    position: 'absolute',
    bottom: hp(4),
    left: wp(6),
    right: wp(6),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  continueButtonText: {
    color: '#FF69B4',
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
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