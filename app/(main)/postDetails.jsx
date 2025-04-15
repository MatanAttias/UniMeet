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
import { supabase } from '../../lib/supabase'
import { createNotification } from '../../services/notificationService';
import input from '../../components/input';


const PostDetails = () => {
    const { postId, commentId } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();
    const [startLoading, setStartLoading] = useState(true);
    const inputRef = useRef(null);
    const commentRef = useRef('');
    const [loading, setLoading] = useState(false);
    const [post, setPost] = useState(null);

    const handleNewComment = async (payload) =>{
        console.log('got new comment ', payload.new)
        if(payload.new){
            let newComment = {...payload.new}
            let res = await getUserData(newComment.userId)
            newComment.user = res.success? res.data: {}
            setPost(prevPost =>{
                return { 
                    ...prevPost,
                    comments: [newComment, ...prevPost.comments]
                }
            })
        }
    }

        

    useEffect(() => {
                let commentChannel = supabase
                .channel('comments')
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public',
                    table: 'comments',
                    filter: `postId=eq.${postId}`                
                }, handleNewComment)    
                .subscribe()

                getPostDetails();

            return () => {
                supabase.removeChannel(commentChannel)
            }
        }, [])


    const getPostDetails = async () => {
        let res = await fetchPostDetails(postId);
        if (res.success) setPost(res.data);
        setStartLoading(false);
    };

    const onNewComment = async () => {
        // לוגים לבדיקת הערך של commentRef
        console.log('Comment Text:', commentRef.current);
        console.log('User ID:', user?.id);
        console.log('Post ID:', post?.id);

        if (!commentRef.current || commentRef.current.trim() === '') {
            Alert.alert('Error', 'Please enter a comment before submitting.');
            return;
        }

        let data = {
            userId: user?.id,
            postId: post?.id,
            text: commentRef.current,
        };

        // create comment
        setLoading(true);
        let res = await createComment(data);
        setLoading(false);
        if (res.success) {
            if(user.id != post.userId){
                // send notification
                let notify = {
                    senderId: user.id,
                    receiverId: post.userId,
                    title: 'commented on your post',
                    data: JSON.stringify({postId: post.id, commentId: res?.data?.id})
                }
                createNotification(notify)
            }
            inputRef?.current?.clear();
            commentRef.current = "";
            getPostDetails(); // רענון הפוסט
        } else {
            Alert.alert('Comment Error', res.msg || 'Failed to post comment.');
        }
    };

    const  onDeleteComment = async (comment)=>{
        console.log('deleting comment: ', comment)
        let res = await removeComment(comment?.id)
        if(res.success){
            setPost(prevPost=>{
                let updatedPost = {...prevPost}
                updatedPost.comments = updatedPost.comments.filter(c=> c.id != comment.id)
                return updatedPost
            })
        }else{
            Alert.alert('Comment', res.msg)
        }
    }

    const onDeletePost = async (item)=>{
        //delete post here
        let res = await removePost(post.id)
        if(res.success){
            router.push({ pathname: '/home', params: { refresh: 'true' } })
        }else{
            Alert.alert('Post', res.msg)
        }
    }

    const onEditPost = async (item)=>{
        router.back()
        router.push({pathname: 'newPost' , params: {...item}})
    }

    if (startLoading) {
        return (
            <View style={styles.center}>
                <Loading />
            </View>
        );
    }
    
    if(!post){
      return ( 
        <View style={[styles.center, {justifyContent: 'flex-start', marginTop: 100}]}>
            <Text style={styles.notFound}> Post not found! </Text>
        </View>
      )
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? hp(10) : 0}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                keyboardShouldPersistTaps="handled"
            >
                <PostCard
                    item={{...post, comments: [{count: post?.comments.length}]}}
                    currentUser={user}
                    router={router}
                    hasShadow={false}
                    showMoreIcon={false}
                    showDelete={true}
                    onDelete={onDeletePost}
                    onEdit={onEditPost}
                />

                {/* תיבת התגובה */}
                <View style={styles.inputContainer}>
                    <TextInput
                        ref={inputRef}
                        placeholder="Type your comment..."
                        onChangeText={(value) => (commentRef.current = value)}
                        placeholderTextColor={theme.colors.textLight}
                        style={styles.inputStyle}
                        multiline={true}
                        textAlignVertical="top"
                    />

                    {loading ? (
                        <View style={styles.loading}>
                            <Loading size="small" />
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.sendIcon} onPress={onNewComment}>
                            <Icon name="send" color={theme.colors.primaryDark} />
                        </TouchableOpacity>
                    )}
                </View>
                
                {/* comment list */}
                <View style={{marginVertical: 15, gap: 17}}>
                    {
                        post?.comments?.map(comment=>
                            <CommentItem
                                key={comment?.id?.toString()}
                                item={comment}
                                onDelete={() => onDeleteComment(comment)}
                                highlight = {commentId == commentId}
                                canDelete = {user.id == comment.userId || user.id == post.userId}
                            />
                        )
                    }
                    {
                        post?.comments?.length==0 && (
                            <Text style={{color: theme.colors.text, marginLeft: 5}}>
                                Be first to comment!
                            </Text>
                        )
                    }
                </View>


            </ScrollView>
        </KeyboardAvoidingView>
    );
};


export default PostDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start', // שינוי כדי שהטקסט והכפתור יתיישרו בחלק העליון
        gap: wp(2),
        paddingHorizontal: wp(4),
        paddingVertical: hp(2),
        backgroundColor: '#f5f5f5', // רקע בהיר לאזור התגובה
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
