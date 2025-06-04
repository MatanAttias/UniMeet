import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Animated,
    Modal,
    TouchableWithoutFeedback,
    FlatList,
  } from 'react-native';
  import { Image } from 'react-native';
  import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
  import React, { useEffect, useState, useRef } from 'react';
  import { useRouter, useLocalSearchParams } from 'expo-router';
  import ScreenWrapper from '../../../components/ScreenWrapper';
  import { useAuth } from '../../../contexts/AuthContext';
  import { theme } from '../../../constants/theme';
  import * as ImagePicker from 'expo-image-picker';
  import { hp, wp } from '../../../constants/helpers/common';
  import { supabase } from '../../../lib/supabase';
  import Avatar from '../../../components/Avatar';
  import { useFocusEffect } from '@react-navigation/native';
  import { useCallback } from 'react';
  import * as FileSystem from 'expo-file-system';
  import { Buffer } from 'buffer'; // ודא שהתקנת את זה: npm i buffer

  const Settings = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const [chatPartnerName, setChatPartnerName] = useState('');
    const { chat } = useLocalSearchParams();
    const chatObj = chat ? JSON.parse(chat) : null; 
    const [chatPartnerImage, setChatPartnerImage] = useState('');
    const flatListRef = useRef();
    const sendButtonAnim = useRef(new Animated.Value(0)).current;
    
    const animatedSendColor = sendButtonAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#ccc', theme.colors.primary],
      });
    const fetchMessages = async () => {
      if (!user || !chatObj?.id) return;
  
      try {
        const { data: messagesData, error } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chatObj.id)
          .order("created_at", { ascending: true });
  
        if (error) {
          console.log("שגיאה בשליפת הודעות:", error.message);
        } else {
          setMessages(messagesData);
        }
      } catch (err) {
        console.error("שגיאה כללית:", err.message);
      }
    };
    useEffect(() => {
      if (!chatObj?.id || !user?.id) return;
    
      const markChatAsRead = async () => {
        const isUser1 = user.id === chatObj.user1_id;
    
        await supabase
          .from('chats')
          .update({
            user1_read: isUser1 ? true : undefined,
            user2_read: isUser1 ? undefined : true,
          })
          .eq('id', chatObj.id);
      };
    
      markChatAsRead();
    }, [chatObj?.id, user?.id]);
    
    useFocusEffect(
      useCallback(() => {
        const loadChats = async () => {
          setLoading(true);
          try {
            const { data, error } = await supabase.auth.getUser();
            if (error || !data?.user) throw error || new Error('No user logged in');
    
            const currentUser = data.user;
            setUser(currentUser);
            const chatsData = await fetchUserChats(currentUser.id);
            const sortedChats = chatsData.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
            setChats(sortedChats);
          } catch (err) {
            console.error('Error fetching chats:', err.message);
          } finally {
            setLoading(false);
          }
        };
    
        loadChats();
      }, [])
    );
    const fetchChatPartnerName = async () => {
        if (!chatObj || !user) return;
      
        try {
          // שליפת המזהים של שני המשתמשים מהטבלה chats
          const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .select('user1_id, user2_id')
            .eq('id', chatObj.id)
            .single();
      
          if (chatError) {
            console.error("שגיאה בשליפת נתוני הצ׳אט:", chatError);
            return;
          }
      
          const partnerId = chatData.user1_id === user.id ? chatData.user2_id : chatData.user1_id;
      
          // שליפה של שם ותמונה מהטבלה users
          const { data, error } = await supabase
            .from('users')
            .select('name, image')
            .eq('id', partnerId)
            .single();
      
          if (error) {
            console.error('שגיאה בשליפת נתוני בן השיחה:', error);
          } else {
            setChatPartnerName(data.name);
            setChatPartnerImage(data.image); // ודא שיש לך useState כזה
          }
        } catch (err) {
          console.error('שגיאה כללית בשליפת שם/תמונה של בן השיחה:', err.message);
        }
      };
      
              
  
    useEffect(() => {
        if (user && chatObj) {
            fetchChatPartnerName();
            fetchMessages();
          }
        }, [user, chatObj]);

  
    const sendMessage = async () => {
      if (!messageText.trim() || !chatObj || !user) return;
    
      const messageContent = messageText.trim();
    
      // הוספת ההודעה לטבלת messages
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatObj.id,
          sender_id: user.id,
          message_type: 'text',
          content: messageContent,
        })
        .select()
        .single();
    
      if (messageError) {
        console.error('שגיאה בשליחת הודעה:', messageError);
        return;
      }
    
      // עדכון הצ'אט עם ההודעה האחרונה
      const { error: updateChatError } = await supabase
        .from('chats')
        .update({
          last_message: messageContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chatObj.id);
    
      if (updateChatError) {
        console.error('שגיאה בעדכון הצ׳אט:', updateChatError);
      }
    
      // שליפת נתוני הצ׳אט כדי לדעת מי המשתמש 1 ומי 2
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('user1_id, user2_id')
        .eq('id', chatObj.id)
        .single();
    
      if (chatError || !chatData) {
        console.error('שגיאה בשליפת נתוני הצ׳אט לעדכון סטטוס קריאה:', chatError?.message);
      } else {
        const isUser1 = chatData.user1_id === user.id;
    
        // עדכון שדות הקריאה: שולח = true, מקבל = false
        const updates = isUser1
          ? { user1_read: true, user2_read: false }
          : { user2_read: true, user1_read: false };
    
        const { error: readUpdateError } = await supabase
          .from('chats')
          .update(updates)
          .eq('id', chatObj.id);
    
        if (readUpdateError) {
          console.error('שגיאה בעדכון סטטוס קריאה:', readUpdateError);
        }
      }
    
      // עדכון ההודעות במסך
      setMessages((prev) => [...prev, messageData]);
      setMessageText('');
    };
    
    const toggleModal = () => {
      setModalVisible(!modalVisible);
      Animated.timing(animation, {
        toValue: modalVisible ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };
   
    

    const uploadImageAndSendMessage = async (imageUri) => {
      if (!imageUri) return;
    
      const fileName = `chat_${Date.now()}.jpg`;
      const filePath = `chatImages/${fileName}`;
    
      try {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists || fileInfo.size === 0) {
          console.log('❌ File does not exist or is empty.');
          return;
        }
    
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
    
        const buffer = Buffer.from(base64, 'base64');
    
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, buffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });
    
        if (uploadError) {
          console.log('❌ Upload error:', uploadError);
          return;
        }
    
        const { data: publicUrlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);
    
        const imageUrl = publicUrlData?.publicUrl;
    
        if (!imageUrl) {
          console.log('❌ Failed to get public URL');
          return;
        }
    
        const receiverId = chatObj.user1_id === user.id ? chatObj.user2_id : chatObj.user1_id;
    
        const { error: insertError } = await supabase.from('messages').insert({
          chat_id: chatObj.id,
          sender_id: user.id,
          receiver_id: receiverId,
          message_type: 'image',
          content: imageUrl,
        });
    
        if (insertError) {
          console.log('❌ Insert message error:', insertError);
        } else {
          console.log('✅ Image message sent!');
        }
      } catch (err) {
        console.log('❌ Upload exception:', err);
      }
    };
    const pickImage = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
    
      if (!result.canceled && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log('Picked image:', imageUri);
        await uploadImageAndSendMessage(imageUri);
        setModalVisible(false);
      }
    };
    useEffect(() => {
        if (flatListRef.current && messages.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, [messages]);
  
      const takePhoto = async () => {
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
        });
      
        if (!result.canceled && result.assets.length > 0) {
          const imageUri = result.assets[0].uri;
          await uploadImageAndSendMessage(imageUri);
          setModalVisible(false);
        }
      };
    useEffect(() => {
        Animated.timing(sendButtonAnim, {
          toValue: messageText.trim().length > 0 ? 1 : 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }, [messageText]);
      const goBack = () => {
        router.replace('/chats?refresh=true');
      };  
    if (!chatObj || !user) {
        return (
          <ScreenWrapper bg="black">
            <Text style={{ color: 'white', textAlign: 'center', marginTop: hp(10) }}>טוען...</Text>
          </ScreenWrapper>
        );
      }
      useEffect(() => {
        if (!chatObj?.id) return;
      
        const subscription = supabase
          .channel('messages-realtime')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `chat_id=eq.${chatObj.id}`,
            },
            (payload) => {
              setMessages((prev) => {
                const exists = prev.some(msg => msg.id === payload.new.id);
                if (exists) return prev;
                return [...prev, payload.new];
              });
            }
          )
          .subscribe();
      
        return () => {
          supabase.removeChannel(subscription);
        };
      }, [chatObj?.id]);


      
    return (
<ScreenWrapper bg="black">
  <View style={styles.topBar}>
    <Pressable style={styles.backButton} onPress={goBack}>
      <Text style={styles.backText}>חזור</Text>
    </Pressable>

    <View style={styles.chatInfoContainer}>
      {chatPartnerImage ? (
        <Image
          source={{ uri: chatPartnerImage }}
          style={styles.profileImage}
        />
      ) : (
        <Avatar />
      )}
      <Text style={styles.chatPartnerName}>
        {chatPartnerName || '...'}
      </Text>
    </View>
  </View>

  <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
    <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
      <View style={styles.modalBackground}>
        <Animated.View style={[styles.modalContent, { opacity: animation }]}>
          <Text style={styles.modalTitle}>בחר פעולה</Text>
          <TouchableOpacity style={styles.modalButton} onPress={pickImage}>
            <Text style={styles.modalButtonText}>📁 העלה תמונה</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalButton} onPress={takePhoto}>
            <Text style={styles.modalButtonText}>📷 צלם תמונה</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  </Modal>

  <View style={{ flex: 1, backgroundColor: '#000', paddingHorizontal: 10 }}>
  <FlatList
  ref={flatListRef}
  data={messages}
  keyExtractor={(item, index) => `${item.id || item.created_at}-${index}`}  renderItem={({ item }) => {
    const isMine = item.sender_id === user.id;

    return (
          <View style={
            item.message_type === 'image'
              ? (isMine ? styles.imageBubbleMine : styles.imageBubbleOther)
              : (isMine ? styles.messageBubbleMine : styles.messageBubbleOther)
          }>        {item.message_type === 'image' ? (
              <Image
                source={{ uri: item.content }}
                style={{
                  width: 250,
                  height: 370,
                  borderRadius: 20,
                }}
                resizeMode="cover"
              />
            ) : (
      <Text Text style={styles.messageText}>{String(item.content)}</Text>      
      )}
      </View>
    );
    
  }}
  contentContainerStyle={{
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
  }}
  showsVerticalScrollIndicator={false}
