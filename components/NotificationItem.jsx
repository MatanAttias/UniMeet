import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { hp, wp } from '../constants/helpers/common'
import Avatar from './Avatar'
import moment from 'moment'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { Image } from 'expo-image'
import { getSupabaseFileUrl } from '../services/imageService'

const NotificationItem = ({
    item,
    router
}) => {

    const handleClick = () => {
        // פתיחת פרטי הפוסט
        try {
            const data = JSON.parse(item?.data || '{}')
            const { postId, commentId } = data
            if (postId) {
                router.push({
                    pathname: 'postDetails', 
                    params: { postId, commentId }
                })
            }
        } catch (error) {
            console.error('Error parsing notification data:', error)
        }
    }

    const getTimeAgo = (dateString) => {
        if (!dateString) return 'זמן לא ידוע';
        
        const now = moment();
        const notificationTime = moment(dateString);
        const diffInMinutes = now.diff(notificationTime, 'minutes');
        const diffInHours = now.diff(notificationTime, 'hours');
        const diffInDays = now.diff(notificationTime, 'days');
        
        if (diffInMinutes < 1) return 'עכשיו';
        if (diffInMinutes < 60) return `${diffInMinutes}ד'`;
        if (diffInHours < 24) return `${diffInHours}ש'`;
        if (diffInDays === 1) return '1ד ';
        if (diffInDays < 7) return `${diffInDays}ד'`;
        
        return notificationTime.format('D/M');
    };

    // קבלת נתונים על ההתראה
    const getNotificationData = () => {
        try {
            const data = JSON.parse(item?.data || '{}')
            const type = data.type

            switch (type) {
                case 'like':
                    return {
                        message: 'עשה לייק לפוסט שלך',
                        iconName: 'heart',
                        iconColor: theme.colors.rose,
                        postPreview: data.postPreview,
                        postId: data.postId
                    }
                case 'comment':
                    return {
                        message: 'הגיב לפוסט שלך',
                        iconName: 'comment',
                        iconColor: theme.colors.primary,
                        postPreview: data.postPreview,
                        postId: data.postId,
                        commentText: data.commentText
                    }
                default:
                    return {
                        message: item?.title || 'התראה חדשה',
                        iconName: 'bell',
                        iconColor: theme.colors.textSecondary,
                        postPreview: '',
                        postId: null
                    }
            }
        } catch (error) {
            return {
                message: item?.title || 'התראה חדשה',
                iconName: 'bell',
                iconColor: theme.colors.textSecondary,
                postPreview: '',
                postId: null
            }
        }
    }

    // קבלת תמונת הפוסט
    const getPostImage = () => {
        try {
            const data = JSON.parse(item?.data || '{}')
            return data.postImage || null
        } catch (error) {
            return null
        }
    }

    const notificationData = getNotificationData()
    const timeAgo = getTimeAgo(item?.created_at)
    const senderName = item?.sender?.name || 'משתמש לא ידוע'
    const postImage = getPostImage()

    return (
        <TouchableOpacity style={styles.container} onPress={handleClick}>
            {/* אווטר של השולח */}
            <Avatar
                uri={item?.sender?.image}
                size={hp(5)}
                rounded={theme.radius.md}
            />
            
            {/* תוכן ההתראה */}
            <View style={styles.content}>
                <View style={styles.textContent}>
                    <Text style={styles.notificationText}>
                        <Text style={styles.senderName}>{senderName}</Text>
                        <Text style={styles.actionText}> {notificationData.message}</Text>
                        <Text style={styles.timeText}> {timeAgo}</Text>
                    </Text>
                    
                    {/* תגובה אם זה comment */}
                    {notificationData.commentText && (
                        <Text style={styles.commentPreview}>
                            "{notificationData.commentText}"
                        </Text>
                    )}
                </View>
            </View>

            {/* תמונת הפוסט או אייקון */}
            <View style={styles.rightSide}>
                {postImage ? (
                    <Image
                        source={getSupabaseFileUrl(postImage)}
                        style={styles.postThumbnail}
                        contentFit="cover"
                    />
                ) : (
                    <View style={[styles.iconContainer, { backgroundColor: notificationData.iconColor + '20' }]}>
                        <MaterialCommunityIcons
                            name={notificationData.iconName}
                            size={hp(2.5)}
                            color={notificationData.iconColor}
                        />
                    </View>
                )}
            </View>
        </TouchableOpacity>  
    )
}

export default NotificationItem

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: wp(3),
        borderRadius: theme.radius.lg,
        marginBottom: hp(0.8),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    content: {
        flex: 1,
        marginRight: wp(3),
        marginLeft: wp(3),
    },
    textContent: {
        alignItems: 'flex-end',
    },
    notificationText: {
        fontSize: hp(1.7),
        lineHeight: hp(2.2),
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    senderName: {
        fontWeight: theme.fonts.bold,
        color: theme.colors.textPrimary,
    },
    actionText: {
        fontWeight: theme.fonts.medium,
        color: theme.colors.textSecondary,
    },
    timeText: {
        fontWeight: theme.fonts.medium,
        color: theme.colors.textLight,
    },
    commentPreview: {
        fontSize: hp(1.5),
        color: theme.colors.textLight,
        fontStyle: 'italic',
        textAlign: 'right',
        writingDirection: 'rtl',
        marginTop: hp(0.3),
    },
    rightSide: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    postThumbnail: {
        width: hp(5),
        height: hp(5),
        borderRadius: theme.radius.md,
    },
    iconContainer: {
        width: hp(5),
        height: hp(5),
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
});