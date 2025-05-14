import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';
import { Ionicons, Entypo } from '@expo/vector-icons';
import PromptModal from '../components/PromptModal';


const PromptCard = ({ icon, onPress }) => (
  <Pressable style={styles.card} onPress={onPress}>
    <View style={styles.icon}>{icon}</View>
    <View>
      <Text style={styles.selectText}>בחרו פרומפט</Text>
      <Text style={styles.recordText}>והקליטו את התשובה שלכם</Text>
    </View>
    <Entypo name="plus" size={20} color="white" style={styles.plusIcon} />
  </Pressable>
);

const Prompts = () => {
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
      hobbies,
      showHobbies = 'false',
      identities,
      showIdentities = 'false',
      supportNeeds,
      showSupportNeeds = 'false',
      introduction,
    } = useLocalSearchParams();
  
  const [modalVisible, setModalVisible] = useState(false);

  const goBack = () => router.back();

  const skipForNow = () => {
    router.push({
      pathname: '/status',
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
          hobbies,
          showHobbies,
          identities,
          showIdentities,
          supportNeeds,
          showSupportNeeds,
          introduction,
      }
    });
  };

  const handlePromptSelected = (prompt) => {
   
    setModalVisible(false);
    router.push({
      pathname: '/recordPrompt',
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
          hobbies,
          showHobbies,
          identities,
          showIdentities,
          supportNeeds,
          showSupportNeeds,
          introduction,
          prompt,
      }
    });  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>חזור</Text>
        </Pressable>
        <Text style={styles.title}>תתחילו את השיחה עם פרומפטים</Text>
      </View>

      <Text style={styles.description}>
        פרומפטים מקלים על התאמות להתחבר אליכם
      </Text>

      <Text style={styles.sectionTitle}>פרומפט קול</Text>
      <PromptCard
        icon={<Ionicons name="mic" size={24} color="white" />}
        onPress={() => setModalVisible(true)}
      />

      <Pressable style={styles.skipButton} onPress={skipForNow}>
        <Text style={styles.skipText}>המשך</Text>
      </Pressable>

      <PromptModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectPrompt={handlePromptSelected}
      />
    </ScrollView>
  );
};

export default Prompts;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: hp(7),
    paddingHorizontal: wp(5),
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  title: {
    fontSize: hp(3),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'right',
    marginRight: wp(6),
    marginTop: wp(10),
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
    marginTop: wp(10),
  },
  backText: {
    color: '#fff',
    fontSize: hp(2),
  },
  description: {
    fontSize: hp(2),
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginBottom: hp(9),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: hp(1),
    textAlign: 'right',
  },
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceDark || '#2d2f3a',
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginBottom: hp(2),
  },
  icon: {
    backgroundColor: theme.colors.primary,
    padding: wp(2),
    borderRadius: theme.radius.md,
    marginLeft: wp(2),
  },
  selectText: {
    color: '#fff',
    fontSize: hp(2),
    fontWeight: '600',
    textAlign: 'right',
  },
  recordText: {
    color: '#fff',
    fontSize: hp(1.8),
    textAlign: 'right',
  },
  plusIcon: {
    marginLeft: wp(2),
  },
  skipButton: {
    marginTop: hp(40),
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  skipText: {
    color: '#fff',
    fontSize: hp(2.2),
    fontWeight: 'bold',
  },
});