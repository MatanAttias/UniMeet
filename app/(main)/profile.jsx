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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
import { Audio } from 'expo-av';
import { AnimatePresence, MotiView } from 'moti';


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
    
    <ScreenWrapper bg="black">
      <FlatList
        style={{ flex: 1 }} // זה קריטי

        data={showPosts ? posts : []}
        ListHeaderComponent={
          <>
            <UserHeader user={user} router={router} handleLogout={handleLogout} />
            {!showPosts && (
              <TouchableOpacity
                style={styles.showPostsBtn}
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
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showPosts, setShowPosts] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // profile or posts


  const playSound = async () => {
    if (!user.audio) return;

    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPlaybackStatus(null);
      return;
    }
    

    const { sound: newSound } = await Audio.Sound.createAsync({ uri: user.audio });
    setSound(newSound);
    await newSound.playAsync();
    setIsPlaying(true);

    newSound.setOnPlaybackStatusUpdate((status) => {
      setPlaybackStatus(status);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackStatus(null);
        newSound.unloadAsync();
        setSound(null);
      }
    });
  };

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);
  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
  
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
  
    return age;
  };

  const renderInfo = (label, value) => {
    if (value === null || value === undefined) return null;
    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.infoBox}
      >
        <Text style={styles.infoText}>
          {label}: {Array.isArray(value) ? value.join(', ') : value}
        </Text>
      </MotiView>
    );
  };
  
 
  const renderTagList = (label, tags) => {
    if (!tags || tags.length === 0) return null;
  
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.tagCategory}>{label}</Text>
        <View style={styles.tagList}>
          {tags.map((tag, index) => (
            <View key={index} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const getFormattedTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: wp(4) }}>
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
            <Text style={styles.userName}>
              {user?.fullName || user?.name || 'No name'}
            </Text>
            <Text style={styles.infoText}>{user?.address || 'No address'}</Text>
          </View>

          {(user.gender || user.birth_date || user.status || user.connectionTypes) && (
            <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.infoBox}
          >
            <View style={styles.row}>
              {user.birth_date && (
                <View style={styles.inlineItem}>
                  <MaterialCommunityIcons name="cake-variant" size={18} color={theme.colors.primary} />
                  <Text style={styles.inlineText}>{calculateAge(user.birth_date)}</Text>
                </View>
              )}
              {user.gender && (
                <View style={styles.inlineItem}>
                  <MaterialCommunityIcons name="gender-male-female" size={18} color={theme.colors.primary} />
                  <Text style={styles.inlineText}>{user.gender}</Text>
                </View>
              )}
              {user.status && (
                <View style={styles.inlineItem}>
                  <MaterialCommunityIcons name="heart" size={18} color={theme.colors.primary} />
                  <Text style={styles.inlineText}>{user.status}</Text>
                </View>
              )}
            </View>
          
            {/* פס שקוף מתחת לשלושת הפרמטרים */}
            <View style={styles.separator} />
          
            {/* הצגת connectionTypes */}
            {user.connectionTypes && (
              <View style={[styles.inlineItem, { flexDirection: 'row-reverse', marginTop: 8 }]}>
                <MaterialCommunityIcons name="magnify-plus-outline" size={28} color={theme.colors.primary} />
                <Text style={styles.inlineText}>{user.connectionTypes}</Text>
              </View>
            )}
          
            {/* הצגת preferredMatch מתחת ל connectionTypes */}
            {user.preferredMatch && (
              <View style={[styles.inlineItem, { flexDirection: 'row-reverse', marginTop: 8 }]}>
                <MaterialCommunityIcons name="account-heart" size={28} color={theme.colors.primary} />
                <Text style={styles.inlineText}>{user.preferredMatch}</Text>
              </View>
            )}
          </MotiView>
          )}

                    {user.introduction && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
              style={styles.infoBox}
            >
              <View style={styles.inlineItem}>
                <MaterialCommunityIcons
                  name="comment-text-outline" // אייקון מתאים להקדמה
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.inlineText}>{user.introduction}</Text>
              </View>
            </MotiView>
            )}     
          {(user.showTraits || user.showHobbies || user.showIdentities || user.showSupportNeeds) && (
            <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.infoBox}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="brain" size={20} color="white" style={{ marginStart: 6 }} />
              <Text style={styles.sectionTitle}>המאפיינים הייחודיים שלי</Text>
            </View>
          
            {user.traits?.length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>תכונות</Text>
                {renderTagList('', user.traits)}
              </>
            )}
          
            {user.communicationStyles?.length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>סגנונות תקשורת</Text>
                {renderTagList('', user.communicationStyles)}
              </>
            )}
          
            {user.identities?.length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>זהויות</Text>
                {renderTagList('', user.identities)}
              </>
            )}
          
            {user.supportNeeds?.length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>צרכים</Text>
                {renderTagList('', user.supportNeeds)}
              </>
            )}
          </MotiView>
          )}

          {user.audio && (
            <View style={styles.audioContainer}>
              {user.prompt && (
                <Text style={styles.audioPrompt}>{user.prompt}</Text>
              )}

              <TouchableOpacity style={styles.audioPlayBtn} onPress={playSound}>
                <Icon name={isPlaying ? 'pause' : 'play'} size={28} color="white" />
              </TouchableOpacity>

              {playbackStatus && (
                <View style={styles.progressWrapper}>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${
                            (playbackStatus.positionMillis / playbackStatus.durationMillis) * 100
                          }%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.timeText}>
                    {getFormattedTime(playbackStatus.positionMillis)} /{' '}
                    {getFormattedTime(playbackStatus.durationMillis)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, 
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
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.textLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7,
  },
  userName: {
    fontSize: hp(3),
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  infoBox: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoText: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  logoutButton: {
    position: 'absolute',
    right: 0,
    padding: 5,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.rose,
  },
  listStyle: {
    paddingHorizontal: wp(4),
    paddingBottom: 30,
  },
  noPosts: {
    fontSize: hp(2),
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  showPostsBtn: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  audioButton: {
    backgroundColor: theme.colors.primary,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  audioContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  audioPrompt: {
    fontSize: hp(2),
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  audioPlayBtn: {
    backgroundColor: theme.colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressWrapper: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
  },
  timeText: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  inlineItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 6,
  },
  inlineText: {
    fontSize: 20,
    color: theme.colors.textPrimary,
    marginHorizontal: 6,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    width: '100%',
    marginVertical: 8,
  },
  connectionText: {
    textAlign: 'center',
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  tagCategory: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'right',
  },
  tagList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 8,
  },
  tagPill: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    marginLeft: 8,
  },
  tagText: {
    color: 'white',
    fontSize: 13,
    textAlign: 'right',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
    marginTop: 10,
    textAlign: 'right',
  },
});