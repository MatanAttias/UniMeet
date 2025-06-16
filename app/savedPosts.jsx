import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';
import { fetchSavedPosts, fetchSavedTips, unsavePost } from '../services/PostService';
import PostCard from '../components/PostCard';
import Loading from '../components/Loading';

export default function SavedPosts() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedContent();
  }, [activeTab]);

  const loadSavedContent = async () => {
    setLoading(true);
    
    if (activeTab === 'posts') {
      const res = await fetchSavedPosts(user.id);
      if (res.success) {
        setPosts(res.data);
      }
    } else {
      const res = await fetchSavedTips(user.id);
      if (res.success) {
        setTips(res.data);
      }
    }
    
    setLoading(false);
  };

  const handleUnsavePost = async (post) => {
    const res = await unsavePost(user.id, post.id);
    if (res.success) {
      setPosts(prevPosts => prevPosts.filter(p => p.id !== post.id));
    }
  };

  const handleUnsaveTip = async (tip) => {
    // לוגיקה דומה לטיפים
    setTips(prevTips => prevTips.filter(t => t.id !== tip.id));
  };

  const renderTipCard = ({ item }) => (
    <View style={styles.tipCard}>
      <View style={styles.tipHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.tip_category) + '20' }]}>
          <Text style={[styles.categoryText, { color: getCategoryColor(item.tip_category) }]}>
            {getCategoryName(item.tip_category)}
          </Text>
        </View>
        <Pressable onPress={() => handleUnsaveTip(item)}>
          <MaterialCommunityIcons name="bookmark" size={24} color={theme.colors.primary} />
        </Pressable>
      </View>
      
      <Text style={styles.tipTitle}>{item.tip_title}</Text>
      <Text style={styles.tipContent} numberOfLines={3}>
        {item.tip_content}
      </Text>
      
      <View style={styles.tipFooter}>
        <Text style={styles.savedDate}>
          נשמר ב-{new Date(item.saved_at).toLocaleDateString('he-IL')}
        </Text>
        <Pressable 
          style={styles.readMoreButton}
          onPress={() => {
            router.push('/parentTips');
          }}
        >
          <Text style={styles.readMoreText}>קרא עוד</Text>
        </Pressable>
      </View>
    </View>
  );

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

  return (
    <ScreenWrapper bg={theme.colors.background}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-right" size={24} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.title}>תוכן שמור</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <MaterialCommunityIcons 
            name="bookmark-outline" 
            size={20} 
            color={activeTab === 'posts' ? theme.colors.primary : theme.colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            פוסטים ({posts.length})
          </Text>
        </Pressable>

        {user?.role === 'parent' && (
          <Pressable
            style={[styles.tab, activeTab === 'tips' && styles.activeTab]}
            onPress={() => setActiveTab('tips')}
          >
            <MaterialCommunityIcons 
              name="lightbulb-outline" 
              size={20} 
              color={activeTab === 'tips' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text style={[styles.tabText, activeTab === 'tips' && styles.activeTabText]}>
              טיפים ({tips.length})
            </Text>
          </Pressable>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={activeTab === 'posts' ? posts : tips}
          keyExtractor={(item) => `${activeTab}-${item.id}`}
          renderItem={activeTab === 'posts' ? 
            ({ item }) => (
              <PostCard 
                item={item} 
                currentUser={user} 
                router={router}
                onDelete={handleUnsavePost}
                showDelete={true}
              />
            ) : renderTipCard
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name={activeTab === 'posts' ? 'bookmark-outline' : 'lightbulb-outline'} 
                size={64} 
                color={theme.colors.textLight} 
              />
              <Text style={styles.emptyTitle}>
                {activeTab === 'posts' ? 'אין פוסטים שמורים' : 'אין טיפים שמורים'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'posts' ? 
                  'שמור פוסטים שאתה רוצה לחזור אליהם' : 
                  'שמור טיפים שימושיים לעתיד'
                }
              </Text>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  backButton: {
    padding: wp(2),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.card,
  },
  title: {
    fontSize: hp(2.8),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textPrimary,
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  tab: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: wp(2),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.medium,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.semibold,
  },
  listContainer: {
    padding: wp(4),
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
  tipFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedDate: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
  },
  readMoreButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.md,
  },
  readMoreText: {
    fontSize: hp(1.6),
    color: 'white',
    fontWeight: theme.fonts.semibold,
  },
  emptyContainer: {
    alignItems: 'center',
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
});