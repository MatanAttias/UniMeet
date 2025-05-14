// Hobbies.jsx

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';

const HOBBIES = [
  'כדורגל', 'כדורסל', 'מוזיקה', 'ריקוד', 'צילום', 'טיולים', 'קריאה', 'בישול',
  'אפייה', 'ציור', 'ספורט', 'ריצה', 'כתיבה', 'שחייה', 'משחקי וידאו',
  'יוגה', 'מדיטציה', 'גינון', 'סדרה טובה', 'בינג\' בנטפליקס', 'עיצוב פנים',
  'סנובורד', 'גלישה', 'טניס', 'אופניים', 'תכנות', 'השקעות', 'סטארטאפים',
  'לימוד שפות', 'פודקאסטים', 'גיטרה', 'תופים', 'איפור', 'קוסמטיקה',
  'אמנות', 'שירה', 'סקסולוגיה', 'אסטרונומיה', 'שחמט',
];

const Hobbies = () => {
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnProfile, setShowOnProfile] = useState(true);
  const router = useRouter();
  const {
        fullName,
        email,
        password,
        birth_date,
        gender,
        connectionTypes,
        image,
        wantsNotifications = 'false',
        location = 'false',
        preferredMatch,
        traits,
        showTraits = 'false',
   } = useLocalSearchParams();

  const animationRefs = useRef(
    HOBBIES.reduce((acc, hobby) => {
      acc[hobby] = new Animated.Value(1);
      return acc;
    }, {})
  );

  const toggleHobby = (hobby) => {
    if (selectedHobbies.includes(hobby)) {
      setSelectedHobbies(selectedHobbies.filter(h => h !== hobby));
    } else if (selectedHobbies.length < 5) {
      setSelectedHobbies([...selectedHobbies, hobby]);
    } else {
      Alert.alert('מקסימום תחביבים', 'ניתן לבחור עד 5 תחביבים בלבד');
    }
  };

  const animatePress = (hobby) => {
    Animated.sequence([
      Animated.timing(animationRefs.current[hobby], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animationRefs.current[hobby], {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const filteredHobbies = HOBBIES.filter(hobby =>
    hobby.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const goToNextStep = () => {
   
    router.push({
      pathname: '/identify',
      params: {
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
        hobbies: JSON.stringify(selectedHobbies),
        showHobbies: showOnProfile,
      },
    });
  };

  const goBack = () => router.back();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>חזור</Text>
        </Pressable>
        <Text style={styles.title}>תחביבים</Text>
      </View>

      <TextInput
        placeholder="חפש תחביב או כתוב בעצמך..."
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
        value={searchTerm}
        onChangeText={setSearchTerm}
        textAlign="right"
      />

      <Text style={styles.counterText}>
        {selectedHobbies.length} / 5 תחביבים נבחרו
      </Text>

      <ScrollView contentContainerStyle={styles.traitsContainer}>
        {filteredHobbies.map((hobby) => (
          <Animated.View
            key={hobby}
            style={[
              styles.trait,
              selectedHobbies.includes(hobby) && styles.traitSelected,
              { transform: [{ scale: animationRefs.current[hobby] }] },
            ]}
          >
            <Pressable
              onPress={() => {
                animatePress(hobby);
                toggleHobby(hobby);
              }}
            >
              <Text
                style={[
                  styles.traitText,
                  selectedHobbies.includes(hobby) && styles.traitTextSelected,
                ]}
              >
                {hobby}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={styles.toggleRow}>
          <Switch
            value={showOnProfile}
            onValueChange={setShowOnProfile}
            trackColor={{ false: '#ccc', true: theme.colors.primary }}
            thumbColor={showOnProfile ? '#fff' : '#f4f3f4'}
          />
          <Text style={styles.toggleLabel}>הצג בפרופיל</Text>
        </View>

        <Pressable style={styles.saveButton} onPress={goToNextStep}>
          <Text style={styles.saveText}>המשך</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Hobbies;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: wp(6),
    paddingTop: hp(7),
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  title: {
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: 'right',
    flex: 1,
    alignSelf: 'flex-end',
    marginRight: wp(6),
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: hp(2),
    fontWeight: theme.fonts.bold,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: wp(3),
    fontSize: hp(2.2),
    marginBottom: hp(1),
    color: theme.colors.text,
  },
  counterText: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginBottom: hp(1),
  },
  traitsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: wp(2),
    paddingBottom: hp(2),
  },
  trait: {
    backgroundColor: theme.colors.surface,
    padding: wp(3),
    borderRadius: theme.radius.md,
    marginVertical: hp(0.5),
  },
  traitSelected: {
    backgroundColor: theme.colors.primaryDark,
  },
  traitText: {
    fontSize: hp(2),
    color: theme.colors.text,
  },
  traitTextSelected: {
    color: theme.colors.dark,
    fontWeight: 'bold',
  },
  bottomSection: {
    marginTop: hp(2),
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  toggleLabel: {
    fontSize: hp(2),
    color: theme.colors.text,
    marginRight: wp(2),
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    marginBottom: hp(6),
  },
  saveText: {
    color: '#fff',
    fontSize: hp(2.2),
    fontWeight: 'bold',
  },
});