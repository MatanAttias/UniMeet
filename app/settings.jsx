import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ScreenWrapper from '../components/ScreenWrapper';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';

const Settings = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return Alert.alert('שגיאה', 'אנא מלא את כל השדות');
    }
    if (newPassword !== confirmNewPassword) {
      return Alert.alert('שגיאה', 'הסיסמאות אינן תואמות');
    }

    setLoading(true);
    // בדיקה מול סופהבייס שהסיסמה הנוכחית נכונה
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setLoading(false);
      return Alert.alert('שגיאה', 'סיסמה נוכחית שגויה');
    }

    // עדכון סיסמה
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);
    if (error) {
      Alert.alert('שגיאה', 'לא ניתן לעדכן סיסמה');
    } else {
      Alert.alert('הצלחה', 'הסיסמה עודכנה בהצלחה');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const handleChangeEmail = async () => {
    const cleanEmail = email.trim(); // אפשר לשמור הכל - גם מיילים לא תקינים
  
    if (!cleanEmail || cleanEmail === user.email) {
      return Alert.alert('שגיאה', 'אנא הזן אימייל חדש ושונה');
    }
  
    setLoading(true);
  
    const { data, error } = await supabase
      .from('users')
      .update({ email: cleanEmail })
      .eq('id', user.id); // או 'user_id' לפי מבנה הטבלה שלך
  
    setLoading(false);
  
    if (error) {
      console.log("Custom email update error:", error);
      Alert.alert('שגיאה', error.message || 'שגיאה כללית בעדכון האימייל');
    } else {
      Alert.alert('הצלחה', 'האימייל עודכן בהצלחה');
    }
  };

  const goBack = () => router.back();

  return (
    <ScreenWrapper bg="black">
      <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={goBack}>
                <Text style={styles.backText}>חזור</Text>
              </Pressable>
            <Text style={[styles.title, { marginTop: -20, textAlign: 'center', fontSize: 24, fontWeight: 'bold' }]}>
            הגדרות
            </Text>
        <Text style={[styles.title, { marginTop: 70}]}>שנה סיסמה</Text>
        <TextInput
          placeholder="סיסמה נוכחית"
          placeholderTextColor="#aaa"
          style={styles.input}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          placeholder="סיסמה חדשה"
          placeholderTextColor="#aaa"
          style={styles.input}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          placeholder="אימות סיסמה חדשה"
          placeholderTextColor="#aaa"
          style={styles.input}
          secureTextEntry
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
        />
        <TouchableOpacity
          onPress={handleChangePassword}
          style={styles.button}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>עדכן סיסמה</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.title, { marginTop: 80 }]}>שנה אימייל</Text>
        <TextInput
          placeholder="אימייל חדש"
          placeholderTextColor="#aaa"
          style={styles.input}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity
          onPress={handleChangeEmail}
          style={styles.button}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>עדכן אימייל</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
};
export default Settings;


const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5', // רקע כללי נעים
      padding: wp(5),
      justifyContent: 'center',
    },
    title: {
      fontSize: hp(2.5),
      fontWeight: 'bold',
      color: theme.colors.dark,
      marginBottom: 10,
      textAlign: 'right',
    },
    input: {
      backgroundColor: '#fff',
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: hp(1.5),
      paddingHorizontal: wp(4),
      fontSize: hp(2),
      marginBottom: 12,
      textAlign: 'right',
      color: theme.colors.background,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: hp(1.8),
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonText: {
      color: '#fff',
      fontSize: hp(2.2),
      fontWeight: '600',
    },
    backButton: {
        position: 'absolute',
        top: hp(8),
        right: hp(4),
        backgroundColor: theme.colors.primary,
        paddingVertical: hp(1),
        paddingHorizontal: wp(3),
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        marginTop: -26,
      },
      backText: {
        color: theme.colors.black,
        fontSize: hp(2),
        fontWeight: theme.fonts.semibold,
      },
  });