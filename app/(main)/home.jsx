import { Alert, Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { useAuth} from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import { useRouter } from 'expo-router';
import Icon from '../../assets/icons';
import Avatar from '../../components/Avatar';
import { fetchPosts } from '../../services/PostService';
import PostCard from '../../components/PostCard';
import Loading from '../../components/Loading'
import { getUserData } from '../../services/userService'

var limit = 0

const Home = () => {
  
    const {user, setAuth} = useAuth();
    const router = useRouter();
    const [hasMore, setHasMore] = useState(true) 

    const [posts, setPosts] = useState([])
    const handePostEvent = async (payload)=>{
        if(payload.eventType == 'INSERT' && payload?.new?.id){
            let newPost = {...payload.new}
            let res = await getUserData(newPost.userId)
            newPost.user = res.success? res.data: {}
            setPosts(prevPosts => [newPost, ...prevPosts])

        }
    }

    useEffect(()=>{
        let postChannel = supabase
        .channel('posts')
        .on('postgres_changes', {event: '*', schema: 'public', table: 'posts'}, handePostEvent)
        .subscribe()
        // getPosts()

        return ()=>{
            supabase.removeChannel(postChannel)
        }
    },[])

    const getPosts = async ()=>{
        // call the api here
        if(!hasMore) return null
        limit = limit + 4

        console.log('fetching post: ', limit)
        let res = await fetchPosts(limit)
        if(res.success){
            if(posts.length==res.data.length) setHasMore(false)
            setPosts(res.data)

        }
    }


   return (
    <ScreenWrapper bg="white">
        <View style ={styles.container}>
            {/*header*/}
            <View style ={styles.header}>
                    <Text style = {styles.title}>LinkUp</Text>
                    <View style ={styles.icons}>

                        <Pressable onPress={()=> router.push('notifications')}>
                            <Icon name="heart" size={hp(4.5)} strokeWidth={2} color={theme.colors.textDark}/>
                        </Pressable>

                        <Pressable onPress={()=> router.push('newPost')}>
                            <Icon name="plus" type="entypo" size={hp(4.5)} color="black" />                      
                        </Pressable>

                        <Pressable onPress={()=> router.push('profile')}>
                            <Avatar
                                uri={user?.image}
                                size={hp(5.5)} 
                                rounded={theme.radius.sm} 
                                style={{
                                    borderWidth: 5, 
                                    borderColor: '#fff', 
                                    shadowColor: '#000', 
                                    shadowOffset: { width: 4, height: 3 }, 
                                    shadowOpacity: 0.15,
                                    shadowRadius: 5, 
                                }}/>
                         
                        </Pressable>
                    </View>
            </View>
            
            {/* posts */}
            <FlatList
                data={posts}    
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listStyle}
                keyExtractor={item=> item.id.toString()}
                renderItem={({item})=> <PostCard
                    item={item}
                    currentUser={user}
                    router={router}
                    />
            }
            onEndReached={()=>{
                getPosts()
            }}
            onEndReachedThreshold={0}
            ListFooterComponent={hasMore? (
                <View style={{margeVertical: posts.length==0? 200: 30}}>
                    <Loading />
                </View>    
            ):(
                <View style={{marginVertical: 30}}>
                    <Text style={styles.noPosts}> No more posts</Text>
                </View>    
            )}
         />   
        </View> 
    </ScreenWrapper>
  )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // paddingHorizontal: wp(4)
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        marginHorizontal: wp(4),
    },

    title: {
        color: theme.colors.text,
        fontSize: hp(3.2),
        fontWeight: theme.fonts.bold,
    },

    avatarImage: {
        height: hp(4.3),
        width: hp(4.3),
        borderRadius: theme.radius.sm,
        borderCurve: 'continuous',
        borderColor: theme.colors.gray,
        borderWidth: 3,
    },

    icons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 18,
    },

    listStyle: {
        paddingTop: 20,
        paddingHorizontal: wp(4),
    },

    noPosts: {
        fontSize: hp(2),
        textAlign: 'center',
        color: theme.colors.text,
    },

    pill: {
        position: 'absolute',
        right: -10,
        top: -4,
        height: hp(2.2),
        width: hp(2.2),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: theme.colors.roseLight,
    },

    pillText: {
        color: 'white',
        fontSize: hp(1.2),
        fontWeight: theme.fonts.bold,
    }
});

