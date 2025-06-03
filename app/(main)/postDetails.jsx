import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createComment, fetchPostDetails, removeComment, removePost } from '../../services/PostService';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import PostCard from '../../components/PostCard';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../../components/Loading';
import Icon from '../../assets/icons';
import CommentItem from '../../components/CommentItem';
import { getUserData } from '../../services/userService';
import { supabase } from '../../lib/supabase';
import { createNotification } from '../../services/notificationService';

const PostDetails = () => {
  const { postId, commentId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const inputRef = useRef(null);
  const commentRef = useRef('');

  const [post, setPost] = useState(null);
  const [startLoading, setStartLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Fetch post details once
  const getPostDetails = async () => {
    const res = await fetchPostDetails(postId);
    if (res.success) {
      setPost(res.data);
    }
    setStartLoading(false);
  };

  // Handle new comments via realtime
  const handleNewComment = async ({ new: newCommentRaw }) => {
    if (!newCommentRaw) return;
    const newComment = { ...newCommentRaw };
    if (!newComment.created_at) newComment.created_at = new Date().toISOString();
    const resUser = await getUserData(newComment.userId);
    newComment.user = resUser.success ? resUser.data : {};
    setPost(prev => prev ? { ...prev, comments: [newComment, ...prev.comments] } : prev);
  };

  useEffect(() => {
    getPostDetails();
    // subscribe to new comments
    const channel = supabase
      .channel(`comments_post_details_${postId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `postId=eq.${postId}` },
        handleNewComment
      )
      .subscribe(({ status, error }) => {
        if (error) console.error('Comments channel error', error);
        else console.log('Comments channel status', status);
      });
    // polling fallback every 5s
    const polling = setInterval(async () => {
      const res = await fetchPostDetails(postId);
      if (res.success) {
        setPost(prev => prev ? { ...prev, comments: res.data.comments } : prev);
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(polling);
    };
  }, [postId]);

  const onNewComment = async () => {
    if (!commentRef.current.trim()) {
      Alert.alert('Error', 'Please enter a comment before submitting.');
      return;
    }
    setLoading(true);
    const data = { userId: user.id, postId: post.id, text: commentRef.current };
    const res = await createComment(data);
    setLoading(false);
    if (res.success) {
      // append locally
      const appended = { ...res.data, user, created_at: res.data.created_at || new Date().toISOString() };
      setPost(prev => prev ? { ...prev, comments: [appended, ...prev.comments] } : prev);
      if (user.id !== post.userId) {
        const notify = { senderId: user.id, receiverId: post.userId, title: 'commented on your post', data: JSON.stringify({ postId: post.id, commentId: res.data.id }) };
        createNotification(notify);
      }
      inputRef.current.clear();
      commentRef.current = '';
    } else {
      Alert.alert('Comment Error', res.msg || 'Failed to post comment.');
    }
  };

  const onDeleteComment = async comment => {
    const res = await removeComment(comment.id);
    if (res.success) {
      setPost(prev => prev ? { ...prev, comments: prev.comments.filter(c => c.id !== comment.id) } : prev);
    } else {
      Alert.alert('Comment', res.msg);
    }
  };

  const onDeletePost = async () => {
    const res = await removePost(post.id);
    if (res.success) router.push({ pathname: '/home', params: { refresh: 'true' } });
    else Alert.alert('Post', res.msg);
  };

  const onEditPost = () => {
    router.back();
    router.push({ pathname: 'newPost', params: { ...post } });
  };

  if (startLoading) return <View style={styles.center}><Loading /></View>;
  if (!post) return <View style={[styles.center, { justifyContent: 'flex-start', marginTop: 100 }]}><Text style={styles.notFound}>Post not found!</Text></View>;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? hp(10) : 0}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        <PostCard
          item={{ ...post, comments: [{ count: post.comments.length }] }}
          currentUser={user}
          router={router}
          hasShadow={false}
          showMoreIcon={false}
          showDelete={true}
          onDelete={onDeletePost}
          onEdit={onEditPost}
        />
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            placeholder="Type your comment..."
            onChangeText={value => (commentRef.current = value)}
            placeholderTextColor={theme.colors.textLight}
            style={styles.inputStyle}
            multiline
            textAlignVertical="top"
          />
          {loading ? <View style={styles.loading}><Loading size="small" /></View> : <TouchableOpacity style={styles.sendIcon} onPress={onNewComment}><Icon name="send" color={theme.colors.primaryDark} /></TouchableOpacity>}
        </View>
        <View style={{ marginVertical: 15, gap: 17 }}>
          {post.comments.map(comment => <CommentItem key={comment.id.toString()} item={comment} onDelete={onDeleteComment} highlight={commentId == comment.id} canDelete={user.id === comment.userId || user.id === post.userId} />)}
          {post.comments.length === 0 && <Text style={{ color: theme.colors.text, marginLeft: 5 }}>Be first to comment!</Text>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default PostDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#666666', // רקע בהיר לאזור התגובה
      },
      inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: wp(2),
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        backgroundColor: '#4A4A4A', // אפור עכבר כהה ונעים
        borderRadius: 12, // עיגול פינות למראה עדין
        shadowColor: '#000', // צל שחור
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6, // עבור אנדרואיד
      },
    list: {
        paddingHorizontal: wp(4),
        paddingBottom: hp(20), // רווח גדול יותר בתחתית
        
    },
    inputStyle: {
        flex: 1,
        height: hp(10), // גובה גדול יותר
        borderRadius: theme.radius.xl,
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.5),
        borderWidth: 1,
        borderColor: theme.colors.primaryLight,
        backgroundColor: 'white',
        fontSize: hp(2),
        lineHeight: hp(2.5),
    },
    sendIcon: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 0.8,
        borderColor: theme.colors.primary,
        borderRadius: theme.radius.lg,
        height: hp(5.8),
        width: hp(5.8),
        backgroundColor: theme.colors.primaryLight,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notFound: {
        fontSize: hp(2.5),
        color: theme.colors.text,
        fontWeight: theme.fonts.medium,
    },
    loading: {
        height: hp(5.8),
        width: hp(5.8),
        justifyContent: 'center',
        alignItems: 'center',
        transform: [{ scale: 1.3 }],
    },
});
