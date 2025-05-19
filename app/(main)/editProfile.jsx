import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import Input from '../../components/input';
import Button from '../../components/Button';
import Icon from '../../assets/icons';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../constants/helpers/common';
import { supabase } from '../../lib/supabase';
import { updateUser } from '../../services/userService';
import { uploadFile } from '../../services/imageService';
import { useAuth } from '../../contexts/AuthContext';

export default function EditProfile() {
  const { user: currentUser, setUserData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    address: '',
    bio: '',
    image: ''
  });

  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name || '',
        phoneNumber: currentUser.phoneNumber || '',
        email: currentUser.email || '',
        address: currentUser.address || '',
        bio: currentUser.bio || '',
        image: currentUser.image || ''
      });
    }
  }, [currentUser]);

  const onPickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('שגיאה', 'נדרש אישור לגישה לגלריה');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (asset?.uri) {
        setForm(f => ({ ...f, image: asset.uri }));
      }
    } catch (e) {
      console.error('Image picker error:', e);
      Alert.alert('שגיאה', e.message || 'אירעה תקלה בעת בחירת תמונה');
    }
  };

  const onSubmit = async () => {
    setLoading(true);
    try {
      let imageUrl = form.image;

      if (form.image && form.image.startsWith('file://')) {
        const uploadRes = await uploadFile('profiles', form.image, true);
        if (!uploadRes.success) throw new Error('העלאת התמונה נכשלה');
        imageUrl = uploadRes.data;

        const { error: imgErr } = await supabase
          .from('users')
          .update({ image: imageUrl })
          .eq('id', currentUser.id);
        if (imgErr) throw imgErr;
      }

      const { success, error } = await updateUser(currentUser.id, {
        ...form,
        image: imageUrl
      });
      if (!success) throw new Error(error || 'עדכון המשתמש נכשל');

      setUserData(u => ({ ...u, ...form, image: imageUrl }));
      Alert.alert('הצלחה', 'הפרופיל עודכן בהצלחה');
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('שגיאה', e.message || 'שגיאה בעדכון הפרופיל');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ gap: hp(3) }}>
          <Header title="עריכת פרופיל" />

          <View style={styles.avatarContainer}>
            <Avatar
              uri={form.image}
              size={hp(12)}
              rounded={hp(6)}
            />
            <Pressable style={styles.cameraIcon} onPress={onPickImage}>
              <Icon name="camera" size={24} strokeWidth={2} color={theme.colors.textPrimary} />
            </Pressable>
          </View>

          <Text style={styles.subtext}>אנא מלא/י את פרטי הפרופיל שלך</Text>

          <Input
            icon={<Icon name="user" size={24} color={theme.colors.textLight} />}
            placeholder="הכנס/י את שמך"
            value={form.name}
            onChangeText={v => setForm(f => ({ ...f, name: v }))}
          />
          <Input
            icon={<Icon name="call" size={24} color={theme.colors.textLight} />}
            placeholder="הכנס/י טלפון"
            value={form.phoneNumber}
            onChangeText={v => setForm(f => ({ ...f, phoneNumber: v }))}
          />
          <Input
            icon={<Icon name="mail" size={24} color={theme.colors.textLight} />}
            placeholder="הכנס/י אימייל"
            value={form.email}
            onChangeText={v => setForm(f => ({ ...f, email: v }))}
          />
          <Input
            icon={<Icon name="location" size={24} color={theme.colors.textLight} />}
            placeholder="הכנס/י כתובת"
            value={form.address}
            onChangeText={v => setForm(f => ({ ...f, address: v }))}
          />
          <Input
            placeholder="הכנס/י ביוגרפיה"
            value={form.bio}
            multiline
            containerStyle={styles.bio}
            onChangeText={v => setForm(f => ({ ...f, bio: v }))}
          />

          <Button title="עדכון" loading={loading} onPress={onSubmit} />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
    paddingTop: hp(2),
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: hp(2),
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: wp(10),
    backgroundColor: theme.colors.card,
    padding: hp(1),
    borderRadius: theme.radius.xl,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  subtext: {
    color: theme.colors.textLight,
    fontSize: hp(1.6),
    textAlign: 'center',
    marginBottom: hp(2),
  },
  bio: {
    height: hp(12),
    paddingVertical: hp(1.2),
  },
});
