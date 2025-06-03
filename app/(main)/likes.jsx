// app/(main)/likes.jsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  fetchLikesAndRequests,
  respondToChatRequest,
  likeUserBack,
} from '../../services/matchService';
import BottomBar from '../../components/BottomBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - wp(6)) / 2; // 2 קלפים בשורה

export default function Likes() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('liked_you');
  const [likesData, setLikesData] = useState({
    liked_you: [],
    chat_requests: [],
    matches: [],
    active_chats: []
  });

  const tabs = [
    { id: 'liked_you', title: 'עשו לייק', icon: 'heart' },
    { id: 'chat_requests', title: 'בקשות צ\'אט', icon: 'message-text' },
    { id: 'matches', title: 'התאמות', icon: 'heart-multiple' },
    { id: 'active_chats', title: 'צ\'אטים פעילים', icon: 'chat' }
  ];

  useEffect(() => {
    if (!user?.id) return;
    loadLikesData();
  }, [user?.id]);

  const loadLikesData = async () => {
    setLoading(true);
    try {
      const data = await fetchLikesAndRequests(user.id);
      setLikesData(data);
    } catch (error) {
      console.error('❌ Error loading likes data:', error);
      Alert.alert('שגיאה', 'לא ניתן לטעון נתונים');
    } finally {
      setLoading(false);
    }
  };

  const navigateToChat = (chatId, targetUser) => {
    const chatData = {
      id: chatId,
      name: targetUser.name,
      image: targetUser.image,
    };
    
    router.push({
      pathname: `/privateChat/${chatId}`,
      params: {
        chat: JSON.stringify(chatData),
      },
    });
  };

  const handleLikeBack = async (targetUser) => {
    try {
      const result = await likeUserBack(user.id, targetUser.id);
      
      if (result.matched && result.chatId) {
        Alert.alert(
          '🎉 זה התאמה!',
          `יצרת התאמה עם ${targetUser.name}!\nרוצה לפתוח את הצ'אט?`,
          [
            {
              text: 'אחר כך',
              style: 'cancel',
              onPress: () => loadLikesData()
            },
            {
              text: 'פתח צ\'אט',
              onPress: () => navigateToChat(result.chatId, targetUser)
            }
          ]
        );
      } else {
        loadLikesData(); // Refresh the data
      }
    } catch (error) {
      console.error('Error liking back:', error);
      Alert.alert('שגיאה', 'לא ניתן לבצע לייק');
    }
  };

  const handleChatRequestResponse = async (requestId, targetUser, approved) => {
    try {
      const result = await respondToChatRequest(user.id, targetUser.id, approved);
      
      if (result.chatCreated && result.chatId) {
        Alert.alert(
          '🎉 צ\'אט נוצר!',
          `נוצר צ\'אט עם ${targetUser.name}!\nרוצה לפתוח אותו?`,
          [
            {
              text: 'אחר כך',
              style: 'cancel',
              onPress: () => loadLikesData()
            },
            {
              text: 'פתח צ\'אט',
              onPress: () => navigateToChat(result.chatId, targetUser)
            }
          ]
        );
      } else if (approved) {
        Alert.alert(
          '✅ נשלח!',
          'האישור שלך נשלח. מחכים לתגובת המשתמש השני.',
          [{ text: 'הבנתי', onPress: () => loadLikesData() }]
        );
      } else {
        loadLikesData(); // Just refresh for reject
      }
    } catch (error) {
      console.error('Error responding to chat request:', error);
      Alert.alert('שגיאה', 'לא ניתן לעדכן תגובה');
    }
  };

  const renderLikedYouCard = (likeData) => (
    <View key={likeData.id} style={styles.card}>
      <Image
        source={{ uri: likeData.user.image }}
        style={styles.cardImage}
        contentFit="cover"
      />
      <View style={styles.cardOverlay}>
        <MaterialCommunityIcons 
          name="heart" 
          size={wp(6)} 
          color={theme.colors.rose} 
          style={styles.likeIcon}
        />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{likeData.user.name}</Text>
        <Text style={styles.cardSubtitle}>עשה לייק לתמונה שלך</Text>
      </View>
      <Pressable 
        style={styles.likeBackBtn}
        onPress={() => handleLikeBack(likeData.user)}
      >
        <MaterialCommunityIcons name="heart" size={wp(5)} color="white" />
      </Pressable>
    </View>
  );

  const renderChatRequestCard = (requestData) => {
    const isLikeVsFriend = requestData.metadata?.user_preference === 'like' && 
                          requestData.metadata?.actor_preference === 'friend';
    const isFriendVsLike = requestData.metadata?.user_preference === 'friend' && 
                          requestData.metadata?.actor_preference === 'like';
    
    let title, subtitle;
    if (isLikeVsFriend) {
      title = `${requestData.actor.name} רוצה חברות`;
      subtitle = 'אתה רצית רומנטיקה - רוצה לנסות חברות?';
    } else if (isFriendVsLike) {
      title = `${requestData.actor.name} רוצה רומנטיקה`;
      subtitle = 'אתה רצית חברות - רוצה לנסות?';
    } else {
      title = `בקשת צ'אט מ-${requestData.actor.name}`;
      subtitle = 'העדפות שונות - רוצה לנסות בכל זאת?';
    }

    return (
      <View key={requestData.id} style={styles.requestCard}>
        <Image
          source={{ uri: requestData.actor.image }}
          style={styles.cardImage}
          contentFit="cover"
        />
        <View style={styles.cardOverlay}>
          <MaterialCommunityIcons 
            name="message-question" 
            size={wp(6)} 
            color={theme.colors.primary} 
            style={styles.likeIcon}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.requestActions}>
          <Pressable 
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleChatRequestResponse(requestData.id, requestData.actor, false)}
          >
            <MaterialCommunityIcons name="close" size={wp(4)} color="white" />
          </Pressable>
          <Pressable 
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => handleChatRequestResponse(requestData.id, requestData.actor, true)}
          >
            <MaterialCommunityIcons name="check" size={wp(4)} color="white" />
          </Pressable>
        </View>
      </View>
    );
  };

  const renderMatchCard = (matchData) => (
    <View key={matchData.id} style={styles.card}>
      <Image
        source={{ uri: matchData.user.image }}
        style={styles.cardImage}
        contentFit="cover"
      />
      <View style={styles.cardOverlay}>
        <MaterialCommunityIcons 
          name="heart-multiple" 
          size={wp(6)} 
          color={theme.colors.primary} 
          style={styles.likeIcon}
        />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{matchData.user.name}</Text>
        <Text style={styles.cardSubtitle}>התאמה!</Text>
      </View>
      <Pressable 
        style={styles.chatBtn}
        onPress={() => navigateToChat(matchData.chatId, matchData.user)}
      >
        <MaterialCommunityIcons name="chat" size={wp(5)} color="white" />
      </Pressable>
    </View>
  );

  const renderActiveChatCard = (chatData) => (
    <View key={chatData.id} style={styles.card}>
      <Image
        source={{ uri: chatData.user.image }}
        style={styles.cardImage}
        contentFit="cover"
      />
      <View style={styles.cardOverlay}>
        <MaterialCommunityIcons 
          name="chat" 
          size={wp(6)} 
          color={theme.colors.primary} 
          style={styles.likeIcon}
        />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{chatData.user.name}</Text>
        <Text style={styles.cardSubtitle}>
          {chatData.last_message ? chatData.last_message.substring(0, 30) + '...' : 'צ\'אט פעיל'}
        </Text>
      </View>
      <Pressable 
        style={styles.chatBtn}
        onPress={() => navigateToChat(chatData.id, chatData.user)}
      >
        <MaterialCommunityIcons name="chat" size={wp(5)} color="white" />
      </Pressable>
    </View>
  );

  const renderContent = () => {
    const currentData = likesData[selectedTab] || [];
    
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (currentData.length === 0) {
      const emptyMessages = {
        liked_you: 'אין לייקים חדשים כרגע',
        chat_requests: 'אין בקשות צ\'אט ממתינות',
        matches: 'אין התאמות עדיין',
        active_chats: 'אין צ\'אטים פעילים'
      };
      
      return (
        <View style={styles.center}>
          <MaterialCommunityIcons 
            name={tabs.find(t => t.id === selectedTab)?.icon || 'heart'} 
            size={wp(15)} 
            color="#666" 
          />
          <Text style={styles.emptyText}>{emptyMessages[selectedTab]}</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {currentData.map(item => {
            switch (selectedTab) {
              case 'liked_you':
                return renderLikedYouCard(item);
              case 'chat_requests':
                return renderChatRequestCard(item);
              case 'matches':
                return renderMatchCard(item);
              case 'active_chats':
                return renderActiveChatCard(item);
              default:
                return null;
            }
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenWrapper>
      <Header title="לייקים" />
      
      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map(tab => (
          <Pressable
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.id && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <MaterialCommunityIcons 
              name={tab.icon} 
              size={wp(5)} 
              color={selectedTab === tab.id ? theme.colors.primary : '#666'} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.id && styles.activeTabText
            ]}>
              {tab.title}
            </Text>
            {likesData[tab.id]?.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{likesData[tab.id].length}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Tip */}
      <View style={styles.tip}>
        <MaterialCommunityIcons name="lightbulb" size={wp(4)} color="#666" />
        <Text style={styles.tipText}>
          {selectedTab === 'liked_you' && 'ככל שתגיב מהר יותר, כך הסיכויים שלך טובים יותר'}
          {selectedTab === 'chat_requests' && 'בקשות צ\'אט נוצרות כשיש העדפות שונות'}
          {selectedTab === 'matches' && 'התאמות מושלמות! זמן לפתוח צ\'אט'}
          {selectedTab === 'active_chats' && 'הצ\'אטים הפעילים שלך'}
        </Text>
      </View>

      {renderContent()}
      
      <BottomBar selected="likes" />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    maxHeight: hp(8),
    marginVertical: hp(2),
  },
  tabsContent: {
    paddingHorizontal: wp(4),
    gap: wp(3),
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderRadius: 25,
    gap: wp(2),
    position: 'relative',
  },
  activeTab: {
    backgroundColor: theme.colors.primaryLight,
  },
  tabText: {
    color: '#666',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  badge: {
    backgroundColor: theme.colors.rose,
    borderRadius: 10,
    minWidth: wp(5),
    height: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -5,
    right: -5,
  },
  badgeText: {
    color: 'white',
    fontSize: hp(1.2),
    fontWeight: 'bold',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(4),
    marginBottom: hp(2),
    gap: wp(2),
  },
  tipText: {
    color: '#666',
    fontSize: hp(1.6),
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: wp(3),
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#2a2a2a',
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    marginBottom: hp(2),
  },
  requestCard: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    marginBottom: hp(2),
    flexDirection: 'row',
    height: hp(12),
  },
  cardImage: {
    width: '100%',
    height: hp(15),
    position: 'relative',
  },
  cardOverlay: {
    position: 'absolute',
    top: hp(1),
    left: wp(3),
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: wp(6),
    width: wp(8),
    height: wp(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeIcon: {
    // Icon styles handled by the component
  },
  cardInfo: {
    padding: wp(3),
    flex: 1,
  },
  cardName: {
    color: 'white',
    fontSize: hp(2),
    fontWeight: 'bold',
    marginBottom: hp(0.5),
  },
  cardSubtitle: {
    color: '#666',
    fontSize: hp(1.6),
  },
  likeBackBtn: {
    position: 'absolute',
    bottom: wp(3),
    right: wp(3),
    backgroundColor: theme.colors.rose,
    borderRadius: wp(6),
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBtn: {
    position: 'absolute',
    bottom: wp(3),
    right: wp(3),
    backgroundColor: theme.colors.primary,
    borderRadius: wp(6),
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestActions: {
    flexDirection: 'row',
    padding: wp(3),
    gap: wp(2),
    alignItems: 'center',
  },
  actionBtn: {
    borderRadius: wp(6),
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    backgroundColor: theme.colors.primary,
  },
  rejectBtn: {
    backgroundColor: '#666',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(2),
  },
  emptyText: {
    color: '#666',
    fontSize: hp(2),
    textAlign: 'center',
  },
});