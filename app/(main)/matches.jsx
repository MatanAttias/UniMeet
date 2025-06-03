// app/(main)/matches.jsx - Updated Hiki Style with Profile Components

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import { MotiView } from 'moti';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon from '../../assets/icons';
import {
  fetchSmartMatches,
  processInteraction,
} from '../../services/matchService';
import BottomBar from '../../components/BottomBar';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Matches() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [index, setIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('profile');
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    loadMatches();
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const loadMatches = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await fetchSmartMatches(user.id);
      setMatches(data || []);
      data.forEach((u) => u.image && Image.prefetch(u.image));
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן לטעון התאמות');
    } finally {
      setLoading(false);
    }
  };

  const resetAndAdvance = () => {
    resetAnimation();
    setIndex((prev) => prev + 1);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  };

  const animateAndNext = () => {
    translateX.value = withTiming(-SCREEN_WIDTH, { duration: 300 }, () => {
      opacity.value = 0;
      runOnJS(resetAndAdvance)();
    });
  };

  const resetAnimation = () => {
    translateX.value = 0;
    opacity.value = 1;
  };

  const current = matches[index];

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

  const handleReject = async () => {
    await processInteraction(user.id, current.id, 'reject');
    animateAndNext();
  };

  const handleLike = async () => {
    const result = await processInteraction(user.id, current.id, 'like');
    if (result?.matched) {
      Alert.alert(
        '🎉 It\'s a Match!',
        `את/ה ו${current.name} אהבתם אחד את השני!`,
        [
          { text: 'המשך לגלות', style: 'cancel' },
          { text: 'התחל צ\'אט', onPress: () => {/* Navigate to chat */} }
        ]
      );
    }
    animateAndNext();
  };

  const handleFriend = async () => {
    await processInteraction(user.id, current.id, 'friend');
    animateAndNext();
  };

  const playSound = async () => {
    if (!current.audio) return;

    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPlaybackStatus(null);
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync({ uri: current.audio });
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

  const renderTagList = (tags) => {
    if (!tags || tags.length === 0) return null;
    return (
      <View style={styles.tagList}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>מחפש התאמות עבורך...</Text>
        </View>
        <BottomBar selected="matches" />
      </SafeAreaView>
    );
  }

  if (!current || index >= matches.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <MaterialCommunityIcons 
            name="heart-broken" 
            size={hp(8)} 
            color={theme.colors.textLight} 
          />
          <Text style={styles.noMore}>אין עוד התאמות כרגע</Text>
          <Text style={styles.noMoreSubtext}>חזור מאוחר יותר למשתמשים חדשים</Text>
        </View>
        <BottomBar selected="matches" />
      </SafeAreaView>
    );
  }

  const age = calculateAge(current.birth_date);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView 
        style={[styles.scrollContainer, animatedCardStyle]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with name */}
        <View style={styles.header}>
          <Text style={styles.nameHeader}>{current.name}</Text>
        </View>

        {/* Main Image Section */}
        <View style={styles.imageSection}>
          <Image
            source={{ uri: current.image }}
            style={styles.mainImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          
          {/* Floating Action Buttons */}
          <View style={styles.floatingActions}>
            <Pressable style={styles.floatingBtn} onPress={handleReject}>
              <MaterialCommunityIcons name="close" size={28} color="#fff" />
            </Pressable>
            <Pressable style={styles.floatingBtn} onPress={handleFriend}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={28} color="#fff" />
            </Pressable>
            <Pressable style={[styles.floatingBtn, styles.likeBtn]} onPress={handleLike}>
              <MaterialCommunityIcons name="heart" size={28} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Profile/Posts Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable 
            style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
              פרופיל
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              פוסטים
            </Text>
          </Pressable>
        </View>

        {/* Profile Content */}
        <View style={styles.profileContent}>
          {/* Basic Info Card */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.infoCard}
          >
            <View style={styles.infoRow}>
              {age && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>{age}</Text>
                  <MaterialCommunityIcons name="cake-variant" size={20} color={theme.colors.primary} />
                </View>
              )}
              {current.gender && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>{current.gender}</Text>
                  <MaterialCommunityIcons name="gender-male-female" size={20} color={theme.colors.primary} />
                </View>
              )}
              {current.status && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>{current.status}</Text>
                  <MaterialCommunityIcons name="heart" size={20} color={theme.colors.primary} />
                </View>
              )}
            </View>

            <View style={styles.preferenceRow}>
              {current.connectionTypes && (
                <Text style={styles.preferenceText}>
                  <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.primary} />
                  {' ' + current.connectionTypes}
                </Text>
              )}
              {current.preferredMatch && (
                <Text style={styles.preferenceText}>
                  <MaterialCommunityIcons name="account-heart" size={18} color={theme.colors.primary} />
                  {' ' + current.preferredMatch}
                </Text>
              )}
            </View>
          </MotiView>

          {/* Introduction */}
          {current.introduction && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 100 }}
              style={styles.introCard}
            >
              <Text style={styles.sectionTitle}>היי (:)</Text>
              <Text style={styles.introText}>{current.introduction}</Text>
            </MotiView>
          )}

          {/* Audio Prompt */}
          {current.audio && current.prompt && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 200 }}
              style={styles.audioCard}
            >
              <Text style={styles.promptText}>{current.prompt}</Text>
              <Pressable style={styles.audioPlayBtn} onPress={playSound}>
                <Icon name={isPlaying ? 'pause' : 'play'} size={24} color="white" />
              </Pressable>
              {playbackStatus && (
                <Text style={styles.audioTime}>
                  {getFormattedTime(playbackStatus.positionMillis)} / {getFormattedTime(playbackStatus.durationMillis)}
                </Text>
              )}
            </MotiView>
          )}

          {/* Traits Section */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 300 }}
            style={styles.traitsCard}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="brain" size={24} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>המאפיינים הייחודיים שלי</Text>
            </View>

            {current.traits?.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>תכונות</Text>
                {renderTagList(current.traits)}
              </View>
            )}

            {current.identities?.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>זהויות</Text>
                {renderTagList(current.identities)}
              </View>
            )}

            {current.supportNeeds?.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>צרכים</Text>
                {renderTagList(current.supportNeeds)}
              </View>
            )}
          </MotiView>

          {/* Match Score */}
          {current.matchScore && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400, delay: 400 }}
              style={styles.matchScoreCard}
            >
              <Text style={styles.matchScoreTitle}>אחוז התאמה</Text>
              <Text style={styles.matchScoreValue}>{current.matchScore}%</Text>
            </MotiView>
          )}
        </View>
      </Animated.ScrollView>

      <BottomBar selected="matches" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  loadingText: {
    color: theme.colors.textLight,
    fontSize: hp(2),
    marginTop: hp(2),
    textAlign: 'center',
  },
  noMore: {
    color: theme.colors.textPrimary,
    fontSize: hp(2.5),
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: hp(2),
  },
  noMoreSubtext: {
    color: theme.colors.textLight,
    fontSize: hp(1.8),
    textAlign: 'center',
    marginTop: hp(1),
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    paddingBottom: hp(1),
  },
  nameHeader: {
    color: theme.colors.textPrimary,
    fontSize: hp(4),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageSection: {
    height: SCREEN_HEIGHT * 0.6,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  floatingActions: {
    position: 'absolute',
    bottom: hp(3),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(4),
  },
  floatingBtn: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBtn: {
    backgroundColor: theme.colors.primary,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    paddingBottom: hp(1.5),
    marginLeft: wp(6),
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: hp(2),
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  profileContent: {
    paddingHorizontal: wp(6),
    paddingBottom: hp(10),
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(2),
    marginTop: hp(2),
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    marginBottom: hp(1.5),
  },
  infoItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: wp(1),
  },
  infoLabel: {
    color: theme.colors.textPrimary,
    fontSize: hp(2),
    fontWeight: '600',
  },
  preferenceRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  preferenceText: {
    color: theme.colors.textPrimary,
    fontSize: hp(1.8),
  },
  introCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(2),
    marginTop: hp(2),
  },
  introText: {
    color: theme.colors.textPrimary,
    fontSize: hp(2),
    lineHeight: hp(2.8),
    textAlign: 'right',
  },
  audioCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(2),
    marginTop: hp(2),
    alignItems: 'center',
  },
  promptText: {
    color: theme.colors.textPrimary,
    fontSize: hp(2),
    textAlign: 'center',
    marginBottom: hp(1.5),
  },
  audioPlayBtn: {
    backgroundColor: theme.colors.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioTime: {
    color: theme.colors.textLight,
    fontSize: hp(1.6),
    marginTop: hp(1),
  },
  traitsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(2),
    marginTop: hp(2),
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: wp(2),
    marginBottom: hp(2),
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: hp(2.2),
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: hp(2),
  },
  categoryTitle: {
    color: theme.colors.textSecondary,
    fontSize: hp(1.8),
    marginBottom: hp(1),
    textAlign: 'right',
  },
  tagList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  tagPill: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
  },
  tagText: {
    color: '#fff',
    fontSize: hp(1.6),
  },
  matchScoreCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: hp(2),
    marginTop: hp(2),
    alignItems: 'center',
  },
  matchScoreTitle: {
    color: theme.colors.textSecondary,
    fontSize: hp(1.8),
  },
  matchScoreValue: {
    color: theme.colors.primary,
    fontSize: hp(4),
    fontWeight: 'bold',
  },
});