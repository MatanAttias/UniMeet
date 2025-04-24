import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
  } from 'react-native';
  import React, { useEffect, useState } from 'react';
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
  
  let limit = 0;
  
  export default function Home() {
    const { user } = useAuth();
    const router = useRouter();
  
    const [selectedTab, setSelectedTab] = useState('home');
    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
  
    useEffect(() => {
      const postChannel = supabase
        .channel('posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePostEvent)
        .subscribe();
  
      const notificationChannel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `receiverId=eq.${user.id}` },
          handleNewNotification
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(postChannel);
        supabase.removeChannel(notificationChannel);
      };
    }, []);
  
    const handlePostEvent = async (payload) => {
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
            p.id === payload.new.id ? { ...p, body: payload.new.body, file: payload.new.file } : p
          )
        );
      }
    };
  
    const handleNewNotification = (payload) => {
      if (payload.eventType === 'INSERT' && payload.new?.id) {
        setNotificationCount((n) => n + 1);
      }
    };
  
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
      const res = await fetchPosts(10);
      if (res.success) {
        limit = res.data.length;
        setHasMore(true);
        setPosts(res.data);
      }
      setRefreshing(false);
    };
  
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={styles.header}>
          <Text style={styles.title}>UniMeet</Text>
          <View style={styles.icons}>
            <Pressable onPress={() => { setNotificationCount(0); router.push('notifications'); }}>
              <Icon name="heart" size={hp(4)} strokeWidth={2} color={theme.colors.primary} />
              {notificationCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationCount}</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => router.push('newPost')}>
              <Icon name="plus" size={hp(4)} strokeWidth={2} color={theme.colors.primary} />
            </Pressable>
            <Pressable onPress={() => router.push('profile')}>
              <Avatar
                uri={user?.image}
                size={hp(5)}
                rounded={theme.radius.sm}
                style={styles.avatar}
              />
            </Pressable>
          </View>
        </View>
  
        <View style={styles.tabsContainer}>
          <Pressable style={[styles.tab, selectedTab === 'home' && styles.tabActive]} onPress={() => setSelectedTab('home')}>
            <Text style={[styles.tabText, selectedTab === 'home' && styles.tabTextActive]}>דף הבית</Text>
          </Pressable>
          <Pressable style={[styles.tab, selectedTab === 'matches' && styles.tabActive]} onPress={() => setSelectedTab('matches')}>
            <Text style={[styles.tabText, selectedTab === 'matches' && styles.tabTextActive]}>התאמות</Text>
          </Pressable>
        </View>
  
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
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: wp(2) }}>
                    <Avatar uri={user?.image} size={hp(4)} rounded={theme.radius.md} />
                    <Text style={styles.fakeInputText}>מה אתה מרגיש?</Text>
                  </View>
                </Pressable>
              }              
            keyExtractor={(item) => `post-${item.id}`}
            renderItem={({ item }) => (
              <PostCard item={item} currentUser={user} router={router} />
            )}
            ListFooterComponent={
              hasMore ? (
                <Loading style={{ margin: hp(2) }} />
              ) : (
                <Text style={styles.noMore}>אין עוד פוסטים</Text>
              )
            }
          />
        ) : (
          <View style={styles.matchesPlaceholder}>
            <Text style={styles.matchesText}>אין עדיין התאמות כדי להציג</Text>
            <Pressable style={styles.matchesButton} onPress={() => Alert.alert('Find matches')}>
              <Text style={styles.matchesButtonText}>מצא התאמות ∞</Text>
            </Pressable>
          </View>
        )}
      </ScreenWrapper>
    );
  }
  
  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: wp(4),
      paddingTop: hp(3),
      paddingBottom: hp(1),
    },
    title: {
      fontSize: hp(3.2),
      fontWeight: theme.fonts.bold,
      color: theme.colors.textPrimary,
    },
    icons: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: wp(4),
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
      fontWeight: theme.fonts.bold,
    },
    avatar: {
      borderWidth: 2,
      borderColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    tabsContainer: {
      flexDirection: 'row-reverse',
      paddingHorizontal: wp(4),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginBottom: hp(1),
    },
    tab: {
      flex: 1,
      paddingVertical: hp(1.5),
      alignItems: 'center',
    },
    tabActive: {
      borderBottomWidth: hp(0.5),
      borderBottomColor: theme.colors.primary,
    },
    tabText: {
      fontSize: hp(1.8),
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: theme.colors.primary,
      fontWeight: theme.fonts.bold,
    },
    list: {
      paddingHorizontal: wp(4),
      paddingBottom: hp(2),
    },
    inputWrapper: {
      paddingBottom: hp(1.5),
      paddingTop: hp(1),
    },
    input: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.lg,
      paddingVertical: hp(1.5),
      paddingHorizontal: wp(4),
      fontSize: hp(1.9),
      color: theme.colors.textPrimary,
      textAlign: 'right',
    },
    noMore: {
      textAlign: 'center',
      color: theme.colors.textLight,
      marginVertical: hp(2),
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
      fontWeight: theme.fonts.semibold,
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
      fakeInputText: {
        color: theme.colors.textSecondary,
        fontSize: hp(1.9),
      },      
  });
  