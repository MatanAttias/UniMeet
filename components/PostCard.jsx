import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { Share } from 'react-native';

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

const PostCard = ({ item, currentUser, router, hasShadow = true }) => {
    const shadowStyles = {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
    };
    
    const [likes, setLikes] = useState([])

    useEffect(()=>  {
        setLikes(item?.postLikes)
    },[])

    const openPostDetails = () => {};

    const onLike = async ()=>{
        if(liked){
            // remove like
            let updatedLikes = likes.filter(like=> like.userId!=currentUser?.id)

            setLikes([...updatedLikes])
            let res = await removePostLike(item?.id, currentUser?.id)
            console.log('removed like: ', res)
            if(!res.success){
                Alert.alert('Post', 'Something went wrong!')
            }
        }else{
            // create like
            let data = {
                userId: currentUser?.id,
                postId: item?.id
            }
            setLikes([...likes, data])
            let res = await createPostLike(data)
            console.log('added like: ', res)
            if(!res.success){
                Alert.alert('Post', 'Something went wrong!')
            }
        }
    
    }

    const onShare = async ()=> {
        let content = {message: stripHtmlTags(item?.body)}
        Share.share(content)
    }
    const createdAt = moment(item?.created_at).format('D MMM');
    const liked = likes.filter(like=> like.userId == currentUser?.id)[0]? true: false

    return (
        <View style={[styles.container, hasShadow && shadowStyles]}>
            <View style={styles.header}>
                {/* user info and post time */}
                <View style={styles.userInfo}>
                    <Avatar
                        size={hp(4.5)}
                        uri={item?.user?.image}
                        rounded={theme.radius.md}
                    />
                    <View style={{ gap: 2 }}>
                        <Text style={styles.username}>{item?.user?.name}</Text>
                        <Text style={styles.postTime}>{createdAt}</Text>
                    </View>
                </View>

                <TouchableOpacity onPress={openPostDetails}>
                    <Icon name="threeDotsHorizontal" size={hp(3.4)} strokeWidth={3} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            {/* post body & media */}
            <View style={styles.content}>
                <View style={styles.postBody}>
                    {item?.body && (
                        <RenderHtml
                            contentWidth={wp(100)}
                            source={{ html: item?.body }}
                            tagsStyles={tagsStyles}
                        />
                    )}
                </View>

                {/* post media (images or videos) */}
                {item?.file && (
                    item.file.includes('postImages') ? (
                        <Image
                            source={getSupabaseFileUrl(item?.file)}
                            transition={100}
                            style={styles.postMedia}
                            contentFit="cover"
                        />
                    ) : item.file.includes('postVideos') ? (
                        <Video
                            style={[styles.postMedia, { height: hp(30) }]}
                            source={{ uri: getSupabaseFileUrl(item?.file)?.uri }}
                            useNativeControls
                            resizeMode="cover"
                            isLooping
                            onError={(e) => console.log("Video Error:", e)} // לוג לשגיאות
                        />
                    ) : null
                )}
            </View>
            {/* like comments and share */}
            <View style={styles.footer}>
                <View style={styles.footerButton}>
                    <TouchableOpacity onPress={onLike}>
                        <Icon name="heart" size={24} fill={liked? theme.colors.rose: 'transparent'} color={liked? theme.colors.rose: theme.colors.textLight} />
                    </TouchableOpacity>
                    <Text style={styles.count}>
                        {
                            likes?.length
                        }
                    </Text>
                </View>
                <View style={styles.footerButton}>
                    <TouchableOpacity>
                        <Icon name="comment" size={24} color={theme.colors.textLight} />
                    </TouchableOpacity>
                    <Text style={styles.count}>
                        {
                            0
                        }
                    </Text>
                </View>
                <View style={styles.footerButton}>
                    <TouchableOpacity onPress={onShare}>
                        <Icon name="share" size={24} color={theme.colors.textLight} />
                    </TouchableOpacity>
                   
                   
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
        borderCurve: 'continuous',
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
        borderCurve: 'continuous',
    },
    postBody: {
        marginLeft: 5,
    },
    footer: {
        flexDirection: 'row', // שורה אופקית
        alignItems: 'center', // יישור אנכי למרכז
        flexWrap: 'nowrap', // מונע עטיפה לשורות חדשות
        paddingHorizontal: 5, // מרווח קטן בצדדים
    },
    footerButton: {
        flexDirection: 'row', // סמל וטקסט זה לצד זה
        alignItems: 'center', // יישור אנכי
        gap: 10, // מרווח קטן בין סמל לטקסט
    },
    count: {
        color: theme.colors.text,
        fontSize: hp(1.8),
    },
    tightFooterButton: {
        flexDirection: 'row-reverse', // מציג את האלמנטים מימין לשמאל
        alignItems: 'center',
        gap: 0,
    },
});