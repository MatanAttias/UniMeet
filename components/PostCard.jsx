import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, Share, TextInput } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';
import Avatar from './Avatar';
import moment from 'moment';
import Icon from '../assets/icons';
import RenderHtml from 'react-native-render-html';
import { Image } from 'expo-image';
import { getSupabaseFileUrl } from '../services/imageService';
import { Video } from 'expo-av';
import { createPostLike, removePostLike, createComment } from '../services/PostService';
import { stripHtmlTags } from '../constants/helpers/common';
import Loading from '../components/Loading';
import PostOptions from './PostOptions';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';

const textStyles = {
  color: theme.colors.textSecondary,
  fontSize: hp(1.75),
  lineHeight: hp(2.4),
};

const tagsStyles = {
  div: textStyles,
  p: textStyles,
  ol: textStyles,
  ul: textStyles,
  li: textStyles,
  span: textStyles,
  h1: { color: theme.colors.textSecondary, fontSize: hp(2.2) },
  h4: { color: theme.colors.textSecondary, fontSize: hp(1.9) },
};

const PostCard = ({
  item,
  currentUser,
  router,
  hasShadow = true,
  showMoreIcon = true,
  showDelete = false,
  onDelete = () => {},
  onEdit = () => {},
}) => {
  if (!item || !currentUser?.id || !item.id) {
    return (
      <Text style={{ color: theme.colors.error, textAlign: 'center' }}>
        Error: Missing data
      </Text>
    );
  }

  const [likes, setLikes] = useState(item.postLikes || []);
  const [commentCount, setCommentCount] = useState(item.comments?.[0]?.count || 0);
  const [showOptions, setShowOptions] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    const channel = supabase
      .channel(`comments_post_${item.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `postId=eq.${item.id}` },
        () => setCommentCount(c => c + 1)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments', filter: `postId=eq.${item.id}` },
        () => setCommentCount(c => Math.max(0, c - 1))
      )
      .subscribe(status => console.log('comments subscription', status));
    return () => supabase.removeChannel(channel);
  }, [item.id]);

  useEffect(() => {
    setLikes(item.postLikes || []);
  }, [item.postLikes]);

  const createdAt = item.created_at ? moment(item.created_at).format('D MMM') : 'Unknown';
  const liked = likes.some(l => l.userId === currentUser.id);

  const onLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    scale.value = 1.3;
    setTimeout(() => { scale.value = withSpring(1, { damping: 3 }); }, 50);

    if (liked) {
      setLikes(ls => ls.filter(l => l.userId !== currentUser.id));
      await removePostLike(item.id, currentUser.id);
    } else {
      setLikes(ls => [...ls, { userId: currentUser.id }]);
      await createPostLike({ userId: currentUser.id, postId: item.id });
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    const res = await createComment({ userId: currentUser.id, postId: item.id, text: commentText.trim() });
    setSending(false);
    if (res.success) {
      setCommentText('');
      setCommentCount(c => c + 1);
    } else {
      Alert.alert('תגובה', 'משהו השתבש בשליחה');
    }
  };

  const onShare = () => item.body && Share.share({ message: stripHtmlTags(item.body) });

  return (
    <View style={[styles.container, hasShadow && styles.shadow]}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar size={hp(4.5)} uri={item.user?.image} rounded={theme.radius.md} />
          <View style={styles.nameTime}>
            <Text style={styles.username}>{item.user?.name}</Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </View>
        <View style={styles.actionsRight}>
          {showMoreIcon && (
            <TouchableOpacity onPress={() => setShowOptions(true)}>
              <Icon name="threeDotsHorizontal" size={hp(3.4)} strokeWidth={3} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
          {showDelete && currentUser.id === item.userId && (
            <>
              <TouchableOpacity onPress={() => onEdit(item)}>
                <Icon name="edit" size={hp(2.5)} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('Confirm','Are you sure?',[{ text:'Cancel', style:'cancel' },{ text:'Delete', style:'destructive', onPress:()=>onDelete(item) }])}>
                <Icon name="delete" size={hp(2.5)} color={theme.colors.rose} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      <View style={styles.content}>
        {item.body && (
          <RenderHtml
            contentWidth={wp(100)}
            source={{ html: item.body }}
            tagsStyles={tagsStyles}
            baseStyle={textStyles}
            defaultTextProps={{ selectable: true }}
          />
        )}
        {item.file?.includes('postImages') && (
          <Image source={getSupabaseFileUrl(item.file)} style={styles.postMedia} contentFit="cover" />
        )}
        {item.file?.includes('postVideos') && (
          <Video style={[styles.postMedia, { height: hp(30) }]} source={{ uri: getSupabaseFileUrl(item.file)?.uri }} useNativeControls resizeMode="cover" isLooping />
        )}
      </View>
      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <Animated.View style={animatedStyle}>
            <TouchableOpacity onPress={onLike}>
              <Icon name="heart" size={24} fill={liked ? theme.colors.rose : 'transparent'} color={liked ? theme.colors.rose : theme.colors.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.count}>{likes.length}</Text>
        </View>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={() => router.push({ pathname: 'postDetails', params: { postId: item.id } })}>
            <Icon name="comment" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.count}>{commentCount}</Text>
        </View>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onShare}>
            <Icon name="share" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.quickReplyContainer}>
        <TextInput
          placeholder="הגב לפוסט..."
          placeholderTextColor={theme.colors.textLight}
          value={commentText}
          onChangeText={setCommentText}
          style={styles.quickReplyInput}
        />
        <TouchableOpacity disabled={!commentText.trim() || sending} onPress={handleSendComment}>
          <Icon name="send" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      <PostOptions visible={showOptions} onClose={() => setShowOptions(false)} postId={item.id} />
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: hp(2),
    marginBottom: hp(2),
    gap: hp(2),
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: wp(2),
  },
  nameTime: {
    flexDirection: 'row-reverse',
    gap: wp(1),
  },
  username: {
    fontSize: hp(1.7),
    color: theme.colors.textPrimary,
    fontWeight: theme.fonts.medium,
  },
  postTime: {
    fontSize: hp(1.5),
    color: theme.colors.textLight,
  },
  actionsRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: wp(3),
  },
  content: {
    gap: hp(1),
    marginBottom: hp(1),
  },
  postMedia: {
    width: '100%',
    borderRadius: theme.radius.xxl,
    height: hp(40),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
  },
  count: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
  },
  quickReplyContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    gap: wp(2),
  },
  quickReplyInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: hp(1.6),
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(2),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },
});
