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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../constants/helpers/common';

const SUPPORT_NEEDS = [
  'גישה לשפת סימנים',
  'גיבוי במלווה/מדריך',
  'גידור תנועה וסיוע בהליכה',
  'הגנה מרעשים חזקים',
  'הגנה מטריגרים רגשיים',
  'העדפה להודעות כתובות',
  'הסברים פשוטים וקצרים',
  'התמודדות עם כאב מתמשך',
  'זמן תגובה מותאם',
  'ליווי של מלווה/מדריך',
  'מרחבים שקטים ונינוחים',
  'עזרה בריכוז וקשב',
  'עזרי ויסות חושי',
  'הפסקות יזומות',
  'שמירה על סדר וארגון',
  'שמירה על שגרה קבועה',
  'תכנון חזותי של היום',
  'תמיכה בתקשורת אלטרנטיבית',
  'תמיכה רגשית וליווי',
];

const SupportNeeds = () => {
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnProfile, setShowOnProfile] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();

  // initialize animated values once
  const animationRefs = useRef(
    SUPPORT_NEEDS.reduce((acc, need) => {
      acc[need] = new Animated.Value(1);
      return acc;
    }, {})
  ).current;

  const toggleNeed = (need) => {
    if (selectedNeeds.includes(need)) {
      setSelectedNeeds((prev) => prev.filter((n) => n !== need));
    } else if (selectedNeeds.length < 5) {
      setSelectedNeeds((prev) => [...prev, need]);
    } else {
      Alert.alert('מקסימום בחירות', 'ניתן לבחור עד 5 צרכים בלבד');
    }
  };

  const animatePress = (need) => {
    Animated.sequence([
      Animated.timing(animationRefs[need], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(animationRefs[need], {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const filteredNeeds = SUPPORT_NEEDS.filter((need) =>
    need.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const goToNextStep = () => {
    router.push({
      pathname: '/signUp/introduce',
      params: {
        ...params,
        supportNeeds: JSON.stringify(selectedNeeds),
        showSupportNeeds: showOnProfile,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={hp(7)}
    >
      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
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

        <ScrollView
          contentContainerStyle={styles.needsContainer}
          keyboardShouldPersistTaps="handled"
        >
          {filteredNeeds.map((need) => (
            <Animated.View
              key={need}
              style={[
                styles.need,
                selectedNeeds.includes(need) && styles.needSelected,
                { transform: [{ scale: animationRefs[need] }] },
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
                    styles.needText,
                    selectedNeeds.includes(need) && styles.needTextSelected,
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
    </KeyboardAvoidingView>
  );
};

export default SupportNeeds;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    flex: 1,
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
  needsContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: wp(2),
  },
  need: {
    backgroundColor: theme.colors.surface,
    padding: wp(3),
    borderRadius: theme.radius.md,
    marginVertical: hp(0.5),
  },
  needSelected: {
    backgroundColor: theme.colors.primaryDark,
  },
  needText: {
    fontSize: hp(2),
    color: theme.colors.text,
  },
  needTextSelected: {
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
