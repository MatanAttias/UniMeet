import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import ScreenWrapper from '../components/ScreenWrapper';
import UserHeader from '../components/UserHeader'; // נשתמש ברכיב קיים שמציג פרופיל
import PostCard from '../components/PostCard';
import Loading from '../components/Loading';
import { fetchPosts } from '../services/PostService';
import { theme } from '../constants/theme';

const VisitedProfile = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [showPosts, setShowPosts] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchVisitedUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        Alert.alert('שגיאה', 'לא ניתן לטעון משתמש');
        console.error(error);
      } else {
        setUserData(data);
      }
      setLoading(false);
    };

    if (userId) {
      fetchVisitedUser();
    }
  }, [userId]);

  const getPosts = async () => {
    if (!hasMore || !userId) return;
    const limit = posts.length + 10;

    const res = await fetchPosts(limit, userId);
    if (res.success) {
      if (posts.length === res.data.length) setHasMore(false);

      setPosts(prev => {
        const ids = new Set(prev.map(post => post.id));
        const unique = res.data.filter(post => !ids.has(post.id));
        return [...prev, ...unique];
      });
    }
  };

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} />;

  return (
    <ScreenWrapper bg="black">
      <View style={{ padding: 16 }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: 'white' }}>← חזרה</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
        <Pressable onPress={() => setActiveTab('profile')} style={{ marginHorizontal: 10 }}>
          <Text style={{ color: activeTab === 'profile' ? 'white' : 'gray' }}>פרופיל</Text>
        </Pressable>
        <Pressable onPress={() => {
          setActiveTab('posts');
          if (!showPosts) {
            setShowPosts(true);
            getPosts();
          }
        }} style={{ marginHorizontal: 10 }}>
          <Text style={{ color: activeTab === 'posts' ? 'white' : 'gray' }}>פוסטים</Text>
        </Pressable>
      </View>

      <FlatList
        data={activeTab === 'posts' ? posts : []}
        ListHeaderComponent={
          activeTab === 'profile' && userData ? (
            <UserHeader user={userData} router={router} />
          ) : null
        }
        renderItem={({ item }) =>
          activeTab === 'posts' ? <PostCard item={item} currentUser={userData} router={router} /> : null
        }
        keyExtractor={item => item.id.toString()}
        onEndReached={() => {
          if (activeTab === 'posts') getPosts();
        }}
        ListFooterComponent={
          activeTab === 'posts' && showPosts ? (
            hasMore ? <Loading /> : <Text style={{ color: 'white', textAlign: 'center' }}>אין עוד פוסטים</Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </ScreenWrapper>
  );
};

export default VisitedProfile;