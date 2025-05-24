import React, { useState, useEffect } from 'react';
import { FlatList, Text, StyleSheet } from 'react-native';
import PostCard from './PostCard';
import Loading from './Loading';
import { fetchPosts } from '../services/PostService';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';

export default function UserPostsList({ userId, currentUser, router }) {
  const [posts, setPosts] = useState([]);
  const [limit, setLimit] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    const nextLimit = limit + 10;
    const res = await fetchPosts(nextLimit, userId);

    if (res.success) {
      if (res.data.length === posts.length) {
        setHasMore(false);
      }

      setPosts(prev => {
        const seenIds = new Set(prev.map(p => p.id));
        const newPosts = res.data.filter(p => !seenIds.has(p.id));
        return [...prev, ...newPosts];
      });

      setLimit(nextLimit);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadMore();
  }, []);

  return (
    <FlatList
      data={posts}
      keyExtractor={item => `post-${item.id}`}
      renderItem={({ item }) => (
        <PostCard post={item} currentUser={currentUser} router={router} />
      )}
      onEndReached={loadMore}
      onEndReachedThreshold={0.1}
      ListFooterComponent={
        isLoading ? (
          <Loading />
        ) : !hasMore && posts.length > 0 ? (
          <Text style={styles.noPosts}>אין עוד פוסטים</Text>
        ) : null
      }
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(4),
  },
  noPosts: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginVertical: hp(2),
    fontSize: hp(1.8),
  },
});
