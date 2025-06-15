import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MotiView } from 'moti';
import Avatar from './Avatar';
import Icon from '../assets/icons';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';

// קומפוננטת שורת מידע (אייקון + טקסט)
const InfoItem = ({ icon, text }) => (
  <View style={styles.infoItemContainer}>
    <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primary} />
    <Text style={styles.infoItemText}>{text}</Text>
  </View>
);

// קומפוננטת רשימת תגיות
const TagList = ({ label, tags }) => {
  if (!tags?.length) return null;
  return (
    <View style={styles.tagSection}>
      <Text style={styles.subSectionTitle}>{label}</Text>
      <View style={styles.tagList}>
        {tags.map((tag, idx) => (
          <View key={idx.toString()} style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function MatchUserProfile({
  user,
  onLike,
  onFriend,
  onReject,
  showFullProfile = false,
  onToggleView,
}) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

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
    await newSound.playAsync();
    setIsPlaying(true);

    newSound.setOnPlaybackStatusUpdate((status) => {
      setPlaybackStatus(status);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackStatus(null);
        newSound.unloadAsync();
        setSound(null);
      }
    });
  };

  const getFormattedTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // פונקציה להתאמת הסטטוס לפי מין
  const getStatusText = (status, gender) => {
    if (!status) return status;
    
    if (status.toLowerCase().includes('רווק')) {
      return gender === 'נקבה' ? 'רווקה' : 'רווק';
    }
    if (status.toLowerCase().includes('נשוי')) {
      return gender === 'נקבה' ? 'נשואה' : 'נשוי';
    }
    if (status.toLowerCase().includes('גרוש')) {
      return gender === 'נקבה' ? 'גרושה' : 'גרוש';
    }
    if (status.toLowerCase().includes('אלמן')) {
      return gender === 'נקבה' ? 'אלמנה' : 'אלמן';
    }
    
    return status; // החזר את הסטטוס המקורי אם לא נמצא התאמה
  };

  const age = calculateAge(user.birth_date);

  // תצוגת תמונה בלבד (כמו שהיה קודם)
  if (!showFullProfile) {
    return (
      <View style={styles.imageOnlyContainer}>
        <Text style={styles.nameTop}>
          {user.name}
          {age ? `, ${age}` : ''}
        </Text>

        <Pressable style={styles.imageWrapper} onPress={onToggleView}>
          <Image
            source={{ uri: user.image }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={250}
          />

          {/* אייקון לפתיחת פרופיל מלא */}
          <View style={styles.expandIcon}>
            <MaterialCommunityIcons
              name="account-details"
              size={24}
              color="white"
            />
          </View>

          <View style={styles.overlayActions}>
            <Pressable style={styles.actionBtn} onPress={() => onFriend(user.id)}>
              <MaterialCommunityIcons
                name="emoticon-happy-outline"
                size={hp(3.5)}
                color={theme.colors.primary}
              />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => onLike(user.id)}>
              <MaterialCommunityIcons
                name="heart"
                size={hp(3.5)}
                color={theme.colors.primary}
              />
            </Pressable>
          </View>
        </Pressable>

        <View style={styles.buttonRow}>
          <Pressable style={styles.btn} onPress={() => onReject(user.id)}>
            <MaterialCommunityIcons name="close" size={hp(3.8)} color="#fff" />
          </Pressable>
        </View>
      </View>
    );
  }

  // תצוגת פרופיל מלא
  return (
    <ScrollView style={styles.fullProfileContainer} showsVerticalScrollIndicator={false}>
      {/* כפתור חזרה לתצוגת תמונה */}
      <Pressable style={styles.backToImageBtn} onPress={onToggleView}>
        <MaterialCommunityIcons name="arrow-right" size={24} color={theme.colors.primary} />
        <Text style={styles.backToImageText}>חזור לתמונה</Text>
      </Pressable>

      {/* Avatar + Name */}
      <View style={styles.avatarContainer}>
        <Avatar uri={user?.image} size={hp(12)} rounded={theme.radius.xxl * 1.4} />
      </View>
      <Text style={styles.userName}>
        {user?.fullName || user?.name || '—'}
        {age ? `, ${age}` : ''}
      </Text>

      {/* פרטי בסיס */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.infoBox}
      >
        <View style={styles.row}>
          {user.birth_date && <InfoItem icon="cake-variant" text={age} />}
          {user.gender && <InfoItem icon="gender-male-female" text={user.gender} />}
          {user.status && <InfoItem icon="heart" text={getStatusText(user.status, user.gender)} />}
        </View>

        {user.connectionTypes && (
          <View style={[styles.inlineItem, { flexDirection: 'row-reverse', marginTop: 8 }]}>
            <MaterialCommunityIcons name="magnify-plus-outline" size={28} color={theme.colors.primary} />
            <Text style={styles.inlineText}>{user.connectionTypes}</Text>
          </View>
        )}
      
        {/* הצגת preferredMatch מתחת ל connectionTypes */}
        {user.preferredMatch && (
          <View style={[styles.inlineItem, { flexDirection: 'row-reverse', marginTop: 8 }]}>
            <MaterialCommunityIcons name="account-heart" size={28} color={theme.colors.primary} />
            <Text style={styles.inlineText}>{user.preferredMatch}</Text>
          </View>
        )}
      </MotiView>

      {/* הקדמה אישית */}
      {user.introduction && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.infoBox}
        >
          <View style={styles.introductionContainer}>
            <MaterialCommunityIcons
              name="comment-text-outline"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.introductionText}>{user.introduction}</Text>
          </View>
        </MotiView>
      )}

      {/* תגיות */}
      {(user.traits?.length > 0 ||
        user.identities?.length > 0 ||
        user.supportNeeds?.length > 0) && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.infoBox}
        >
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="brain"
              size={20}
              color="white"
              style={{ marginStart: 6 }}
            />
            <Text style={styles.sectionTitle}>המאפיינים הייחודיים</Text>
          </View>

          <TagList label="תכונות" tags={user.traits} />
          <TagList label="זהויות" tags={user.identities} />
          <TagList label="צרכים" tags={user.supportNeeds} />
        </MotiView>
      )}

      {/* אודיו */}
      {user.audio && (
        <View style={styles.audioContainer}>
          {user.prompt && <Text style={styles.audioPrompt}>{user.prompt}</Text>}

          <TouchableOpacity style={styles.audioPlayBtn} onPress={playSound}>
            <Icon name={isPlaying ? 'pause' : 'play'} size={28} color="white" />
          </TouchableOpacity>

          {playbackStatus && (
            <View style={styles.progressWrapper}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${
                        (playbackStatus.positionMillis / playbackStatus.durationMillis) * 100
                      }%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.timeText}>
                {getFormattedTime(playbackStatus.positionMillis)} /{' '}
                {getFormattedTime(playbackStatus.durationMillis)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* כפתורי פעולה בתחתית */}
      <View style={styles.fullProfileActions}>
        <Pressable
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => onReject(user.id)}
        >
          <MaterialCommunityIcons name="close" size={28} color="white" />
          <Text style={styles.actionButtonText}>דלג</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.friendButton]}
          onPress={() => onFriend(user.id)}
        >
          <MaterialCommunityIcons
            name="emoticon-happy-outline"
            size={28}
            color="white"
          />
          <Text style={styles.actionButtonText}>חבר</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => onLike(user.id)}
        >
          <MaterialCommunityIcons name="heart" size={28} color="white" />
          <Text style={styles.actionButtonText}>לייק</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // תצוגת תמונה בלבד
  imageOnlyContainer: {
    width: wp(95),
    alignItems: 'center',
  },
  nameTop: {
    color: '#fff',
    fontSize: hp(3.1),
    fontWeight: 'bold',
    marginBottom: hp(1),
    alignSelf: 'flex-end', // שינוי מ-flex-start ל-flex-end
    paddingHorizontal: wp(2),
    textAlign: 'right', // הוספה
    writingDirection: 'rtl', // הוספה
  },
  imageWrapper: {
    width: '99%',
    height: hp(40),
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  expandIcon: {
    position: 'absolute',
    top: hp(1),
    left: wp(3),
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  overlayActions: {
    position: 'absolute',
    bottom: hp(1.2),
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp(1),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    alignItems: 'center',
    marginTop: hp(2),
    paddingHorizontal: wp(2),
  },
  btn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // תצוגת פרופיל מלא
  fullProfileContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: wp(4),
  },
  backToImageBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: hp(2),
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
  },
  backToImageText: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
    marginRight: wp(1),
    textAlign: 'right',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: hp(2),
  },
  userName: {
    fontSize: hp(3),
    fontWeight: '500',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: hp(2),
    writingDirection: 'rtl',
  },
  infoBox: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    marginBottom: hp(2),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    marginTop: hp(1),
  },
  // סטיילים חדשים ל-InfoItem
  infoItemContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginHorizontal: wp(2),
    marginBottom: hp(0.5),
  },
  infoItemText: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    marginRight: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: 'bold',
  },
  inlineItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginHorizontal: wp(2),
    marginBottom: hp(0.5),
  },
  
  inlineText: {
    color: theme.colors.textPrimary,
    fontSize: hp(2),
    marginRight: wp(1),
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  introductionContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    width: '100%',
  },
  introductionText: {
    color: theme.colors.textPrimary,
    fontSize: hp(2),
    marginRight: wp(2),
    textAlign: 'right',
    writingDirection: 'rtl',
    flex: 1,
    lineHeight: hp(2.8),
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: hp(2.2),
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tagSection: {
    marginBottom: hp(1),
  },
  subSectionTitle: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.5),
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tagList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    rowGap: hp(0.5),
    columnGap: wp(1),
  },
  tagPill: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
    borderRadius: theme.radius.md,
  },
  tagText: {
    color: '#fff',
    fontSize: hp(1.6),
    textAlign: 'center',
  },
  audioContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: hp(2),
    marginBottom: hp(2),
    alignItems: 'center',
  },
  audioPrompt: {
    fontSize: hp(2),
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: hp(1),
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  audioPlayBtn: {
    backgroundColor: theme.colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressWrapper: {
    marginTop: hp(1),
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  timeText: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  fullProfileActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: hp(3),
    paddingBottom: hp(6),
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: hp(1.3),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.lg,
    minWidth: wp(18),
  },
  actionButtonText: {
    color: 'white',
    fontSize: hp(1.6),
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  rejectButton: {
    backgroundColor: '#666',
  },
  friendButton: {
    backgroundColor: theme.colors.primary,
  },
  likeButton: {
    backgroundColor: theme.colors.rose,
  },
});