/>
 <View style={styles.inputContainer}>
  {/* כפתור הפלוס - בצד שמאל */}
  <TouchableOpacity onPress={toggleModal} style={styles.plusButton}>
    <MaterialCommunityIcons name="plus" size={28} color="white" />
  </TouchableOpacity>

  <TextInput
    value={messageText}
    onChangeText={setMessageText}
    placeholder="כתוב הודעה..."
    style={[styles.input, { color: theme.colors.textSecondary }]}
    />
  <TouchableOpacity onPress={sendMessage} disabled={!messageText.trim()}>
    <Animated.Text style={[styles.sendButtonText, { color: animatedSendColor }]}>
      שלח
    </Animated.Text>
  </TouchableOpacity>

  {/* כפתור השליחה - בצד ימין */}
  <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
    <MaterialCommunityIcons name="send" size={24} color="white" />
  </TouchableOpacity>
</View>


  </View>

  
</ScreenWrapper>

    );
  };
  
  export default Settings;
  
  const styles = StyleSheet.create({
    topBar: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingVertical: hp(2),
        paddingHorizontal: wp(4),
        backgroundColor: '#121212',
        borderBottomColor: '#2c2c2e',
        borderBottomWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
      },
    backButton: {
      marginLeft: wp(3),
    },
    backText: {
      color: '#fff',
      fontSize: 16,
    },
    chatInfoContainer: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      flex: 1,
    },
    chatPartnerName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginRight: 12,
      },
      profileImage: {
        width: 42,
        height: 42,
        borderRadius: 21,
        marginLeft: 10,
      },
    modalBackground: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#222',
      padding: 20,
      borderRadius: 12,
      width: '80%',
      alignItems: 'center',
    },
    modalTitle: {
      color: '#fff',
      fontSize: 18,
      marginBottom: 15,
    },
    modalButton: {
      backgroundColor: '#444',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginTop: 10,
      width: '100%',
      alignItems: 'center',
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 16,
    },
    messageInputContainer: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      backgroundColor: '#222',
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: '#333',
    },
    input: {
      flex: 1,
      backgroundColor: theme.primary,
      backgroundColor: '#333',
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginRight: 10,
      fontSize: 16,
    },
    sendButton: {
      backgroundColor: theme.primary,
      borderRadius: 20,
      padding: 10,
    },
    sendButtonText: {
      color: '#fff',
      fontSize: 16,
    },
    messageBubbleMine: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary,
        marginVertical: 6,
        padding: 12,
        borderRadius: 20,
        borderBottomRightRadius: 4,
        maxWidth: '75%',
        shadowColor: '#1e90ff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      messageBubbleOther: {
        alignSelf: 'flex-start',
        backgroundColor: '#2c2c2e',
        marginVertical: 6,
        padding: 12,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        maxWidth: '75%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      messageText: {
        color: '#fff',
        fontSize: 16,
      },
      inputContainer: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
        backgroundColor: theme.colors.background,
      },
      textInput: {
        flex: 1,
        padding: 10,
        borderRadius: 25,
        backgroundColor: theme.colors.background,
        fontSize: 16,
      },
      sendButtonText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: 'bold',
      },
      

      sendButton: {
        backgroundColor: theme.primary,
        borderRadius: 20,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
      },
      plusButton: {
        padding: 10, // או כל ערך מתאים
        backgroundColor: '#2c2c2e',
        borderRadius: 20,
      },
      imageBubbleMine: {
        alignSelf: 'flex-end',
        backgroundColor: 'transparent',
        marginVertical: 6,
        padding: 0,
        borderRadius: 20,
        maxWidth: '75%',
      },
      imageBubbleOther: {
        alignSelf: 'flex-start',
        backgroundColor: 'transparent',
        marginVertical: 6,
        padding: 0,
        borderRadius: 20,
        maxWidth: '75%',
      },
  });
  