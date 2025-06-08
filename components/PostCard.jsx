import React, { useEffect, useState, useCallback, useMemo } from 'react';
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

const PostCard = React.memo((props) => {
  const { 
    item, 
    currentUser, 
    router, 
    hasShadow = true, 
    showMoreIcon = true, 
    showDelete = false, 
    onDelete = () => {}, 
    onEdit = () => {} 
  } = props;

  // Early validation with more descriptive error messages
  if (!item || typeof item !== 'object') {
    console.warn('Invalid post item:', item);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          ⚠️ פוסט לא תקין ({typeof item})
        </Text>
      </View>
    );
  }

  if (!currentUser?.id || !item.id) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.warningText}>
          ⛔ משתמש לא מזוהה או פוסט חסר מזהה
        </Text>
      </View>
    );
  }

  // State management
  const [likes, setLikes] = useState(item.postLikes || []);
  const [commentCount, setCommentCount] = useState(item.comments?.[0]?.count || 0);
  const [showOptions, setShowOptions] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  
  // Animation
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Memoized calculations
  const createdAt = useMemo(() => 
    item.created_at ? moment(item.created_at).format('D MMM') : 'לא ידוע', 
    [item.created_at]
  );
  
  const liked = useMemo(() => 
    likes.some(l => l.userId === currentUser.id), 
    [likes, currentUser.id]
  );

  // Real-time subscriptions with cleanup
  useEffect(() => {
    if (!item.id) return;

    const channel = supabase
      .channel(`comments_post_${item.id}_${Date.now()}`) // Adding timestamp for uniqueness
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `postId=eq.${item.id}`,
        },
        () => setCommentCount(c => c + 1)
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `postId=eq.${item.id}`,
        },
        () => setCommentCount(c => Math.max(0, c - 1))
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [item.id]);

  // Update likes when item changes
  useEffect(() => {
    setLikes(item.postLikes || []);
  }, [item.postLikes]);

  // Callbacks for performance optimization
  const onLike = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      scale.value = 1.3;
      setTimeout(() => { 
        scale.value = withSpring(1, { damping: 3 }); 
      }, 50);

      if (liked) {
        setLikes(ls => ls.filter(l => l.userId !== currentUser.id));
        await removePostLike(item.id, currentUser.id);
      } else {
        setLikes(ls => [...ls, { userId: currentUser.id }]);
        await createPostLike({ userId: currentUser.id, postId: item.id });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('שגיאה', 'לא ניתן לעדכן לייק כרגע');
    }
  }, [liked, currentUser.id, item.id, scale]);

  const handleSendComment = useCallback(async () => {
    if (!commentText.trim()) return;
    
    setSending(true);
    try {
      const res = await createComment({ 
        userId: currentUser.id, 
        postId: item.id, 
        text: commentText.trim() 
      });
      
      if (res.success) {
        setCommentText('');
        setCommentCount(c => c + 1);
      } else {
        Alert.alert('תגובה', 'משהו השתבש בשליחה');
      }
    } catch (error) {
      console.error('Error sending comment:', error);
      Alert.alert('שגיאה', 'לא ניתן לשלוח תגובה כרגע');
    } finally {
      setSending(false);
    }
  }, [commentText, currentUser.id, item.id]);

  const onShare = useCallback(() => {
    if (item.body) {
      Share.share({ message: stripHtmlTags(item.body) });
    }
  }, [item.body]);

  const handleDeleteConfirm = useCallback(() => {
    Alert.alert(
      'אישור',
      'בטוח שברצונך למחוק?',
      [
        { text: 'ביטול', style: 'cancel' },
        { text: 'מחק', style: 'destructive', onPress: () => onDelete(item) }
      ]
    );
  }, [item, onDelete]);

  const navigateToPostDetails = useCallback(() => {
    router.push({ pathname: 'postDetails', params: { postId: item.id } });
  }, [router, item.id]);

  return (
    <View style={[styles.container, hasShadow && styles.shadow]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar 
            size={hp(4.5)} 
            uri={item.user?.image} 
            rounded={theme.radius.md} 
          />
          <View style={styles.nameTime}>
            <Text style={styles.username}>
              {item.user?.name || 'משתמש'}
            </Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </View>
        
        <View style={styles.actionsRight}>
          {showMoreIcon && (
            <TouchableOpacity onPress={() => setShowOptions(true)}>
              <Icon 
                name="threeDotsHorizontal" 
                size={hp(3.4)} 
                strokeWidth={3} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          )}
          
          {showDelete && currentUser.id === item.userId && (
            <>
              <TouchableOpacity onPress={() => onEdit(item)}>
                <Icon 
                  name="edit" 
                  size={hp(2.5)} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteConfirm}>
                <Icon 
                  name="delete" 
                  size={hp(2.5)} 
                  color={theme.colors.rose} 
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Content */}
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
          <Image 
            source={getSupabaseFileUrl(item.file)} 
            style={styles.postMedia} 
            contentFit="cover" 
          />
        )}
        
        {item.file?.includes('postVideos') && (
          <Video 
            style={[styles.postMedia, { height: hp(30) }]} 
            source={{ uri: getSupabaseFileUrl(item.file)?.uri }} 
            useNativeControls 
            resizeMode="cover" 
            isLooping 
          />
        )}
      </View>

      {/* Footer with actions */}
      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <Animated.View style={animatedStyle}>
            <TouchableOpacity onPress={onLike}>
              <Icon 
                name="heart" 
                size={24} 
                fill={liked ? theme.colors.rose : 'transparent'} 
                color={liked ? theme.colors.rose : theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.count}>{likes.length}</Text>
        </View>
        
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={navigateToPostDetails}>
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

      {/* Quick reply */}
      <View style={styles.quickReplyContainer}>
        <TextInput
          placeholder="הגב לפוסט..."
          placeholderTextColor={theme.colors.textLight}
          value={commentText}
          onChangeText={setCommentText}
          style={styles.quickReplyInput}
          multiline
        />
        <TouchableOpacity 
          disabled={!commentText.trim() || sending} 
          onPress={handleSendComment}
          style={[
            styles.sendButton,
            (!commentText.trim() || sending) && styles.sendButtonDisabled
          ]}
        >
          <Icon 
            name="send" 
            size={20} 
            color={!commentText.trim() || sending ? theme.colors.textLight : theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Options modal */}
      <PostOptions 
        visible={showOptions} 
        onClose={() => setShowOptions(false)} 
        postId={item.id} 
      />
    </View>
  );
});

PostCard.displayName = 'PostCard';

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
  errorContainer: {
    padding: hp(2),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    marginBottom: hp(1),
  },
  errorText: {
    color: theme.colors.rose,
    textAlign: 'center',
    fontSize: hp(1.8),
  },
  warningText: {
    color: theme.colors.warning,
    textAlign: 'center',
    fontSize: hp(1.8),
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
    backgroundColor: theme.colors.card, // ✅ רק אחד!
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.surface,
    maxHeight: hp(8), // מגביל גובה מקסימלי
    textAlignVertical: 'top',
  },
  sendButton: {
    padding: hp(0.5),
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});