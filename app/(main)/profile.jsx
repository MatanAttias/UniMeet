import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    FlatList,
  } from 'react-native';
  import React, { useEffect, useState } from 'react';
  import ScreenWrapper from '../../components/ScreenWrapper';
  import { useRouter } from 'expo-router';
  import Header from '../../components/Header';
  import { useAuth } from '../../contexts/AuthContext';
  import { hp, wp } from '../../constants/helpers/common';
  import { theme } from '../../constants/theme';
  import { supabase } from '../../lib/supabase';
  import Icon from '../../assets/icons';
  import Avatar from '../../components/Avatar';
  import { fetchPosts } from '../../services/PostService';
  import PostCard from '../../components/PostCard';
  import Loading from '../../components/Loading';
  
  var limit = 0;
  const Profile = () => {
    const { user, setUserData, setAuth } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [showPosts, setShowPosts] = useState(false);
  
    useEffect(() => {
      const fetchUserData = async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user?.id)
          .single();
  
        if (error) {
          console.error('Error fetching user data:', error);
          Alert.alert('Error', 'Failed to fetch user data.');
        } else {
          setUserData(data);
        }
        setLoading(false);
      };
  
      if (user?.id) {
        fetchUserData();
      }
    }, [user?.id]);
  
    const onLogout = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Sign Out', 'Error signing out!');
      } else {
        setAuth(null);
        router.replace('/login');
      }
    };
  
    const getPosts = async () => {
      if (!hasMore) return null;
      limit = limit + 10;
  
      let res = await fetchPosts(limit, user.id);
      if (res.success) {
        if (posts.length === res.data.length) setHasMore(false);
  
        setPosts(prevPosts => {
          const postIds = new Set(prevPosts.map(post => post.id));
          const uniquePosts = res.data.filter(post => !postIds.has(post.id));
          return [...prevPosts, ...uniquePosts];
        });
      }
    };
  
    if (loading) {
      return <ActivityIndicator size="large" color={theme.colors.primary} />;
    }
  
    const handleLogout = async () => {
      Alert.alert('Confirm', 'Are you sure you want to log out?', [
        {
          text: 'Cancel',
          onPress: () => console.log('modal cancelled'),
          styles: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => onLogout(),
          style: 'destructive',
        },
      ]);
    };
  
    return (
      <ScreenWrapper bg="white">
        <FlatList
          data={showPosts ? posts : []}
          ListHeaderComponent={
            <>
              <UserHeader user={user} router={router} handleLogout={handleLogout} />
              {!showPosts && (
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.colors.primary,
                    padding: 12,
                    borderRadius: 10,
                    marginTop: 20,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setShowPosts(true);
                    getPosts();
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Show Posts</Text>
                </TouchableOpacity>
              )}
            </>
          }
          ListHeaderComponentStyle={{ marginBottom: 30 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
          keyExtractor={(item, index) => (item.id ? `post-${item.id}` : `default-${index}`)}
          renderItem={({ item }) => (
            <PostCard item={item} currentUser={user} router={router} />
          )}
          onEndReached={() => {
            if (showPosts) getPosts();
          }}
          onEndReachedThreshold={0}
          ListFooterComponent={
            showPosts ? (
              hasMore ? (
                <View style={{ marginVertical: posts.length === 0 ? 100 : 30 }}>
                  <Loading />
                </View>
              ) : (
                <View style={{ marginVertical: 30 }}>
                  <Text style={styles.noPosts}>No more posts</Text>
                </View>
              )
            ) : null
          }
        />
      </ScreenWrapper>
    );
  };
  
  const UserHeader = ({ user, router, handleLogout }) => {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', paddingHorizontal: wp(4) }}>
        <View>
          <Header title="Profile" mb={30} />
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" color={theme.colors.rose} />
          </TouchableOpacity>
        </View>
  
        <View style={styles.container}>
          <View style={{ gap: 15 }}>
            <View style={styles.avatarContainer}>
              <Avatar
                uri={user?.image}
                size={hp(12)}
                rounded={theme.radius.xxl * 1.4}
              />
              <Pressable style={styles.editIcon} onPress={() => router.push('editProfile')}>
                <Icon name="edit" strokeWidth={2.5} size={20} />
              </Pressable>
            </View>
  
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={styles.userName}>{user?.name || 'No name'}</Text>
              <Text style={styles.infoText}>{user?.address || 'No address'}</Text>
            </View>
  
            <View style={{ gap: 10 }}>
              <View style={styles.info}>
                <Icon name="mail" size={20} color={theme.colors.textLight} />
                <Text style={styles.infoText}>{user?.email || 'No email'}</Text>
              </View>
              {user?.phoneNumber && (
                <View style={styles.info}>
                  <Icon name="call" size={24} color={theme.colors.textLight} />
                  <Text style={styles.infoText}>{user.phoneNumber}</Text>
                </View>
              )}
              {user?.bio && <Text style={styles.infoText}>{user.bio}</Text>}
            </View>
          </View>
        </View>
      </View>
    );
  };
  
  export default Profile;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    headerContainer: {
      marginHorizontal: wp(4),
      marginBottom: 20,
    },
    headerShape: {
      width: wp(100),
      height: hp(20),
    },
    avatarContainer: {
      height: hp(12),
      width: hp(12),
      alignSelf: 'center',
    },
    editIcon: {
      position: 'absolute',
      bottom: -12,
      right: -12,
      padding: 7,
      borderRadius: 50,
      backgroundColor: 'white',
      shadowColor: theme.colors.textLight,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 5,
      elevation: 7,
    },
    userName: {
      fontSize: hp(3),
      fontWeight: '500',
      color: theme.colors.textDark,
    },
    info: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    infoText: {
      fontSize: hp(1.6),
      fontWeight: '500',
      color: theme.colors.textLight,
    },
    logoutButton: {
      position: 'absolute',
      right: 0,
      padding: 5,
      borderRadius: theme.radius.sm,
      backgroundColor: '#fee2e2',
    },
    listStyle: {
      paddingHorizontal: wp(4),
      paddingBottom: 30,
    },
    noPosts: {
      fontSize: hp(2),
      textAlign: 'center',
      color: theme.colors.text,
    },
  });