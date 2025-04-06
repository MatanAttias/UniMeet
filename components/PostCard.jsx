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
    color: theme.colors.dark,
    fontSize: hp(1.75),
};

const tagsStyles = {
    div: textStyles,
    p: textStyles,
    ol: textStyles,
    h1: { color: theme.colors.dark },
    h4: { color: theme.colors.dark },
};

const PostCard = ({ item, currentUser, router, hasShadow = true, showMoreIcon = true }) => {
    if (!item) {
        return <Text style={{ color: 'red', textAlign: 'center' }}>Error: Post data is missing</Text>;
    }
    
    const shadowStyles = {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
    };
    
    const [likes, setLikes] = useState(item?.postLikes || []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLikes(item?.postLikes || []);
    }, [item]);

    const openPostDetails = () => {
        if (!showMoreIcon) return;
        router.push({ pathname: 'postDetails', params: { postId: item?.id } });
    };

    const onLike = async () => {
        if (!currentUser) return;
        
        const liked = likes.some(like => like.userId === currentUser?.id);
        
        if (liked) {
            const updatedLikes = likes.filter(like => like.userId !== currentUser?.id);
            setLikes(updatedLikes);
            let res = await removePostLike(item?.id, currentUser?.id);
            if (!res?.success) {
                Alert.alert('Post', 'Something went wrong!');
            }
        } else {
            const newLike = { userId: currentUser?.id, postId: item?.id };
            setLikes([...likes, newLike]);
            let res = await createPostLike(newLike);
            if (!res?.success) {
                Alert.alert('Post', 'Something went wrong!');
            }
        }
    };

    const onShare = async () => {
        if (!item?.body) return;
        Share.share({ message: stripHtmlTags(item.body) });
    };

    const createdAt = item?.created_at ? moment(item.created_at).format('D MMM') : "Unknown";
    const liked = likes.some(like => like.userId === currentUser?.id);

    return (
        <View style={[styles.container, hasShadow && shadowStyles]}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Avatar size={hp(4.5)} uri={item?.user?.image} rounded={theme.radius.md} />
                    <View style={{ gap: 2 }}>
                        <Text style={styles.username}>{item?.user?.name || 'Unknown User'}</Text>
                        <Text style={styles.postTime}>{createdAt}</Text>
                    </View>
                </View>
                {showMoreIcon && (
                    <TouchableOpacity onPress={openPostDetails}>
                        <Icon name="threeDotsHorizontal" size={hp(3.4)} strokeWidth={3} color={theme.colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.postBody}>
                    {item?.body && (
                        <RenderHtml contentWidth={wp(100)} source={{ html: item.body }} tagsStyles={tagsStyles} />
                    )}
                </View>
                {item?.file && (
                    item.file.includes('postImages') ? (
                        <Image source={getSupabaseFileUrl(item.file)} transition={100} style={styles.postMedia} contentFit="cover" />
                    ) : item.file.includes('postVideos') ? (
                        <Video style={[styles.postMedia, { height: hp(30) }]} source={{ uri: getSupabaseFileUrl(item.file)?.uri }} useNativeControls resizeMode="cover" isLooping onError={(e) => console.log("Video Error:", e)} />
                    ) : null
                )}
            </View>
            <View style={styles.footer}>
                <View style={styles.footerButton}>
                    <TouchableOpacity onPress={onLike}>
                        <Icon name="heart" size={24} fill={liked ? theme.colors.rose : 'transparent'} color={liked ? theme.colors.rose : theme.colors.textLight} />
                    </TouchableOpacity>
                    <Text style={styles.count}>{likes.length}</Text>
                </View>
                <View style={styles.footerButton}>
                    <TouchableOpacity onPress={openPostDetails}>
                        <Icon name="comment" size={24} color={theme.colors.textLight} />
                    </TouchableOpacity>
                    <Text style={styles.count}>{item?.comments?.[0]?.count || 0}</Text>
                </View>
                <View style={styles.footerButton}>
                    {loading ? <Loading size="small" /> : (
                        <TouchableOpacity onPress={onShare}>
                            <Icon name="share" size={24} color={theme.colors.textLight} />
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
        gap: 10,
        marginBottom: 15,
        borderRadius: theme.radius.xxl * 1.1,
        padding: 10,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderWidth: 0.5,
        borderColor: theme.colors.gray,
        shadowColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    username: {
        fontSize: hp(1.7),
        color: theme.colors.textDark,
        fontWeight: theme.fonts.medium,
    },
    postTime: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
        fontWeight: theme.fonts.medium,
    },
    content: {
        gap: 10,
        marginBottom: 10,
    },
    postMedia: {
        height: hp(40),
        width: '100%',
        borderRadius: theme.radius.xl,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    count: {
        color: theme.colors.text,
        fontSize: hp(1.8),
    },
});
