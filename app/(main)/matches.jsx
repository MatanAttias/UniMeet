import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import {
  fetchAttributeMatches,
  likeUser,
  friendUser,
  rejectUser,
} from '../../services/matchService';
import BottomBar from '../../components/BottomBar';
import MatchUserProfile from '../../components/MatchUserProfile';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

export default function Matches() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [index, setIndex] = useState(0);
  const [showFullProfile, setShowFullProfile] = useState(false);

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    fetchAttributeMatches(user.id)
      .then((data) => {
        console.log('📊 Loaded matches:', data?.length || 0);
        setMatches(data || []);
        data.forEach((u) => u.image && Image.prefetch(u.image));
      })
      .catch((error) => {
        console.error('❌ Error loading matches:', error);
        Alert.alert('שגיאה', 'לא ניתן לטעון התאמות');
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    [matches[index + 1], matches[index + 2]].forEach((u) => {
      if (u?.image) Image.prefetch(u.image);
    });
  }, [index, matches]);

  const resetAndAdvance = () => {
    translateX.value = 0;
    opacity.value = 1;
    setIndex((prev) => prev + 1);
    setShowFullProfile(false); // חזרה לתצוגת תמונה במשתמש הבא
  };

  const animateAndNext = () => {
    translateX.value = withTiming(-wp(100), { duration: 300 }, () => {
      opacity.value = 0;
      runOnJS(resetAndAdvance)();
    });
  };

  // פונקציה לניווט לצ'אט עם הנתונים הנכונים
  const navigateToChat = (chatId, targetUser) => {
    console.log('🚀 Navigating to chat:', { chatId, userName: targetUser.name });
    
    const chatData = {
      id: chatId,
      name: targetUser.name,
      image: targetUser.image,
    };
    
    router.push({
      pathname: `/privateChat/${chatId}`,
      params: {
        chat: JSON.stringify(chatData),
      },
    });
  };

  const current = matches[index];
  
  if (loading) {
    return (
      <ScreenWrapper>
        <Header title="התאמות" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>טוען התאמות...</Text>
        </View>
        <BottomBar selected="matches" />
      </ScreenWrapper>
    );
  }
  
  if (!current) {
    return (
      <ScreenWrapper>
        <Header title="התאמות" />
        <View style={styles.center}>
          <Text style={styles.noMore}>אין עוד התאמות כרגע</Text>
          <Pressable 
            style={styles.refreshButton} 
            onPress={() => {
              setIndex(0);
              setLoading(true);
              fetchAttributeMatches(user.id)
                .then((data) => setMatches(data || []))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.refreshText}>רענן התאמות</Text>
          </Pressable>
        </View>
        <BottomBar selected="matches" />
      </ScreenWrapper>
    );
  }

  const handleReject = async () => {
    console.log('❌ Rejecting user:', current.name);
    try {
      await rejectUser(user.id, current.id);
      animateAndNext();
    } catch (error) {
      console.error('Error rejecting user:', error);
      Alert.alert('שגיאה', 'לא ניתן לדחות את המשתמש');
    }
  };

  const handleFriend = async () => {
    console.log('😊 Adding as friend:', current.name);
    try {
      const result = await friendUser(user.id, current.id);
      if (result?.success && result?.chatId) {
        // Immediate friendship match → open chat
        Alert.alert(
          '👫 חברות נוצרה!',
          `נוצרה חברות עם ${current.name}!\nרוצה לפתוח את הצ'אט?`,
          [
            {
              text: 'אחר כך',
              style: 'cancel',
              onPress: () => animateAndNext()
            },
            {
              text: 'פתח צ\'אט',
              onPress: () => navigateToChat(result.chatId, current)
            }
          ]
        );
      } else {
        // Interaction recorded, no match yet
        animateAndNext();
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('שגיאה', 'לא ניתן להוסיף כחבר');
      animateAndNext();
    }
  };

  const handleLike = async () => {
    console.log('❤️ Liking user:', current.name);
    
    try {
      const result = await likeUser(user.id, current.id);
      if (result?.matched && result?.chatId) {
        // Romantic match → open chat
        Alert.alert(
          '🎉 זה התאמה!',
          `יצרת התאמה עם ${current.name}!\nרוצה לפתוח את הצ'אט?`,
          [
            {
              text: 'אחר כך',
              style: 'cancel',
              onPress: () => animateAndNext()
            },
            {
              text: 'פתח צ\'אט',
              onPress: () => navigateToChat(result.chatId, current)
            }
          ]
        );
      } else {
        // Like recorded, no match yet
        animateAndNext();
      }
    } catch (error) {
      console.error('❌ Error in handleLike:', error);
      Alert.alert('שגיאה', 'לא ניתן לבצע לייק: ' + error.message);
      animateAndNext();
    }
  };

  const toggleProfileView = () => {
    setShowFullProfile(!showFullProfile);
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <Header title="התאמות" />
      
      <View style={styles.container}>
        <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
          <MatchUserProfile
            user={current}
            onLike={handleLike}
            onFriend={handleFriend}
            onReject={handleReject}
            showFullProfile={showFullProfile}
            onToggleView={toggleProfileView}
          />
        </Animated.View>

        {/* מידע נוסף על ההתאמה */}
        <View style={styles.matchInfo}>
          <Text style={styles.matchCounter}>
            {index + 1} מתוך {matches.length}
          </Text>
          {!showFullProfile && (
            <Text style={styles.tapHint}>
              לחץ על התמונה לפרופיל מלא
            </Text>
          )}
        </View>
      </View>

      <BottomBar selected="matches" />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(2),
    marginTop: -700,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(4),
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: hp(1.8),
    marginTop: hp(2),
    textAlign: 'center',
  },
  noMore: {
    color: theme.colors.textSecondary,
    fontSize: hp(2.5),
    textAlign: 'center',
    marginBottom: hp(3),
    writingDirection: 'rtl',
  },
  refreshButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
  },
  refreshText: {
    color: 'white',
    fontSize: hp(2),
    fontWeight: '600',
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  matchInfo: {
    alignItems: 'center',
    paddingVertical: hp(1),
    marginBottom: hp(2),
  },
  matchCounter: {
    color: theme.colors.textSecondary,
    fontSize: hp(1.6),
    fontWeight: '500',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  tapHint: {
    color: theme.colors.textLight,
    fontSize: hp(1.4),
    marginTop: 4,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});