import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../constants/helpers/common';
import React, { useState, useEffect } from 'react';

const STATUS_OPTIONS = ['רווק/ה', 'בזוגיות'];

const Status = () => {
  const router = useRouter();
  const {
        fullName,
        email,
        password,
        birth_date,
        gender,
        role,
        connectionTypes,
        image,
        wantsNotifications = 'false',
        location,
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
        prompt,
        audio,
    } = useLocalSearchParams();


  const [selected, setSelected] = useState(null);
  const [customText, setCustomText] = useState('');

  const isNextEnabled = selected !== null || customText.trim() !== '';
  const goBack = () => router.back();


  const handleNext = () => {

    const status = selected !== null ? STATUS_OPTIONS[selected] : customText.trim();
    router.push({
      pathname: '/signUp/finalStep',
      params: {
        fullName,
        email,
        password,
        birth_date,
        gender,
        role,
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
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>חזור</Text>
        </Pressable>
        <Text style={styles.title}>מה הסטטוס הזוגי שלך?</Text>
      </View>

      <Text style={styles.subtitle}>כולם מתקבלים</Text>

      {STATUS_OPTIONS.map((option, index) => (
        <Pressable
          key={index}
          style={[
            styles.option,
            selected === index && styles.optionSelected
          ]}
          onPress={() => {
            setSelected(index);
            setCustomText('');
          }}
        >
          <Text style={styles.optionText}>{option}</Text>
          <View style={styles.radio}>
            {selected === index && <View style={styles.radioSelected} />}
          </View>
        </Pressable>
      ))}

      <TextInput
        style={styles.input}
        placeholder="כתבו בעצמכם..."
        placeholderTextColor="#aaa"
        value={customText}
        onChangeText={(text) => {
          setCustomText(text);
          setSelected(null);
        }}
      />

      <Text style={styles.info}>תוכלו תמיד לשנות את זה אחר כך</Text>

      <Pressable
        style={[styles.nextButton, !isNextEnabled && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!isNextEnabled}
      >
        <Text style={styles.nextText}>הבא</Text>
      </Pressable>
    </ScrollView>
  );
};

export default Status;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: wp(5),
    paddingTop: hp(6),
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
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
  title: {
    fontSize: hp(3),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    textAlign: 'right',
    flex: 1,
    marginRight: wp(6),
    marginTop: wp(10),
  },
  subtitle: {
    fontSize: hp(2),
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginBottom: hp(4),
  },
  option: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(4),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceDark,
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: hp(2),
  },
  optionSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  optionText: {
    color: '#fff',
    fontSize: hp(2.1),
    fontWeight: '500',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  input: {
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    color: '#fff',
    fontSize: hp(2),
    marginBottom: hp(2),
    textAlign: 'right',
  },
  info: {
    fontSize: hp(1.7),
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginBottom: hp(4),
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    marginTop: hp(23),
  },
  nextButtonDisabled: {
    backgroundColor: '#555',
  },
  nextText: {
    color: '#fff',
    fontSize: hp(2.2),
    fontWeight: 'bold',
  },
});