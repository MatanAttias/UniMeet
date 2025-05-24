import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  fetchAttributeMatches,
  likeUser,
  friendUser,
  rejectUser,
} from '../../services/matchService';
import BottomBar from '../../components/BottomBar';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - wp(1);
const IMAGE_HEIGHT = hp(40);
const BUTTON_ROW_HEIGHT = hp(30);
const CARD_HEIGHT = IMAGE_HEIGHT + BUTTON_ROW_HEIGHT;
const BTN_SIZE = hp(4.5);

export default function Matches() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [index, setIndex] = useState(0);
  const [imgLoading, setImgLoading] = useState(false);

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
        setMatches(data || []);
        data.forEach((u) => u.image && Image.prefetch(u.image));
      })
      .catch(() => Alert.alert('שגיאה', 'לא ניתן לטעון התאמות'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    [matches[index + 1], matches[index + 2]].forEach((u) => {
      if (u?.image) Image.prefetch(u.image);
    });
  }, [index, matches]);

  const resetAndAdvance = () => {
    resetAnimation();
    setIndex((prev) => prev + 1);
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
  if (index >= matches.length || !current) {
    return (
      <ScreenWrapper>
        <Header title="התאמות" />
        <View style={styles.center}>
          <Text style={styles.noMore}>אין עוד התאמות כרגע</Text>
        </View>
        <BottomBar selected="matches" />
      </ScreenWrapper>
    );
  }

  const age = current.birth_date
    ? new Date().getFullYear() - new Date(current.birth_date).getFullYear()
    : null;

  const handleReject = async () => {
    await rejectUser(user.id, current.id);
    animateAndNext();
  };

  const handleLike = async () => {
    await likeUser(user.id, current.id);
    animateAndNext();
  };

  const handleFriend = async () => {
    await friendUser(user.id, current.id);
    animateAndNext();
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper contentContainerStyle={[styles.container, { paddingTop: hp(10) }]}>
      <Header title="התאמות" />

      <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
        <Text style={styles.nameTop}>
          {current.name}
          {age ? `, ${age}` : ''}
        </Text>

        <View style={styles.imageWrapper}>
          {imgLoading && (
            <ActivityIndicator
              style={styles.loader}
              size="large"
              color={theme.colors.primary}
            />
          )}
          <Image
            source={{ uri: current.image }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={250}
            onLoadStart={() => setImgLoading(true)}
            onLoadEnd={() => setImgLoading(false)}
          />
          <View style={styles.overlayActions}>
            <Pressable style={styles.actionBtn} onPress={handleFriend}>
              <MaterialCommunityIcons
                name="emoticon-happy-outline"
                size={hp(3.5)}
                color={theme.colors.primary}
              />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={handleLike}>
              <MaterialCommunityIcons
                name="heart"
                size={hp(3.5)}
                color={theme.colors.primary}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={styles.btn} onPress={handleReject}>
            <MaterialCommunityIcons name="close" size={hp(3.8)} color="#fff" />
          </Pressable>
        </View>
      </Animated.View>

      <BottomBar selected="matches" />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMore: {
    color: '#888',
    fontSize: hp(2.5),
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + hp(4),
    alignItems: 'center',
    marginBottom: hp(12),
  },
  nameTop: {
    color: '#fff',
    fontSize: hp(3.1),
    fontWeight: 'bold',
    marginBottom: hp(1),
    alignSelf: 'flex-start',
    paddingHorizontal: wp(2),
  },
  imageWrapper: {
    width: '99%',
    height: IMAGE_HEIGHT,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    top: IMAGE_HEIGHT / 2 - hp(2),
    left: CARD_WIDTH / 2 - hp(2),
    zIndex: 1,
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
    borderRadius: BTN_SIZE / 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp(1),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
    height: BUTTON_ROW_HEIGHT,
    alignItems: 'center',
    marginTop: hp(10),
    paddingHorizontal: wp(2),
  },
  btn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
