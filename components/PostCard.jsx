import { StyleSheet, Text, TouchableOpacity, View, Alert, Share } from 'react-native';
import React, { useEffect, useState } from 'react';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';
import Avatar from './Avatar';
import moment from 'moment';
import Icon from '../assets/icons';
import RenderHtml from 'react-native-render-html';
import { Image } from 'expo-image';
import { getSupabaseFileUrl } from '../services/imageService';
import { Video } from 'expo-av';
import { createPostLike, removePostLike } from '../services/PostService';
import { stripHtmlTags } from '../constants/helpers/common';
import Loading from '../components/Loading';

const textStyles = {
  color: theme.colors.textSecondary,  // כאן צבע הפונט
  fontSize: hp(1.75),
  lineHeight: hp(2.4),
};

const tagsStyles = {
  div:            textStyles,
  p:              textStyles,
  ol:             textStyles,
  ul:             textStyles,
  li:             textStyles,
  span:           textStyles,
  h1:             { color: theme.colors.textSecondary, fontSize: hp(2.2) },
  h4:             { color: theme.colors.textSecondary, fontSize: hp(1.9) },
};

const PostCard = ({
  item,
  currentUser,
  router,
  hasShadow = true,
  showMoreIcon = true,
  showDelete = false,
  onDelete = () => {},
  onEdit = () => {}
}) => {
  if (!item) {
    return (
      <Text style={{ color: theme.colors.error, textAlign: 'center' }}>
        Error: Post data is missing
      </Text>
    );
  }

  const [likes, setLikes] = useState(item.postLikes || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLikes(item.postLikes || []);
  }, [item]);

  const createdAt = item.created_at
    ? moment(item.created_at).format('D MMM')
    : 'Unknown';
  const liked = likes.some(l => l.userId === currentUser?.id);

  const openPostDetails = () => {
    if (!showMoreIcon) return;
    router.push({ pathname: 'postDetails', params: { postId: item.id } });
  };

  const onLike = async () => {
    if (!currentUser) return;
    const already = liked;
    if (already) {
      setLikes(likes.filter(l => l.userId !== currentUser.id));
      const res = await removePostLike(item.id, currentUser.id);
      if (!res.success) Alert.alert('Post', 'Something went wrong!');
    } else {
      setLikes([...likes, { userId: currentUser.id }]);
      const res = await createPostLike({
        userId: currentUser.id,
        postId: item.id
      });
      if (!res.success) Alert.alert('Post', 'Something went wrong!');
    }
  };

  const onShare = async () => {
    if (!item.body) return;
    Share.share({ message: stripHtmlTags(item.body) });
  };

  const handleDelete = () => {
    Alert.alert('Confirm', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(item) }
    ]);
  };

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
              {item.user?.name || 'Unknown User'}
            </Text>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </View>

        <View style={styles.actionsRight}>
          {showMoreIcon && (
            <TouchableOpacity onPress={openPostDetails}>
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
              <TouchableOpacity onPress={handleDelete}>
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

      {/* Body */}
      <View style={styles.content}>
        {item.body && (
          <RenderHtml
            contentWidth={wp(100)}
            source={{ html: item.body }}
            tagsStyles={tagsStyles}
            baseStyle={textStyles}          // <<< הוספנו baseStyle
            defaultTextProps={{ selectable: true }}
          />
        )}
        {item.file &&
          (item.file.includes('postImages') ? (
            <Image
              source={getSupabaseFileUrl(item.file)}
              transition={100}
              style={styles.postMedia}
              contentFit="cover"
            />
          ) : item.file.includes('postVideos') ? (
            <Video
              style={[styles.postMedia, { height: hp(30) }]}
              source={{ uri: getSupabaseFileUrl(item.file)?.uri }}
              useNativeControls
              resizeMode="cover"
              isLooping
            />
          ) : null)}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onLike}>
            <Icon
              name="heart"
              size={24}
              fill={liked ? theme.colors.rose : 'transparent'}
              color={liked ? theme.colors.rose : theme.colors.textLight}
            />
          </TouchableOpacity>
          <Text style={styles.count}>{likes.length}</Text>
        </View>

        <View style={styles.footerButton}>
          <TouchableOpacity onPress={openPostDetails}>
            <Icon
              name="comment"
              size={24}
              color={theme.colors.textLight}
            />
          </TouchableOpacity>
          <Text style={styles.count}>
            {item.comments?.[0]?.count || 0}
          </Text>
        </View>

        <View style={styles.footerButton}>
          {loading ? (
            <Loading size="small" />
          ) : (
            <TouchableOpacity onPress={onShare}>
              <Icon
                name="share"
                size={24}
                color={theme.colors.textLight}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
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
});
