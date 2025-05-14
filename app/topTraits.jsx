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

const TRAITS = [
  'תמיד מאחר/ת', 'חושב/ת מלמטה למעלה', 'יצירתי/ת', 'שוכח/ת', 'מקשיב/ה טוב',
  'בעל/ת אנרגיה גבוהה', 'מילולית', 'הגיוני/ת', 'עייפ/ה נפשית', 'נאמנ/ה',
  'נלהב/ת', 'נוטה לציית לחוקים', 'סרקסטי/ת', 'רציני/ת', 'שטותניק/ית',
  'ממוקד/ת בתחומי עניין מיוחדים', 'צדק/ת חשוב לי/ה', 'בעל/ת רצון חזק', 'פטפטן/ית',
  'חושב/ת מלמעלה למטה',
];

const TopTraits = () => {
  const [selectedTraits, setSelectedTraits] = useState([]);
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
  } = useLocalSearchParams();

  const animationRefs = useRef(
    TRAITS.reduce((acc, trait) => {
      acc[trait] = new Animated.Value(1);
      return acc;
    }, {})
  );

  const toggleTrait = (trait) => {
    if (selectedTraits.includes(trait)) {
      setSelectedTraits(selectedTraits.filter(t => t !== trait));
    } else if (selectedTraits.length < 5) {
      setSelectedTraits([...selectedTraits, trait]);
    } else {
      Alert.alert('מקסימום תכונות', 'ניתן לבחור עד 5 תכונות בלבד');
    }
  };

  const animatePress = (trait) => {
    Animated.sequence([
      Animated.timing(animationRefs.current[trait], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animationRefs.current[trait], {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const filteredTraits = TRAITS.filter(trait =>
    trait.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const goToNextStep = () => {
  
    router.push({
      pathname: '/hobbies',
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
        traits: JSON.stringify(selectedTraits),
        showTraits: showOnProfile,
      },
    });
  };
  const goBack = () => router.back();

  return (
    <View style={styles.container}>
      {/* שורה: חזור + כותרת */}
      <View style={styles.headerRow}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>חזור</Text>
        </Pressable>
        <Text style={styles.title}>התכונות שמאפיינות אותך</Text>
      </View>

      <TextInput
        placeholder="חפש תכונה..."
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
        value={searchTerm}
        onChangeText={setSearchTerm}
        textAlign="right"
      />

      <Text style={styles.counterText}>
        {selectedTraits.length} / 5 תכונות נבחרו
      </Text>

      <ScrollView contentContainerStyle={styles.traitsContainer}>
        {filteredTraits.map((trait) => (
          <Animated.View
            key={trait}
            style={[
              styles.trait,
              selectedTraits.includes(trait) && styles.traitSelected,
              { transform: [{ scale: animationRefs.current[trait] }] },
            ]}
          >
            <Pressable
              onPress={() => {
                animatePress(trait);
                toggleTrait(trait);
              }}
            >
              <Text
                style={[
                  styles.traitText,
                  selectedTraits.includes(trait) && styles.traitTextSelected,
                ]}
              >
                {trait}
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

export default TopTraits;

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
      padding: hp(1.8),
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
      color: theme.colors.white,
      fontSize: hp(2.2),
      fontWeight: 'bold',
    },
  });