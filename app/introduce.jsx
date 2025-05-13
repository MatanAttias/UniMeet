import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';

const Introduce = () => {
  const [text, setText] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();

  const goToNextStep = () => {
    router.push({
      pathname: '/prompts', // שנה בהתאם לנתיב הבא שלך
      params: {
        ...params,
        introduction: text,
      },
    });
  };

  const goBack = () => router.back();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={goBack} style={styles.backButton}>
            <Text style={styles.backText}>חזור</Text>
          </Pressable>
          <Text style={styles.title}>הצג את עצמך</Text>
        </View>

        <Text style={styles.description}>
          שאחרים יכירו אתכם טוב יותר. לא בטוחים מה לכתוב? הכל בסדר – אפשר לדלג ולחזור לזה אחר כך.
        </Text>

        <TextInput
          style={styles.textArea}
          placeholder="כתבו משהו נהדר כאן!"
          placeholderTextColor={theme.colors.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={3000}
          textAlign="right"
          textAlignVertical="top"
        />

        <Text style={styles.counter}>{text.length} / 3000 תווים</Text>

        <Pressable style={styles.saveButton} onPress={goToNextStep}>
          <Text style={styles.saveText}>דלגו כעת</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Introduce;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: hp(7),
    paddingHorizontal: wp(6),
  },
  scroll: {
    flexGrow: 1,
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
  description: {
    fontSize: hp(2),
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginBottom: hp(2),
  },
  textArea: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: theme.radius.md,
    padding: wp(4),
    height: hp(30),
    fontSize: hp(2.2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  counter: {
    textAlign: 'right',
    color: theme.colors.textSecondary,
    fontSize: hp(1.8),
    marginTop: hp(1),
  },
  saveButton: {
    marginTop: hp(4),
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: hp(2.2),
    fontWeight: 'bold',
  },
});