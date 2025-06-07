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
import { theme } from '../../constants/theme';
import { hp, wp } from '../../constants/helpers/common';

const HOBBIES = [
  'איפור',
  'אופניים',
  'אסטרונומיה',
  'אמנות',
  'בישול ואפייה',
  'בינג\' בנטפליקס',
  'גינון',
  'השקעות',
  'טניס',
  'טיולים',
  'יוגה ומדיטציה',
  'כדורגל',
  'כדורסל',
  'כתיבה',
  'לימוד שפות',
  'מוזיקה',
  'נגינה על כלי נגינה',
  'משחקי קלפים',
  'משחקי וידאו',
  'סדרה טובה',
  'ספורט',
  'עיצוב פנים',
  'פודקאסטים',
  'צילום',
  'ציור',
  'קריאת ספרים',
  'קוסמטיקה',
  'ריקוד',
  'ריצה',
  'שחמט',
  'שחייה',
  'שירה',
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
    location,
    preferredMatch,
    traits,
    showTraits = 'false',
    role,
  } = useLocalSearchParams();

  const animationRefs = useRef(
    HOBBIES.reduce((acc, hobby) => {
      acc[hobby] = new Animated.Value(1);
      return acc;
    }, {})
  );

  const toggleHobby = (hobby) => {
    if (selectedHobbies.includes(hobby)) {
      setSelectedHobbies(selectedHobbies.filter((h) => h !== hobby));
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

  const filteredHobbies = HOBBIES.filter((hobby) =>
    hobby.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const goToNextStep = () => {
    router.push({
      pathname: '/signUp/identify',
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
        role,
      },
    });
  };

  const goBack = () => router.back();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>חזור</Text>
        </Pressable>
        <Text style={styles.title}>תחביבים</Text>
      </View>

      {/* Search */}
      <TextInput
        placeholder="חפש תחביב או כתוב בעצמך..."
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
        value={searchTerm}
        onChangeText={setSearchTerm}
        textAlign="right"
      />

      {/* Counter */}
      <Text style={styles.counterText}>
        {selectedHobbies.length} / 5 תחביבים נבחרו
      </Text>

      {/* List of hobbies */}
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

      {/* Footer */}
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
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(3),
    fontSize: hp(2),
    color: theme.colors.text,
    marginBottom: hp(2),
    textAlign: 'right',
  },
  counterText: {
    textAlign: 'right',
    color: theme.colors.textSecondary,
    fontSize: hp(1.8),
    marginBottom: hp(1),
  },
  traitsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingBottom: hp(2),
  },
  trait: {
    backgroundColor: theme.colors.surface,
    padding: wp(3),
    borderRadius: theme.radius.md,
    marginVertical: hp(1),
    marginHorizontal: wp(1),
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
    marginTop: hp(4),
  },
  toggleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  toggleLabel: {
    fontSize: hp(2),
    color: theme.colors.text,
    marginRight: wp(3),
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginBottom: hp(6),
  },
  saveText: {
    color: theme.colors.textSecondary,
    fontSize: hp(2.2),
    fontWeight: 'bold',
  },
});
