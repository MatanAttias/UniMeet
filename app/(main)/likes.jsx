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
  likeUserBack,
  friendUserBack, 
} from '../../services/matchService';
import BottomBar from '../../components/BottomBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - wp(8)) / 2; 
export default function Likes() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('liked_you');
  const [likesData, setLikesData] = useState({
    liked_you: [],
    matches: [],
    active_chats: []
  });

  const tabs = [
    { id: 'liked_you', title: 'עשו לייק', icon: 'heart', color: theme.colors.rose },
    { id: 'matches', title: 'התאמות', icon: 'heart-multiple', color: '#FFD93D' },
    { id: 'active_chats', title: 'צ\'אטים פעילים', icon: 'chat', color: theme.colors.primary }
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

  // טיפול ב-“לייק חזרה” (רומנטי)
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
        loadLikesData();
      }
    } catch (error) {
      console.error('Error liking back:', error);
      Alert.alert('שגיאה', 'לא ניתן לבצע לייק');
    }
  };

  // טיפול ב-“קבלת בקשת חברות חזרה”
  const handleAcceptFriend = async (targetUser) => {
    try {
      const result = await friendUserBack(user.id, targetUser.id);
      
      if (result.matched && result.chatId) {
        Alert.alert(
          '👫 חברות!',
          `אתם עכשיו חברים עם ${targetUser.name}!\nרוצה לפתוח את הצ'אט?`,
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
        loadLikesData();
      }
    } catch (error) {
      console.error('Error accepting friend:', error);
      Alert.alert('שגיאה', 'לא ניתן לקבל בקשת חברות');
    }
  };

  // רינדור קלף עבור “לעשו לך לייק / בקשת חברות”
  const renderLikedYouCard = (likeData) => {
    const isFriendRequest = likeData.type === 'friend';

    return (
      <View key={likeData.id} style={styles.card}>
        {likeData.user.image ? (
          <Image
            source={{ uri: likeData.user.image }}
            style={styles.cardImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.cardImage, styles.placeholderImage]}>
            <MaterialCommunityIcons name="account" size={wp(15)} color="#666" />
          </View>
        )}

        <View 
          style={[
            styles.cardOverlay, 
            { backgroundColor: isFriendRequest 
                ? 'rgba(255, 217, 61, 0.9)' 
                : 'rgba(255, 79, 147, 0.9)' 
            }
          ]}
        >
          {isFriendRequest ? (
            <MaterialCommunityIcons 
              name="emoticon-happy-outline" 
              size={wp(5)} 
              color="white"
            />
          ) : (
            <MaterialCommunityIcons 
              name="heart" 
              size={wp(5)} 
              color="white"
            />
          )}
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {likeData.user.name}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {isFriendRequest 
              ? 'שלח לך בקשת חברות' 
              : 'עשה לך לייק'}
          </Text>
        </View>

        <Pressable 
          style={[
            styles.actionBtn, 
            { backgroundColor: isFriendRequest 
                ? theme.colors.primary 
                : theme.colors.rose 
            }
          ]}
          onPress={() => {
            if (isFriendRequest) {
              handleAcceptFriend(likeData.user);
            } else {
              handleLikeBack(likeData.user);
            }
          }}
        >
          {isFriendRequest ? (
            <MaterialCommunityIcons name="emoticon-happy-outline" size={wp(4)} color="white" />
          ) : (
            <MaterialCommunityIcons name="heart" size={wp(4)} color="white" />
          )}
        </Pressable>
      </View>
    );
  };

  const renderMatchCard = (matchData) => (
    <View key={matchData.id} style={styles.card}>
      {matchData.user.image ? (
        <Image
          source={{ uri: matchData.user.image }}
          style={styles.cardImage}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.cardImage, styles.placeholderImage]}>
          <MaterialCommunityIcons name="account" size={wp(15)} color="#666" />
        </View>
      )}
      <View style={[styles.cardOverlay, { backgroundColor: 'rgba(255, 217, 61, 0.9)' }]}>
        <MaterialCommunityIcons 
          name="heart-multiple" 
          size={wp(5)} 
          color="white"
        />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{matchData.user.name}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>התאמה מושלמת! 🎉</Text>
      </View>
      <Pressable 
        style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigateToChat(matchData.chatId, matchData.user)}
      >
        <MaterialCommunityIcons name="chat" size={wp(4)} color="white" />
      </Pressable>
    </View>
  );

  // רינדור קלף עבור צ'אט פעיל
  const renderActiveChatCard = (chatData) => (
    <View key={chatData.id} style={styles.card}>
      {chatData.user.image ? (
        <Image
          source={{ uri: chatData.user.image }}
          style={styles.cardImage}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.cardImage, styles.placeholderImage]}>
          <MaterialCommunityIcons name="account" size={wp(15)} color="#666" />
        </View>
      )}
      <View style={[styles.cardOverlay, { backgroundColor: `rgba(228, 113, 163, 0.9)` }]}>
        <MaterialCommunityIcons name="chat" size={wp(5)} color="white" />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{chatData.user.name}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {chatData.last_message ? chatData.last_message.substring(0, 25) + '...' : 'צ\'אט פעיל'}
        </Text>
      </View>
      <Pressable 
        style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigateToChat(chatData.id, chatData.user)}
      >
        <MaterialCommunityIcons name="chat" size={wp(4)} color="white" />
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
        liked_you: { 
          icon: 'heart-broken',
          title: 'אין לייקים חדשים',
          subtitle: 'כשמישהו יעשה לך לייק או בקשת חברות, תראה אותן כאן'
        },
        matches: {
          icon: 'heart-multiple',
          title: 'אין התאמות עדיין',
          subtitle: 'המשך לעשות לייקים ולשלוח בקשות חברות כדי למצוא התאמות!'
        },
        active_chats: {
          icon: 'chat-sleep',
          title: 'אין צ\'אטים פעילים',
          subtitle: 'התחל שיחות חדשות עם ההתאמות שלך'
        }
      };
      
      const emptyConfig = emptyMessages[selectedTab];
      
      return (
        <View style={styles.center}>
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name={emptyConfig.icon} 
              size={wp(20)} 
              color="#444" 
            />
            <Text style={styles.emptyTitle}>{emptyConfig.title}</Text>
            <Text style={styles.emptySubtitle}>{emptyConfig.subtitle}</Text>
          </View>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {currentData.map(item => {
            switch (selectedTab) {
              case 'liked_you':
                return renderLikedYouCard(item);
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
    <ScreenWrapper bg={theme.colors.background}>
      <View style={styles.headerContainer}>
        <Header title="לייקים" />
        
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
                selectedTab === tab.id && [styles.activeTab, { borderColor: tab.color }]
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <MaterialCommunityIcons 
                name={tab.icon} 
                size={wp(5)} 
                color={selectedTab === tab.id ? tab.color : '#666'} 
              />
              <Text style={[
                styles.tabText,
                selectedTab === tab.id && [styles.activeTabText, { color: tab.color }]
              ]}>
                {tab.title}
              </Text>
              {likesData[tab.id]?.length > 0 && (
                <View style={[styles.badge, { backgroundColor: tab.color }]}>
                  <Text style={styles.badgeText}>{likesData[tab.id].length}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>

        {/* Tip */}
        <View style={styles.tip}>
          <MaterialCommunityIcons name="lightbulb-on" size={wp(4)} color={theme.colors.primary} />
          <Text style={styles.tipText}>
            {selectedTab === 'liked_you' && 'ככל שתגיב מהר יותר, כך הסיכויים שלך טובים יותר'}
            {selectedTab === 'matches' && 'התאמות מושלמות! זמן לפתוח צ\'אט'}
            {selectedTab === 'active_chats' && 'הצ\'אטים הפעילים שלך'}
          </Text>
        </View>
      </View>

      {renderContent()}
      
      <BottomBar selected="likes" />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingBottom: hp(1),
  },
  tabsContainer: {
    maxHeight: hp(8),
    marginVertical: hp(1),
  },
  tabsContent: {
    paddingHorizontal: wp(4),
    gap: wp(3),
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: theme.radius.xl,
    gap: wp(2),
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
  },
  tabText: {
    color: '#666',
    fontSize: hp(1.6),
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  badge: {
    borderRadius: wp(3),
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
    fontSize: hp(1.1),
    fontWeight: 'bold',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(4),
    marginBottom: hp(1),
    gap: wp(2),
    backgroundColor: theme.colors.card,
    padding: wp(3),
    borderRadius: theme.radius.lg,
  },
  tipText: {
    color: theme.colors.textSecondary,
    fontSize: hp(1.4),
    flex: 1,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(12), 
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: wp(3),
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    marginBottom: hp(2),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: '100%',
    height: hp(20),
    position: 'relative',
  },
  placeholderImage: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardOverlay: {
    position: 'absolute',
    top: hp(1.5),
    left: wp(4),
    borderRadius: wp(6),
    width: wp(9),
    height: wp(9),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    padding: wp(3),
    flex: 1,
    minHeight: hp(7),
  },
  cardName: {
    color: theme.colors.textPrimary,
    fontSize: hp(2),
    fontWeight: 'bold',
    marginBottom: hp(0.5),
  },
  cardSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: hp(1.5),
    lineHeight: hp(2),
  },
  actionBtn: {
    position: 'absolute',
    bottom: wp(3),
    right: wp(3),
    borderRadius: wp(6),
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: wp(8),
  },
  emptyTitle: {
    color: theme.colors.textPrimary,
    fontSize: hp(2.5),
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  emptySubtitle: {
    color: theme.colors.textSecondary,
    fontSize: hp(1.8),
    textAlign: 'center',
    lineHeight: hp(2.5),
  },
});
