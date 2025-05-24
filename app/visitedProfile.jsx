import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import ScreenWrapper from '../components/ScreenWrapper';
import UserHeader from '../components/UserHeader';
import PostCard from '../components/PostCard';
import Loading from '../components/Loading';
import { fetchPosts } from '../services/PostService';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';

const VisitedProfile = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [showPosts, setShowPosts] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [modalVisible, setModalVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [chatObj, setChatObj] = useState(null);

  // זה חייב להיות המשתמש המחובר - תחליף לפי איך אתה מקבל משתמש מחובר
  const [user, setUser] = useState(null);

  // לדוגמה בלבד: השגת המשתמש המחובר מ־Supabase
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchVisitedUser = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        Alert.alert('שגיאה', 'לא ניתן לטעון משתמש');
        setLoading(false);
        return;
      }

      setUserData(data);
      setLoading(false);
    };

    fetchVisitedUser();
  }, [userId]);

  const openMessageModal = async () => {
    if (!user || !userData) {
      Alert.alert('שגיאה', 'משתמש לא מחובר או משתמש לא תקין');
      return;
    }
    // מצא או צור צ'אט קודם לפתיחת החלון
    const chat = await findOrCreateChat(user.id, userData.id);
    setChatObj(chat);
    setModalVisible(true);
  };

  const findOrCreateChat = async (userId1, userId2) => {
    const { data: existingChats, error } = await supabase
      .from('chats')
      .select('*')
      .or(
        `and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`
      )
      .limit(1);

    if (error) {
      console.error('שגיאה בחיפוש צ׳אט:', error.message);
      return null;
    }

    if (existingChats.length > 0) {
      return existingChats[0];
    }

    // צור שיחה חדשה אם לא קיימת
    const { data: newChat, error: insertError } = await supabase
      .from('chats')
      .insert([
        {
          user1_id: userId1,
          user2_id: userId2,
          last_message: '',
          updated_at: null,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('שגיאה ביצירת צ׳אט חדש:', insertError.message);
      return null;
    }

    return newChat;
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !chatObj || !user) {
      Alert.alert('שגיאה', 'אנא מלא הודעה וודא שאתה מחובר.');
      return;
    }

    const receiverId =
      chatObj.user1_id === user.id ? chatObj.user2_id : chatObj.user1_id;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatObj.id,
        sender_id: user.id,
        receiver_id: receiverId,
        message_type: 'text',
        content: messageText.trim(),
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('שגיאה בשליחת הודעה:', error.message, error.details);
      Alert.alert('שגיאה', 'לא ניתן לשלוח את ההודעה. נסה שוב.');
    } else {
      Alert.alert('הצלחה', 'ההודעה נשלחה!');
      setMessageText('');
      setModalVisible(false);

      // עדכן את פרטי השיחה
      await supabase
        .from('chats')
        .update({
          last_message: messageText.trim(),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', chatObj.id);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} />;
  const goBack = () => router.back();

  return (
    <ScreenWrapper bg="black">
      <Pressable style={styles.backButton} onPress={goBack}>
        <Text style={styles.backText}>חזור</Text>
      </Pressable>

      {userData && (
        <Pressable style={styles.messageButton} onPress={openMessageModal}>
          <MaterialCommunityIcons name="message-text-outline" size={28} color={theme.colors.primary} />
        </Pressable>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>שלח הודעה ל-{userData?.name || 'משתמש'}</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="כתוב כאן את ההודעה..."
              placeholderTextColor="gray"
              value={messageText}
              onChangeText={setMessageText}
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>ביטול</Text>
              </Pressable>
              <Pressable style={styles.sendButton} onPress={sendMessage}>
                <Text style={styles.buttonText}>שלח</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
        <Pressable onPress={() => setActiveTab('profile')} style={{ marginHorizontal: 10 }}>
          <Text style={{ color: activeTab === 'profile' ? 'white' : 'gray' }}>פרופיל</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setActiveTab('posts');
            if (!showPosts) {
              setShowPosts(true);
              getPosts();
            }
          }}
          style={{ marginHorizontal: 10 }}
        >
          <Text style={{ color: activeTab === 'posts' ? 'white' : 'gray' }}>פוסטים</Text>
        </Pressable>
      </View>

      <FlatList
        data={activeTab === 'posts' ? posts : []}
        ListHeaderComponent={activeTab === 'profile' && userData ? <UserHeader user={userData} router={router} /> : null}
        renderItem={({ item }) =>
          activeTab === 'posts' ? <PostCard item={item} currentUser={userData} router={router} /> : null
        }
        keyExtractor={(item) => item.id.toString()}
        onEndReached={() => {
          if (activeTab === 'posts') getPosts();
        }}
        ListFooterComponent={
          activeTab === 'posts' && showPosts ? (
            hasMore ? (
              <Loading />
            ) : (
              <Text style={{ color: 'white', textAlign: 'center' }}>אין עוד פוסטים</Text>
            )
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </ScreenWrapper>
  );
};
export default VisitedProfile;

const styles = StyleSheet.create({
    backButton: {
        position: 'absolute',
        top: hp(8),
        right: hp(4),
        backgroundColor: theme.colors.card,
        paddingVertical: hp(1),
        paddingHorizontal: wp(3),
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        marginTop: -30,
      },
      backText: {
        color: theme.colors.primary,
        fontSize: hp(2),
        fontWeight: theme.fonts.semibold,
      },
      messageButton: {
        padding: hp(1),
        marginLeft: wp(3),
        marginBottom: -20,
      },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)', 
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '90%',
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      paddingVertical: 25,
      paddingHorizontal: 30,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 10,
    },
    modalTitle: {
      fontSize: hp(3),
      fontWeight: 'bold',
      marginBottom: 18,
      color: theme.colors.primary,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    input: {
        minHeight: 100,
        borderColor: theme.colors.primary,
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 15,
        color: 'white',
        textAlignVertical: 'top',
        marginBottom: 25,
        fontSize: hp(2.1),
        writingDirection: 'rtl',
        textAlign: 'right', // <-- הוספתי את זה
      },
    modalButtons: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
    },
    cancelButton: {
      backgroundColor: '#777',
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 5,
    },
    sendButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 12,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.7,
      shadowRadius: 10,
      elevation: 8,
    },
    buttonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: hp(2.2),
      writingDirection: 'rtl',
      textAlign: 'center',
    },
  });



