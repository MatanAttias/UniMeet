import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import AppLoading from 'expo-app-loading';
import {
  useFonts,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_400Regular,
} from '@expo-google-fonts/poppins';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import { useRouter } from 'expo-router';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import { fetchPosts } from '../../services/PostService';
import PostCard from '../../components/PostCard';
import Loading from '../../components/Loading';
import { getUserData } from '../../services/userService';
import BottomBar from '../../components/BottomBar';

let limit = 0;

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('home');
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_400Regular,
  });

  useEffect(() => {
    // אם אין user, לא מנויים בכלל
    if (!user?.id) return;

    console.log('Setting up realtime channels:', { userId: user.id });

    const postChannel = supabase
      .channel('posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        handlePostEvent
      )
      .subscribe(({ status, error }) => {
        if (error) console.error('postChannel error', error);
        else console.log('postChannel status', status);
      });

    const notificationChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiverId=eq.${user.id}`,
        },
        handleNewNotification
      )
      .subscribe(({ status, error }) => {
        if (error) console.error('notificationChannel error', error);
        else console.log('notificationChannel status', status);
      });

    const commentsChannel = supabase
      .channel('comments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        handleCommentEvent
      )
      .subscribe(({ status, error }) => {
        if (error) console.error('commentsChannel error', error);
        else console.log('commentsChannel status', status);
      });

    return () => {
      supabase.removeChannel(postChannel);
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(commentsChannel);
    };
    // נסנכרן רק כש־user.id משתנה
  }, [user?.id]);

  async function handlePostEvent(payload) {
    if (payload.eventType === 'INSERT' && payload.new?.id) {
      let newPost = { ...payload.new, postLikes: [], comments: [{ count: 0 }] };
      const res = await getUserData(newPost.userId);
      newPost.user = res.success ? res.data : {};
      setPosts((prev) => [newPost, ...prev]);
    }
    if (payload.eventType === 'DELETE' && payload.old?.id) {
      setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
    }
    if (payload.eventType === 'UPDATE' && payload.new?.id) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === payload.new.id
            ? { ...p, body: payload.new.body, file: payload.new.file }
            : p
        )
      );
    }
  }

  function handleNewNotification(payload) {
    if (payload.eventType === 'INSERT' && payload.new?.id) {
      setNotificationCount((n) => n + 1);
    }
  }

  function handleCommentEvent(payload) {
    // שינוי בתגובות – רענון מונה
    refreshPosts();
  }

  const getPosts = async () => {
    if (!hasMore) return;
    limit += 10;
    const res = await fetchPosts(limit);
    if (res.success) {
      if (res.data.length === posts.length) setHasMore(false);
      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const uniq = res.data.filter((p) => !ids.has(p.id));
        return [...prev, ...uniq];
      });
    }
  };

  const refreshPosts = async () => {
    setRefreshing(true);
    const res = await fetchPosts(limit || 10);
    if (res.success) {
      limit = res.data.length;
      setHasMore(true);
      setPosts(res.data);
    }
    setRefreshing(false);
  };

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          <Text style={styles.logoPrimary}>uni</Text>
          <Text style={styles.logoAccent}>meet</Text>
        </Text>
        <View style={styles.icons}>
          <Pressable hitSlop={8} style={styles.iconButton} onPress={() => { setNotificationCount(0); router.push('notifications'); }}>
            <Icon name="heart" size={hp(3)} color={theme.colors.primary} />
            {notificationCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{notificationCount}</Text></View>}
          </Pressable>
          <Pressable hitSlop={8} style={styles.iconButton} onPress={() => router.push('Search')}>
            <Icon name="search" size={hp(3)} color={theme.colors.primary} />
          </Pressable>
          <Pressable hitSlop={8} style={styles.iconButton} onPress={() => router.push('newPost')}>
            <Icon name="plus" size={hp(3)} strokeWidth={1.5} color={theme.colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable style={[styles.tab, selectedTab === 'home' && styles.tabActive]} onPress={() => setSelectedTab('home')}>
          <Text style={[styles.tabText, selectedTab === 'home' && styles.tabTextActive]}>דף הבית</Text>
        </Pressable>
        <Pressable style={[styles.tab, selectedTab === 'matches' && styles.tabActive]} onPress={() => setSelectedTab('matches')}>
          <Text style={[styles.tabText, selectedTab === 'matches' && styles.tabTextActive]}>התאמות</Text>
        </Pressable>
      </View>

      {/* Content */}
      {selectedTab === 'home' ? (
        <FlatList
          data={posts}
          refreshing={refreshing}
          onRefresh={refreshPosts}
          onEndReached={getPosts}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Pressable style={styles.fakeInput} onPress={() => router.push('newPost')}>
              <View style={styles.fakeInputInner}>
                <Avatar uri={user?.image} size={hp(4)} rounded={theme.radius.md} />
                <Text style={styles.fakeInputText}>מה את/ה מרגיש/ה?</Text>
              </View>
            </Pressable>
          }
          keyExtractor={item => `post-${item.id}`}
          renderItem={({ item }) => <PostCard item={item} currentUser={user} router={router} />}
          ListFooterComponent={hasMore ? <Loading style={{ margin: hp(2) }} /> : <Text style={styles.noMore}>אין עוד פוסטים</Text>}
        />
      ) : (
        <View style={styles.matchesPlaceholder}>
          <Text style={styles.matchesText}>אין עדיין התאמות כדי להציג</Text>
          <Pressable style={styles.matchesButton} onPress={() => Alert.alert('Find matches')}>
            <Text style={styles.matchesButtonText}>מצא התאמות ∞</Text>
          </Pressable>
        </View>
      )}

      {/* BottomBar */}
      <BottomBar
        currentUser={user}
        selected={selectedTab}
        onTabChange={tab => {
          setSelectedTab(tab);
          if (tab === 'search') router.push('Search');
          if (tab === 'saved') router.push('savedPosts');
          if (tab === 'profile') router.push('profile');
        }}
      />
    </ScreenWrapper>
  );
}


const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(3),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  logo: {
    flexDirection: 'row',
    fontFamily: 'Poppins_700Bold',
    fontSize: hp(3.4),
    letterSpacing: 0.7,
  },
  logoPrimary: {
    color: theme.colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  logoAccent: {
    color: theme.colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: wp(3),
    padding: hp(0.5),
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: theme.colors.rose,
    borderRadius: hp(1),
    width: hp(2),
    height: hp(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: hp(1.2),
    fontFamily: 'Poppins_600SemiBold',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: wp(4),
    marginBottom: hp(1),
  },
  tab: {
    alignSelf: 'flex-start',
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(6),
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  list: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
  },
  noMore: {
    textAlign: 'center',
    color: theme.colors.textLight,
    marginVertical: hp(2),
    fontFamily: 'Poppins_400Regular',
  },
  fakeInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
    marginTop: hp(1),
    marginHorizontal: wp(0.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fakeInputInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  fakeInputText: {
    color: theme.colors.textSecondary,
    fontSize: hp(1.9),
    marginRight: wp(2),
    fontFamily: 'Poppins_400Regular',
  },
  matchesPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(6),
  },
  matchesText: {
    fontSize: hp(2.2),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: hp(3),
    fontFamily: 'Poppins_600SemiBold',
  },
  matchesButton: {
    backgroundColor: theme.colors.card,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    borderRadius: theme.radius.md,
  },
  matchesButtonText: {
    fontSize: hp(1.8),
    color: theme.colors.textPrimary,
    fontFamily: 'Poppins_700Bold',
  },
});
