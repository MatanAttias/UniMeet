import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../components/Button';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';
import { supabase } from '../lib/supabase';

const BirthSignUp2 = () => {
  const router = useRouter();
  const { fullName, email } = useLocalSearchParams();
  const [date, setDate] = useState(new Date());
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const role = 'user';

  const goToPreviousStep = () => {
    router.back();
  };

  const onNext = async () => {
    if (date > new Date()) {
      return Alert.alert('שגיאה', 'תאריך הלידה לא יכול להיות בעתיד');
    }

    if (!password || password.length < 6) {
      return Alert.alert('שגיאה', 'נא להזין סיסמה של לפחות 6 תווים');
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: fullName, role },
        },
      });

      if (error) throw error;

      // עדכון שדות נוספים בטבלת users שנוצרה אוטומטית על ידי הטריגר
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email,
          birth_date: date,
        })
        .eq('id', data.user.id);

      if (updateError) throw updateError;

      Alert.alert('הצלחה', 'המשתמש נרשם ונשמר בהצלחה!');
      router.push('/home');
    } catch (error) {
      Alert.alert('שגיאה', 'אירעה שגיאה בהרשמה');
      console.error('SignUp Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backToWelcomeButton} onPress={goToPreviousStep}>
        <Text style={styles.backToWelcomeText}>חזור</Text>
      </Pressable>

      <Text style={styles.title}>מתי יום ההולדת שלך?</Text>
      <Text style={styles.punchline}>יום שהוא רק בשבילך!</Text>

      <View style={styles.datePickerWrapper}>
        <DateTimePicker
          value={date}
          mode="date"
          display="spinner"
          onChange={(event, selectedDate) => {
            if (selectedDate) setDate(selectedDate);
          }}
          style={styles.datePicker}
          {...(Platform.OS === 'ios' ? { textColor: 'white' } : {})}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="הזן סיסמה"
        placeholderTextColor="#ccc"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title={loading ? 'טוען...' : 'הבא'}
        buttonStyle={styles.bottomButton}
        textStyle={styles.btnText}
        onPress={onNext}
        disabled={loading}
      />
    </View>
  );
};

export default BirthSignUp2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(6),
    paddingTop: hp(25),
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: hp(4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: hp(2),
  },
  punchline: {
    textAlign: 'center',
    paddingHorizontal: wp(6),
    fontSize: hp(1.8),
    color: theme.colors.textPrimary,
    marginBottom: hp(4),
  },
  datePickerWrapper: {
    width: '100%',
    marginBottom: hp(4),
  },
  datePicker: {
    width: '100%',
  },
  input: {
    width: '100%',
    height: hp(6),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(4),
    fontSize: hp(2),
    marginBottom: hp(2),
    backgroundColor: 'white',
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
  bottomButton: {
    position: 'absolute',
    bottom: hp(4),
    left: wp(6),
    right: wp(6),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  btnText: {
    color: '#FF69B4',
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
  },
});