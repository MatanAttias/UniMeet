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
import { createPostLike, removePostLike, createComment, unsavePost } from '../services/PostService';
import { stripHtmlTags } from '../constants/helpers/common';
import PostOptions from './PostOptions';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { createNotification } from '../services/notificationService';

const detectTextDirection = (text) => {
  if (!text) return 'ltr';
  
  const cleanText = stripHtmlTags(text);
  
  const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/;
  const ltrRegex = /[a-zA-Z]/;
  
  const rtlMatches = (cleanText.match(rtlRegex) || []).length;
  const ltrMatches = (cleanText.match(ltrRegex) || []).length;
  
  return rtlMatches > ltrMatches ? 'rtl' : 'ltr';
};

const getTimeAgo = (dateString) => {
  if (!dateString) return 'לא ידוע';
  
  const now = moment();
  const postTime = moment(dateString);
  const diffInMinutes = now.diff(postTime, 'minutes');
  const diffInHours = now.diff(postTime, 'hours');
  const diffInDays = now.diff(postTime, 'days');
  
  if (diffInMinutes < 1) return 'עכשיו';
  if (diffInMinutes < 60) return `לפני ${diffInMinutes}ד'`;
  if (diffInHours < 24) return `לפני ${diffInHours}ש'`;
  if (diffInDays === 1) return 'אתמול';
  if (diffInDays < 7) return `לפני ${diffInDays} ימים`;
  
  return postTime.format('D/M');
};

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
    onUserPress,
    hasShadow = true, 
    showMoreIcon = true, 
    showDelete = false, 
    onDelete = () => {}, 
    onEdit = () => {},
    isInSavedTab = false 
  } = props;

  console.log('PostCard props:', { isInSavedTab, postId: item.id });

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
  


  const [likes, setLikes] = useState(item.postLikes || []);
  const [commentCount, setCommentCount] = useState(item.comments?.[0]?.count || 0);
  const [showOptions, setShowOptions] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const postTimeAgo = useMemo(() => 
    getTimeAgo(item.created_at), 
    [item.created_at]
  );
  
  const liked = useMemo(() => 
    likes.some(l => l.userId === currentUser.id), 
    [likes, currentUser.id]
  );

  const textDirection = useMemo(() => 
    detectTextDirection(item.body), 
    [item.body]
  );

  const commentDirection = useMemo(() => 
    detectTextDirection(commentText), 
    [commentText]
  );

  useEffect(() => {
    const channelName = `comments_post_${item.id}`;
    
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    if (existing) return;
  
    const channel = supabase
      .channel(channelName)
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
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [item.id]);

  useEffect(() => {
    setLikes(item.postLikes || []);
  }, [item.postLikes]);

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
        
        if (item.userId !== currentUser.id) {
          const notificationData = {
            "senderId": currentUser.id,
            "receiverId": item.userId,
            title: 'לייק חדש!',
            data: JSON.stringify({
              postId: item.id,
              type: 'like',
              senderName: currentUser.name || 'משתמש',
              postPreview: stripHtmlTags(item.body)?.substring(0, 50) + '...' || 'פוסט',
              postImage: item.file?.includes('postImages') ? item.file : null,
              postHasImage: !!item.file?.includes('postImages')
            })
          };
          
          console.log('🔔 Creating like notification:', notificationData);
          const notificationResult = await createNotification(notificationData);
          
          if (notificationResult.success) {
            console.log('✅ Like notification created successfully');
          } else {
            console.log('❌ Failed to create like notification:', notificationResult.msg);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('שגיאה', 'לא ניתן לעדכן לייק כרגע');
    }
  }, [liked, currentUser.id, currentUser.name, item.id, item.userId, item.body, scale]);

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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (item.userId !== currentUser.id) {
          const notificationData = {
            "senderId": currentUser.id,
            "receiverId": item.userId,
            title: 'תגובה חדשה!',
            data: JSON.stringify({
              postId: item.id,
              type: 'comment',
              senderName: currentUser.name || 'משתמש',
              commentText: commentText.trim().substring(0, 50) + '...',
              postPreview: stripHtmlTags(item.body)?.substring(0, 50) + '...' || 'פוסט',
              postImage: item.file?.includes('postImages') ? item.file : null,
              postHasImage: !!item.file?.includes('postImages')
            })
          };
          
          console.log('🔔 Creating comment notification:', notificationData);
          const notificationResult = await createNotification(notificationData);
          
          if (notificationResult.success) {
            console.log('✅ Comment notification created successfully');
          } else {
            console.log('❌ Failed to create comment notification:', notificationResult.msg);
          }
        }
      } else {
        Alert.alert('תגובה', 'משהו השתבש בשליחה');
      }
    } catch (error) {
      console.error('Error sending comment:', error);
      Alert.alert('שגיאה', 'לא ניתן לשלוח תגובה כרגע');
    } finally {
      setSending(false);
    }
  }, [commentText, currentUser.id, currentUser.name, item.id, item.userId, item.body]);

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

  const handleUnsaveFromSaved = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await unsavePost(currentUser.id, item.id);
      if (result.success) {
        onDelete(item);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Alert.alert('שגיאה', result.msg || 'לא ניתן להסיר פוסט מהשמורים');
      }
    } catch (error) {
      console.error('Error unsaving post:', error);
      Alert.alert('שגיאה', 'לא ניתן להסיר פוסט מהשמורים כרגע');
    }
  }, [currentUser.id, item.id, onDelete]);

  const navigateToPostDetails = useCallback(() => {
    router.push({ pathname: 'postDetails', params: { postId: item.id } });
  }, [router, item.id]);

  return (
    <View style={[styles.container, hasShadow && styles.shadow]}>
      <View style={styles.header}>
      <TouchableOpacity style={styles.userInfo} onPress={onUserPress}>

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
            <Text style={styles.postTime}>{postTimeAgo}</Text>
          </View>
        </View>
        </TouchableOpacity>
        
        <View style={styles.actionsRight}>
          {showMoreIcon && (
            <TouchableOpacity 
              onPress={() => setShowOptions(true)}
              style={styles.actionButton}
            >
              <Icon 
                name="threeDotsHorizontal" 
                size={hp(3)} 
                strokeWidth={3} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          )}

          {showDelete && currentUser.id === item.userId && (
            <>
              <TouchableOpacity 
                onPress={() => onEdit(item)}
                style={styles.actionButton}
              >
                <Icon 
                  name="edit" 
                  size={hp(2.2)} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleDeleteConfirm}
                style={styles.actionButton}
              >
                <Icon 
                  name="delete" 
                  size={hp(2.2)} 
                  color={theme.colors.rose} 
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={[
        styles.content,
        { alignItems: textDirection === 'rtl' ? 'flex-end' : 'flex-start' }
      ]}>
        {item.body && (
          <View style={[
            styles.textContainer,
            { 
              alignSelf: textDirection === 'rtl' ? 'stretch' : 'stretch',
              textAlign: textDirection === 'rtl' ? 'right' : 'left'
            }
          ]}>
            <RenderHtml
              contentWidth={wp(85)}
              source={{ html: item.body }}
              tagsStyles={{
                ...tagsStyles,
                div: { 
                  ...textStyles, 
                  textAlign: textDirection === 'rtl' ? 'right' : 'left',
                  writingDirection: textDirection
                },
                p: { 
                  ...textStyles, 
                  textAlign: textDirection === 'rtl' ? 'right' : 'left',
                  writingDirection: textDirection
                }
              }}
              baseStyle={{
                ...textStyles,
                textAlign: textDirection === 'rtl' ? 'right' : 'left',
                writingDirection: textDirection
              }}
              defaultTextProps={{ 
                selectable: true,
                style: {
                  textAlign: textDirection === 'rtl' ? 'right' : 'left',
                  writingDirection: textDirection
                }
              }}
            />
          </View>
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

      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <Animated.View style={animatedStyle}>
            <TouchableOpacity 
              onPress={onLike}
              style={styles.interactionButton}
            >
              <Icon 
                name="heart" 
                size={hp(2.8)} 
                fill={liked ? theme.colors.rose : 'transparent'} 
                color={liked ? theme.colors.rose : theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.count}>{likes.length}</Text>
        </View>
        
        <View style={styles.footerButton}>
          <TouchableOpacity 
            onPress={navigateToPostDetails}
            style={styles.interactionButton}
          >
            <Icon 
              name="comment" 
              size={hp(2.8)} 
              color={theme.colors.textLight} 
            />
          </TouchableOpacity>
          <Text style={styles.count}>{commentCount}</Text>
        </View>
        
        <View style={styles.footerButton}>
          {isInSavedTab ? (
            <TouchableOpacity 
              onPress={handleUnsaveFromSaved}
              style={styles.interactionButton}
            >
              <MaterialCommunityIcons
                name="bookmark-remove"
                size={hp(2.8)}
                color={theme.colors.rose}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={onShare}
              style={styles.interactionButton}
            >
              <Icon 
                name="share" 
                size={hp(2.8)} 
                color={theme.colors.textLight} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.quickReplyContainer}>
        <TextInput
          placeholder="הגב לפוסט..."
          placeholderTextColor={theme.colors.textLight}
          value={commentText}
          onChangeText={setCommentText}
          style={[
            styles.quickReplyInput,
            { 
              textAlign: commentDirection === 'rtl' ? 'right' : 'left',
              writingDirection: commentDirection
            }
          ]}
          multiline
          maxLength={500}
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
            size={hp(2.2)} 
            color={!commentText.trim() || sending ? theme.colors.textLight : theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>

      <PostOptions 
        visible={showOptions} 
        onClose={() => setShowOptions(false)} 
        postId={item.id} 
        currentUser={currentUser}
        postUserId={item.userId}
        onDelete={onDelete}   
        item={item}
      />
    </View>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: wp(4),
    marginBottom: hp(2),
    gap: hp(1.5),
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    paddingBottom: hp(1),
  },
  userInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: wp(3),
  },
  nameTime: {
    alignItems: 'flex-end',
  },
  username: {
    fontSize: hp(1.8),
    color: theme.colors.textPrimary,
    fontWeight: theme.fonts.semibold,
  },
  postTime: {
    fontSize: hp(1.4),
    color: theme.colors.textLight,
    marginTop: hp(0.2),
  },
  actionsRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: wp(2),
  },
  actionButton: {
    padding: wp(1.5),
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.background,
  },
  content: {
    gap: hp(1.5),
  },
  textContainer: {
    width: '100%',
  },
  postMedia: {
    width: '100%',
    borderRadius: theme.radius.lg,
    height: hp(35),
    marginTop: hp(1),
  },
  footer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
  },
  footerButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: wp(1.5),
  },
  interactionButton: {
    padding: wp(2),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
  },
  count: {
    fontSize: hp(1.7),
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.medium,
  },
  quickReplyContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
    paddingTop: hp(1.5),
    gap: wp(2),
  },
  quickReplyInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: hp(1.7),
    paddingVertical: hp(1.1),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.surface,
    maxHeight: hp(10),
    textAlignVertical: 'top',
    lineHeight: hp(2.4),
  },
  sendButton: {
    padding: wp(2.7),
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});