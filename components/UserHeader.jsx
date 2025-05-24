// components/UserHeader.jsx

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { MotiView } from 'moti';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Avatar from './Avatar';
import Icon from '../assets/icons';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';

export default function UserHeader({ user, router, onLogout }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);
  const isCurrentUser = !!onLogout; // או prop אחר אם יש
  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const calculateAge = birthDate => {
    if (!birthDate) return null;
    const today = new Date(), b = new Date(birthDate);
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    return age;
  };

  const playSound = async () => {
    if (!user.audio) return;
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPlaybackStatus(null);
      return;
    }
    const { sound: newSound } = await Audio.Sound.createAsync({ uri: user.audio });
    setSound(newSound);
    setIsPlaying(true);
    await newSound.playAsync();
    newSound.setOnPlaybackStatusUpdate(status => {
      setPlaybackStatus(status);
      if (status.didJustFinish) {
        newSound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }
    });
  };

  const renderTagList = (label, tags) => {
    if (!tags?.length) return null;
    return (
      <View style={{ marginBottom: hp(1.5) }}>
        <Text style={styles.subSectionTitle}>{label}</Text>
        <View style={styles.tagList}>
          {tags.map((t, i) => (
            <View key={i} style={styles.tagPill}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* כותרת + עריכה */}
      <View style={styles.headerRow}>
  <Text style={styles.screenTitle}>
    {isCurrentUser ? 'הפרופיל שלי' : user.name}
  </Text>

  {isCurrentUser && (
    <>
      <Pressable onPress={() => router.push('editProfile')}>
        <Icon name="edit" size={24} color={theme.colors.primary} />
      </Pressable>
      <Pressable onPress={onLogout} style={styles.logoutIcon}>
        <MaterialCommunityIcons name="logout" size={24} color={theme.colors.rose} />
      </Pressable>
    </>
  )}
</View>

      {/* Avatar + שם + גיל */}
      <View style={styles.avatarContainer}>
        <Avatar uri={user.image} size={hp(14)} rounded={theme.radius.xl} />
        <Text style={styles.userName}>
          {user.name}
          {user.birth_date ? `, ${calculateAge(user.birth_date)}` : ''}
        </Text>
      </View>

      {/* מידע בסיסי */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.infoBox}
      >
        <View style={styles.row}>
          {user.gender && (
            <View style={styles.inlineItem}>
              <MaterialCommunityIcons name="gender-male-female" size={20} color={theme.colors.primary} />
              <Text style={styles.inlineText}>{user.gender}</Text>
            </View>
          )}
          {user.status && (
            <View style={styles.inlineItem}>
              <MaterialCommunityIcons name="heart" size={20} color={theme.colors.primary} />
              <Text style={styles.inlineText}>{user.status}</Text>
            </View>
          )}
        </View>
        {user.introduction && (
          <View style={styles.inlineItem}>
            <MaterialCommunityIcons name="comment-text-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.inlineText, { flex: 1 }]}>{user.introduction}</Text>
          </View>
        )}
      </MotiView>

      {/* תגים */}
      {renderTagList('תכונות', user.traits)}
      {renderTagList('זהויות', user.identities)}
      {renderTagList('צרכים', user.supportNeeds)}

      {/* Audio */}
      {user.audio && (
        <View style={styles.audioContainer}>
          <Pressable style={styles.audioBtn} onPress={playSound}>
            <Icon name={isPlaying ? 'pause' : 'play'} size={28} color="white" />
          </Pressable>
          {playbackStatus && (
            <Text style={styles.timeText}>
              {Math.floor(playbackStatus.positionMillis/1000)} /{' '}
              {Math.floor(playbackStatus.durationMillis/1000)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.background,
    paddingBottom: hp(2),
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  screenTitle: {
    fontSize: hp(3),
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  logoutIcon: {
    marginLeft: wp(2),
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: hp(2),
  },
  userName: {
    fontSize: hp(2.8),
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginTop: hp(1),
  },
  infoBox: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(1.5),
    marginBottom: hp(2),
  },
  row: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginBottom: hp(1),
  },
  inlineItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginVertical: hp(0.5),
    marginHorizontal: wp(2),
  },
  inlineText: {
    color: theme.colors.textPrimary,
    fontSize: hp(2),
    marginLeft: wp(1),
  },
  subSectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: hp(2),
    fontWeight: '600',
    marginBottom: hp(0.5),
    textAlign: 'right',
  },
  tagList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginBottom: hp(2),
  },
  tagPill: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
    margin: wp(0.5),
  },
  tagText: {
    color: '#fff',
    fontSize: hp(1.8),
  },
  audioContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(1),
  },
  audioBtn: {
    padding: hp(1),
    backgroundColor: theme.colors.primary,
    borderRadius: hp(3),
    marginLeft: wp(2),
  },
  timeText: {
    color: theme.colors.textSecondary,
    fontSize: hp(1.8),
  },
});
