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
import { Image } from 'react-native';
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
import UserCityFromLocation from '../../components/UserCityFromLocation'
import { MaterialIcons } from '@expo/vector-icons';

var limit = 0;
const Profile = () => {
  const { user, setUserData, setAuth } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [showPosts, setShowPosts] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); 
  const [menuVisible, setMenuVisible] = useState(false); 

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
  const handleMenuToggle = () => {
    setMenuVisible(prev => !prev);
  };
  const handleLogout = async () => {
    Alert.alert('אישור', 'אתה בטוח שאתה רוצה להתנתק?', [
      {
        text: 'ביטול',
        onPress: () => console.log('modal cancelled'),
        styles: 'cancel',
      },
      {
        text: 'התנתק',
        onPress: () => onLogout(),
        style: 'destructive',
      },
    ]);
  };
  const goToPreviousStep = () => {
    router.back();
  };
  
  return (
    
    <ScreenWrapper bg = {theme.colors.background}>
           <Pressable style={styles.backToWelcomeButton} onPress={goToPreviousStep}>
          <Text style={styles.backToWelcomeText}>חזור</Text>
        </Pressable>
      <View>
      <TouchableOpacity
        onPress={() => setMenuVisible(!menuVisible)}
        style={{
          width: 30, 

        }}
      >
      <TouchableOpacity
        onPress={() => setMenuVisible(!menuVisible)}
        style={{
          marginTop: -30,   
          right: -15,     
          zIndex: 10     
            }}
      >
        <MaterialCommunityIcons name="dots-vertical" size={28} color="white" />
      </TouchableOpacity>
      
    </TouchableOpacity>

      {menuVisible && (
  <View style={styles.menuContainer} >
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        setMenuVisible(false);
        router.push('/settings');
            }}
    >
      <Text style={styles.menuText}>הגדרות</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => {
        setMenuVisible(false);
        handleLogout();
      }}
    >

        <Text style={[styles.menuText, { color: 'red' }]}>התנתק</Text>
      </TouchableOpacity>
    </View>
  )}
</View>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>פרופיל</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => {
            setActiveTab('posts');
            if (!showPosts) {
              setShowPosts(true);
              getPosts();
            }
          }}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>פוסטים</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        style={{ flex: 1 }}
        data={activeTab === 'posts' && showPosts ? posts : []}
        ListHeaderComponent={
          <>
            {activeTab === 'profile' && (
              <UserHeader user={user} router={router} handleLogout={handleLogout} />
            )}
          </>
        }
        ListHeaderComponentStyle={{ marginBottom: 30 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listStyle}
        keyExtractor={(item, index) => item.id ? `post-${item.id}` : `default-${index}`}
        renderItem={({ item }) =>
          activeTab === 'posts' ? (
            <PostCard item={item} currentUser={user} router={router} />
          ) : null
        }
        onEndReached={() => {
          if (activeTab === 'posts' && showPosts) getPosts();
        }}
        onEndReachedThreshold={0}
        ListFooterComponent={
          activeTab === 'posts' && showPosts ? (
            hasMore ? (
              <View style={{ marginVertical: posts.length === 0 ? 100 : 30 }}>
                <Loading />
              </View>
            ) : (
              <View style={{ marginVertical: 30 }}>
                <Text style={styles.noPosts}>אין עוד פוסטים</Text>
              </View>
            )
          ) : null
        }
      />
    </ScreenWrapper>
  );
};

