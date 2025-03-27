import { ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { fetchPostDetails } from '../../services/PostService'
import { hp, wp } from '../../constants/helpers/common'
import { theme } from '../../constants/theme'
import PostCard from '../../components/PostCard'
import { useAuth } from '../../contexts/AuthContext'
import Loading from '../../components/Loading'
import Input from '../../components/input'


const PostDetails = () => {
    const {postId} = useLocalSearchParams()
    const {user} = useAuth()
    const router = useRouter()
    const [startLoading, setStartLoading] = useState(true)
    const inputRef = useRef(null)
    const commentRef = useRef(null)


    const [post, setPost] = useState(null)

    useEffect(()=>{
        getPostDetails()
    },[])

    const getPostDetails = async ()=>{
        // fetch post details here
        let res = await fetchPostDetails(postId)
        if(res.success) setPost(res.data)
        setStartLoading(false)    
    }

    if(startLoading){
        return (
            <View style={styles.center}>
                <Loading />
            </View>
        )
    }
  return (
    <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
            <PostCard 
                item={post}
                currentUser={user}
                router={router}
                hasShadow={false}
                showMoreIcon = {false}
            />    

            {/*  comment input */}
            <View style={styles.inputContainer}>
                <Input
                    inputRef={inputRef}
                    placeholder="Type comment.."
                    placeholderTextColor={theme.colors.textLight}
                    containerStyle={{flex: 1, height: hp(6.2), borderRadius: theme.radius.xl}}
                />
            </View>

        </ScrollView>
    </View>
  )
}

export default PostDetails

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
      paddingVertical: wp(7),
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    list: {
      paddingHorizontal: wp(4),
    },
    sendIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.8,
      borderColor: theme.colors.primary,
      borderRadius: theme.radius.lg,
      borderCurve: 'continuous',
      height: hp(5.8),
      width: hp(5.8),
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
      transform: [{ scale: 1.3 }],
    }
  });
  