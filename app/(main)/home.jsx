import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useFonts,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_400Regular,
} from '@expo-google-fonts/poppins';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import { useRouter } from 'expo-router';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import { 
  fetchPosts, 
  fetchSavedPosts, 
  fetchSavedTips,
  savePost, 
  unsavePost,
  unsaveParentTip 
} from '../../services/PostService';
import PostCard from '../../components/PostCard';
import Loading from '../../components/Loading';
import BottomBar from '../../components/BottomBar';
import HomeTabs from '../../components/HomeTabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

let limit = 0;

export default function Home() {
  // 🔧 הוסף isAdmin, isParent מה-AuthContext
  const { user, isAdmin, isParent } = useAuth();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('home');
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedTips, setSavedTips] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [chats, setChats] = useState([]);

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_400Regular,
  });

  useEffect(() => {
    // Debug user data (ניתן להסיר בפרודקשן)
  }, [user]);

  useEffect(() => {
    if (user?.id) {
      if (selectedTab === 'home' && posts.length === 0) {
        getPosts();
      } else if (selectedTab === 'saved') {
        loadSavedContent();
      } else if (selectedTab === 'parentTips') {
        router.push('/parentTips');
      } else if (selectedTab === 'reports') {
        router.push('/reports'); 
      }
    }
  }, [user?.id, selectedTab]);

  // פונקציות לטעינת תוכן
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

  // 🔧 עדכן loadSavedContent לכלול אדמין
  const loadSavedContent = async () => {
    setLoadingSaved(true);
    
    // טען פוסטים שמורים
    const postsRes = await fetchSavedPosts(user.id);
    if (postsRes.success) {
      setSavedPosts(postsRes.data);
    }

    // טען טיפים שמורים (להורים או לאדמין)
    if (isParent() || isAdmin()) {
      const tipsRes = await fetchSavedTips(user.id);
      if (tipsRes.success) {
        setSavedTips(tipsRes.data);
      }
    }
    
    setLoadingSaved(false);
  };

  const refreshPosts = async () => {
    setRefreshing(true);
    if (selectedTab === 'home') {
      const res = await fetchPosts(limit || 10);
      if (res.success) {
        limit = res.data.length;
        setHasMore(true);
        setPosts(res.data);
      }
    } else if (selectedTab === 'saved') {
      await loadSavedContent();
    }
    setRefreshing(false);
  };

  const handleDeletePost = (deletedPost) => {
    if (selectedTab === 'home') {
      setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPost.id));
    } else if (selectedTab === 'saved') {
      setSavedPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPost.id));
    }
  };

  const handleUnsaveTip = async (tip) => {
    try {
      const result = await unsaveParentTip(user.id, tip.tip_id);
      if (result.success) {
        setSavedTips(prevTips => prevTips.filter(t => t.id !== tip.id));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('שגיאה', result.msg || 'לא ניתן להסיר טיפ');
      }
    } catch (error) {
      console.error('Error unsaving tip:', error);
      Alert.alert('שגיאה', 'לא ניתן להסיר טיפ כרגע');
    }
  };

  // 🔧 עדכן handleTabSelect
  const handleTabSelect = (tab) => {
    setSelectedTab(tab);
    if (tab === 'parentTips') {
      router.push('/parentTips');
    } else if (tab === 'reports') {
      router.push('/reports');
    }
  };

  // 🔧 עדכן renderSavedContent
  const renderSavedContent = () => {
    if (loadingSaved) {
      return (
        <View style={{ flex: 1 }}>
          <Loading style={{ marginTop: hp(4) }} />
        </View>
      );
    }

    const hasContent = savedPosts.length > 0 || ((isParent() || isAdmin()) && savedTips.length > 0);

    if (!hasContent) {
      return (
        <FlatList
          data={[]}
          style={{ flex: 1 }}
          contentContainerStyle={{ flex: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="bookmark-outline" 
                size={64} 
                color={theme.colors.textLight} 
              />
              <Text style={styles.emptyTitle}>אין תוכן שמור</Text>
              <Text style={styles.emptySubtitle}>
                שמור פוסטים{(isParent() || isAdmin()) ? ' וטיפים' : ''} שאתה רוצה לחזור אליהם
              </Text>
            </View>
          }
        />
      );
    }

    // מיזוג פוסטים וטיפים עם מזהה ייחודי ומניעת כפולים
    const uniquePosts = savedPosts.reduce((acc, post) => {
      const key = `post-${post.id}`;
      if (!acc[key]) {
        acc[key] = { ...post, type: 'post', uniqueKey: key };
      }
      return acc;
    }, {});

    const uniqueTips = (isParent() || isAdmin()) ? savedTips.reduce((acc, tip) => {
      const key = `tip-${tip.id}`;
      if (!acc[key]) {
        acc[key] = { ...tip, type: 'tip', uniqueKey: key };
      }
      return acc;
    }, {}) : {};

    const allSavedContent = [
      ...Object.values(uniquePosts),
      ...Object.values(uniqueTips)
    ].sort((a, b) => new Date(b.savedAt || b.saved_at) - new Date(a.savedAt || a.saved_at));

    return (
      <FlatList
        data={allSavedContent}
        style={{ flex: 1 }}
        refreshing={refreshing}
        onRefresh={refreshPosts}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        keyExtractor={(item) => `saved-${item.uniqueKey || `${item.type}-${item.id}`}`}
        renderItem={({ item }) => {
          if (item.type === 'post') {
            return (
              <PostCard 
                item={item} 
                currentUser={user} 
                router={router} 
                onDelete={handleDeletePost}
                showDelete={true}
                isInSavedTab={true}  
              />
            );
          } else {
            return (
              <View style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.tip_category) + '20' }]}>
                    <Text style={[styles.categoryText, { color: getCategoryColor(item.tip_category) }]}>
                      {getCategoryName(item.tip_category)}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleUnsaveTip(item)}>
                    <MaterialCommunityIcons name="bookmark-minus" size={24} color={theme.colors.rose} />
                  </Pressable>
                </View>
                
                <Text style={styles.tipTitle}>{item.tip_title}</Text>
                <Text style={styles.tipContent} numberOfLines={3}>
                  {item.tip_content}
                </Text>
                
                <Text style={styles.savedDate}>
                  נשמר ב-{new Date(item.saved_at).toLocaleDateString('he-IL')}
                </Text>
              </View>
            );
          }
        }}
      />
    );
  };

  // פונקציות עזר לטיפים
  const getCategoryColor = (category) => {
    const colors = {
      'communication': '#6B73FF',
      'daily_routine': '#9C88FF',
      'sensory': '#FF8A9B',
      'social': '#32D1C3',
      'education': '#FFB443',
      'self_care': '#FF6B9D'
    };
    return colors[category] || theme.colors.primary;
  };

  const getCategoryName = (category) => {
    const names = {
      'communication': 'תקשורת',
      'daily_routine': 'שגרה יומיומית',
      'sensory': 'ויסות חושי',
      'social': 'מיומנויות חברתיות',
      'education': 'חינוך ולמידה',
      'self_care': 'טיפול עצמי'
    };
    return names[category] || 'כללי';
  };

  if (!fontsLoaded) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      </ScreenWrapper>
    );
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
          <Pressable hitSlop={8} style={styles.iconButton} onPress={() => router.push('/search')}>
            <Icon name="search" size={hp(3)} color={theme.colors.primary} />
          </Pressable>
          <Pressable hitSlop={8} style={styles.iconButton} onPress={() => router.push('newPost')}>
            <Icon name="plus" size={hp(3)} strokeWidth={1.5} color={theme.colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* 🔧 Tabs מעודכן */}
      <HomeTabs 
        selectedTab={selectedTab}
        onSelectTab={handleTabSelect}
        isParent={isParent()}
        isAdmin={isAdmin()}
      />

      {/* 🔧 הודעת ברוכים הבאים מעודכנת */}
      {(isParent() || isAdmin()) && selectedTab === 'home' && (
        <View style={styles.parentWelcome}>
          <MaterialCommunityIcons 
            name={isAdmin() ? "shield-check" : "lightbulb-on"} 
            size={24} 
            color={theme.colors.primary} 
          />
          <Text style={styles.parentWelcomeText}>
            {isAdmin() 
              ? "ברוך הבא אדמין! יש לך גישה לכל המערכת ולניהול דיווחים" 
              : "ברוך הבא! גלה טיפים מועילים לחינוך וגידול ילדים"
            }
          </Text>
          <Pressable 
            style={styles.parentWelcomeButton}
            onPress={() => setSelectedTab(isAdmin() ? 'reports' : 'parentTips')}
          >
            <Text style={styles.parentWelcomeButtonText}>
              {isAdmin() ? "ניהול דיווחים" : "צפה בטיפים"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* 🔧 Content מעודכן */}
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
          keyExtractor={item => `home-post-${item.id}`}
          renderItem={({ item }) => <PostCard item={item} currentUser={user} router={router} onDelete={handleDeletePost} />}
          ListFooterComponent={hasMore ? <Loading style={{ margin: hp(2) }} /> : <Text style={styles.noMore}>אין עוד פוסטים</Text>}
        />
      ) : selectedTab === 'saved' ? (
        renderSavedContent()
      ) : selectedTab === 'reports' ? (
        // 🔧 זמני - נוסיף את העמוד הנכון בשלב הבא
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="shield-alert" size={64} color={theme.colors.primary} />
          <Text style={styles.emptyTitle}>מערכת דיווחים</Text>
          <Text style={styles.emptySubtitle}>בקרוב...</Text>
        </View>
      ) : null}

      {/* BottomBar */}
      <BottomBar
        currentUser={user}
        selected={selectedTab === 'home' ? 'home' : selectedTab === 'saved' ? 'saved' : 'home'}
        chats={chats}
        onTabChange={tab => {
          if (tab === 'search') router.push('Search');
          if (tab === 'saved') setSelectedTab('saved');
          if (tab === 'profile') router.push('profile');
          if (tab === 'home') setSelectedTab('home');
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(3),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
    marginTop: -50,
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
  parentWelcome: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    paddingVertical: hp(2.5),
    paddingHorizontal: wp(4),
    marginHorizontal: wp(4),
    marginBottom: hp(2),
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  parentWelcomeText: {
    flex: 1,
    fontSize: hp(1.9),
    color: theme.colors.textPrimary,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    marginRight: wp(3),
    lineHeight: hp(2.4),
  },
  parentWelcomeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.lg,
    marginLeft: wp(2),
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  parentWelcomeButtonText: {
    color: '#fff',
    fontSize: hp(1.7),
    fontFamily: 'Poppins_600SemiBold',
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(8),
  },
  emptyTitle: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textPrimary,
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  emptySubtitle: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
    textAlign: 'center',
    paddingHorizontal: wp(8),
  },
  tipCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  categoryBadge: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
  },
  categoryText: {
    fontSize: hp(1.4),
    fontWeight: theme.fonts.semibold,
  },
  tipTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'right',
    marginBottom: hp(1),
  },
  tipContent: {
    fontSize: hp(1.7),
    color: theme.colors.textSecondary,
    lineHeight: hp(2.4),
    textAlign: 'right',
    marginBottom: hp(1.5),
  },
  savedDate: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    textAlign: 'right',
  },
});