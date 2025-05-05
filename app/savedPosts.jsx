import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';
import { fetchSavedPosts } from '../services/PostService';
import PostCard from '../components/PostCard';
import Loading from '../components/Loading';

export default function SavedPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    const res = await fetchSavedPosts(user.id); // תצטרך להוסיף לוגיקה כזו
    if (res.success) {
      setPosts(res.data);
    }
    setLoading(false);
  };

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <Text style={styles.title}>פוסטים שמורים</Text>
      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => `saved-${item.id}`}
          renderItem={({ item }) => (
            <PostCard item={item} currentUser={user} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>אין עדיין פוסטים שמורים</Text>
          }
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: theme.fonts.bold,
    marginVertical: 20,
    textAlign: 'center',
    color: theme.colors.textPrimary,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: theme.colors.textLight,
  },
});