const UserHeader = ({ user, router, handleLogout }) => {
  if (!user) return null; 

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showPosts, setShowPosts] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); 
  const [showEdit, setShowEdit] = useState(true);

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
    if (!tags) return null;
  
    const tagList = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
      ? tags.split(',').map(t => t.trim())
      : [];
  
    if (tagList.length === 0) return null;
  
    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.tagCategory}>{label}</Text>
        <View style={styles.tagList}>
          {tagList.map((tag, index) => (
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
        <Header title="פרטי פרופיל" mb={30} />
      </View>

      <View style={styles.container}>
        <View style={{ gap: 15 }}>
          <View style={styles.avatarContainer}>
            <Avatar
              uri={user?.image}
              size={hp(12)}
              rounded={theme.radius.xxl * 1.4}
            />
            {showEdit !== false && (
            <Pressable style={styles.editIcon} onPress={() => router.push('editProfile')}>
              <Icon name="edit" strokeWidth={2.5} size={20} />
            </Pressable>
          )}
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={styles.userName}>
            {user?.fullName || user?.name || 'No name'}
          </Text>
          {user?.location ? (
            <UserCityFromLocation location={user.location} />
          ) : (
            <Text style={styles.infoText}>מיקום לא זמין</Text>
          )}
        </View>

          {['gender', 'birth_date', 'status', 'connectionTypes'].some(key => !!user?.[key]) && (
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
          
            <View style={styles.separator} />
          
            {user.connectionTypes && (
              <View style={[styles.inlineItem, { flexDirection: 'row-reverse', marginTop: 8 }]}>
                <MaterialCommunityIcons name="magnify-plus-outline" size={28} color={theme.colors.primary} />
                <Text style={styles.inlineText}>{user.connectionTypes}</Text>
              </View>
            )}
          
            {user.preferredMatch && (
              <View style={[styles.inlineItem, { flexDirection: 'row-reverse', marginTop: 8 }]}>
                <MaterialCommunityIcons name="account-heart" size={28} color={theme.colors.primary} />
                <Text style={styles.inlineText}>{user.preferredMatch}</Text>
              </View>
            )}
          </MotiView>
          )}

          {user?.introduction && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
              style={styles.infoBox}
            >
              <View style={styles.introductionContainer}>
                <MaterialCommunityIcons
                  name="comment-text-outline"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.introductionText}>{user.introduction}</Text>
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

            {user.traits?.length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>תחביבים</Text>
                {renderTagList('', user.hobbies)}
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
                <Text style={styles.subSectionTitle}>רקע בריאותי</Text>
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
    backgroundColor: '##CDB0AA', 
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
    textAlign: 'center',
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
    textAlign: 'center',
  },
  
  // כפתור התנתקות מתוקן
  logoutButton: {
    position: 'absolute',
    top: hp(7),
    left: wp(4),
    zIndex: 10,
    backgroundColor: theme.colors.rose,
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: hp(1.5),
    fontWeight: '600',
    marginRight: 6, 
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
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    width: '100%',
    marginVertical: 8,
  },
  connectionText: {
    textAlign: 'center',
    fontSize: 16,
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
    fontSize: 20,
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
    fontSize: 18,
    textAlign: 'right',
  },
  subSectionTitle: {
    fontSize: 21,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
    marginTop: 10,
    textAlign: 'right',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginHorizontal: 10,
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textLight,
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  backToWelcomeButton: {
    position: 'absolute',
    top: hp(8),
    right: hp(4),
    width: '14%',
    backgroundColor: theme.colors.card,
    paddingVertical: hp(1.0),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  backToWelcomeText: {
    color: theme.colors.primary,
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
  
  introductionContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    width: '100%',
  },
  introductionText: {
    fontSize: hp(2),
    color: theme.colors.text,
    fontWeight: theme.fonts.semibold,
    marginLeft: 8,
    fontSize: 16,
  },
  
  menuContainer: {
    backgroundColor: '#1a1a1a',
    position: 'absolute',
    top: 10,
    left: 1,                 
    borderRadius: 12,
    elevation: 4,              
    shadowColor: '#000',       
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 8,
    zIndex: 999,
    alignItems: 'flex-start',      
  },
  
  menuItem: {
    paddingVertical: 12,
    paddingLeft: 8,           
    paddingRight: 12,          
    flexDirection: 'row',      
    alignItems: 'center',
    
  },

  
  menuText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'left',   
    fontWeight: '500',
  },
  
  logoutText: {
    color: 'red',
  },
});