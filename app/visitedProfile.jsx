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
  const [user, setUser] = useState(null);

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
    if (existingChats.length > 0) return existingChats[0];

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
  
    const chatId = chatObj.id;
    const message = messageText.trim();
  
    console.log("שולח הודעה...");
    console.log("message:", message);
    console.log("user.id:", user?.id);
    console.log("chatId:", chatId);
  
    const { data, error } = await supabase.from("messages").insert({
      content: message,
      sender_id: user.id,
      chat_id: chatId,
    });
  
    if (error) {
      console.error("שגיאה בשמירת ההודעה:", error.message);
      Alert.alert('שגיאה', 'לא ניתן לשלוח את ההודעה. נסה שוב.');
      return;
    }
  
    console.log("ההודעה נשמרה, מעדכן את last_message...");
  
    const { error: updateError } = await supabase
      .from("chats")
      .update({
        last_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chatId);
  
    if (updateError) {
      console.error("שגיאה בעדכון last_message בצ'אט:", updateError.message);
      Alert.alert('שגיאה', 'ההודעה נשלחה אך לא עודכנה בתצוגה.');
    } else {
      console.log("last_message עודכן בהצלחה");
      Alert.alert('הצלחה', 'ההודעה נשלחה!');
    }
  
    setMessageText('');
    setModalVisible(false);
  };

  const getPosts = async () => {
    if (!hasMore) return;
    const limit = posts.length + 10;
    const res = await fetchPosts(limit, userData.id);
    if (res.success) {
      if (posts.length === res.data.length) setHasMore(false);
      setPosts(prev => {
        const postIds = new Set(prev.map(post => post.id));
        const unique = res.data.filter(post => !postIds.has(post.id));
        return [...prev, ...unique];
      });
    }
  };

  const goBack = () => router.back();

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} />;

  return (
    <ScreenWrapper bg="black">
      {/* Header עם כפתורי חזור והודעה */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={goBack}>
          <Text style={styles.backText}>חזור</Text>
        </Pressable>

        {userData && (
          <Pressable style={styles.messageButton} onPress={openMessageModal}>
            <MaterialCommunityIcons name="message-text-outline" size={28} color={theme.colors.primary} />
          </Pressable>
        )}
      </View>

      {/* טאב של פרופיל/פוסטים */}
      <View style={styles.tabs}>
        <Pressable onPress={() => setActiveTab('profile')} style={styles.tabButton}>
          <Text style={activeTab === 'profile' ? styles.activeTab : styles.inactiveTab}>פרופיל</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setActiveTab('posts');
            if (!showPosts) {
              setShowPosts(true);
              getPosts();
            }
          }}
          style={styles.tabButton}
        >
          <Text style={activeTab === 'posts' ? styles.activeTab : styles.inactiveTab}>פוסטים</Text>
        </Pressable>
      </View>

      <FlatList
        data={activeTab === 'posts' ? posts : []}
        ListHeaderComponent={
          activeTab === 'profile' && userData ? <UserHeader user={userData} router={router} /> : null
        }
        renderItem={({ item }) =>
          activeTab === 'posts' ? <PostCard item={item} currentUser={userData} router={router} /> : null
        }
        keyExtractor={(item) => item.id.toString()}
        onEndReached={() => {
          if (activeTab === 'posts') getPosts();
        }}
        ListFooterComponent={
          activeTab === 'posts' && showPosts ? (
            hasMore ? <Loading /> : <Text style={styles.noMorePosts}>אין עוד פוסטים</Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 30 }}
      />

      {/* מודל לשליחת הודעה */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
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
    </ScreenWrapper>
  );
};

export default VisitedProfile;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingTop: hp(6),
    marginBottom: hp(2),
    marginTop: -80,
  },
  backButton: {
    backgroundColor: theme.colors.card,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
  messageButton: {
    padding: hp(1),
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tabButton: {
    marginHorizontal: 10,
  },
  activeTab: {
    color: 'white',
    fontWeight: 'bold',
  },
  inactiveTab: {
    color: 'gray',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#0000',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // לאנדרואיד
  },
  noMorePosts: {
    color: '#aaa', // אפור בהיר ונעים לעין
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginVertical: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1e1e1e', // רקע כהה אלגנטי
    borderRadius: 10,
    alignSelf: 'center',
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginTop: 100,
    elevation: 3,
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
    textAlign: 'right',
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
    elevation: 5,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
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