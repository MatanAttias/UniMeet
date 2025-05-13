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

const SUPPORT_NEEDS = [
    'עזרי תקשורת',
    'עזרה בריכוז וקשב',
    'תמיכה בנוכחות מלווה',
    'סיוע ממטפל אישי',
    'התמודדות עם כאב מתמשך',
    'שמירה על סדר ויציבות',
    'סביבה מתחשבת בבריאות',
    'קושי בקבלת החלטות',
    'מגע מרגיע וחיבוק עמוק',
    'הגנה מרעשים חזקים',
    'עזרי ויסות חושי',
    'תמיכה בהליכה או תנועה',
    'תקשורת אחד על אחד',
    'מרחבים שקטים ונינוחים',
    'שמירה על שגרה קבועה',
    'גישה לשפת סימנים',
    'העדפה להודעות כתובות',
    'הגנה מטריגרים רגשיים',
    'תכנון חזותי של היום',
  ];

const SupportNeeds = () => {
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnProfile, setShowOnProfile] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();

  const animationRefs = useRef(
    SUPPORT_NEEDS.reduce((acc, need) => {
      acc[need] = new Animated.Value(1);
      return acc;
    }, {})
  );

  const toggleNeed = (need) => {
    if (selectedNeeds.includes(need)) {
      setSelectedNeeds(selectedNeeds.filter(n => n !== need));
    } else if (selectedNeeds.length < 5) {
      setSelectedNeeds([...selectedNeeds, need]);
    } else {
      Alert.alert('מקסימום בחירות', 'ניתן לבחור עד 5 צרכים בלבד');
    }
  };

  const animatePress = (need) => {
    Animated.sequence([
      Animated.timing(animationRefs.current[need], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animationRefs.current[need], {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const filteredNeeds = SUPPORT_NEEDS.filter(need =>
    need.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const goToNextStep = () => {
    router.push({
      pathname: '/introduce',
      params: {
        ...params,
        supportNeeds: JSON.stringify(selectedNeeds),
        showSupportNeeds: showOnProfile,
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
        <Text style={styles.title}>איך אפשר לתמוך בך</Text>
      </View>

      <TextInput
        placeholder="חפש או כתוב בעצמך..."
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
        value={searchTerm}
        onChangeText={setSearchTerm}
        textAlign="right"
      />

      <Text style={styles.counterText}>
        {selectedNeeds.length} / 5 צרכים נבחרו
      </Text>

      <ScrollView contentContainerStyle={styles.traitsContainer}>
        {filteredNeeds.map((need) => (
          <Animated.View
            key={need}
            style={[
              styles.trait,
              selectedNeeds.includes(need) && styles.traitSelected,
              { transform: [{ scale: animationRefs.current[need] }] },
            ]}
          >
            <Pressable
              onPress={() => {
                animatePress(need);
                toggleNeed(need);
              }}
            >
              <Text
                style={[
                  styles.traitText,
                  selectedNeeds.includes(need) && styles.traitTextSelected,
                ]}
              >
                {need}
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

export default SupportNeeds;

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
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: theme.radius.md,
    padding: wp(3),
    fontSize: hp(2.2),
    marginBottom: hp(1),
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