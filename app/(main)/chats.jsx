import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import { useRouter } from 'expo-router';
import Avatar from '../../components/Avatar';
import { fetchUserChats } from '../../services/chatServices';

export default function ChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const loadChats = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          throw error || new Error('No user logged in');
        }

        const id = data.user.id;
        console.log('Logged in user ID (UUID):', id);

        setUserId(id);
        const chatsData = await fetchUserChats(id);
        setChats(chatsData);
      } catch (error) {
        console.error('Error fetching chats:', error.message);
        Alert.alert('שגיאה', 'לא ניתן לטעון שיחות כרגע');
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, []);

  const openChat = (chat) => {
    router.push({
        pathname: `/privateChat/${chat.id}`,
        params: {
          chat: JSON.stringify(chat),
        },
    });
  };

  const renderItem = ({ item }) => (
    <Pressable style={styles.chatItem} onPress={() => openChat(item)}>
      <Avatar uri={item.image} size={hp(6)} rounded={theme.radius.full} />
      <View style={styles.chatContent}>
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastMessage || 'התחל את השיחה'}
        </Text>
      </View>
    </Pressable>
  );

  if (loading) {
    return <Text style={{ textAlign: 'center', marginTop: hp(10) }}>טוען צ׳אטים...</Text>;
  }

  const goBack = () => router.back();

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={goBack}>
        <Text style={styles.backText}>חזור</Text>
      </Pressable>
      <Text style={styles.title}>הצ'אטים שלי</Text>
      <View style={styles.separator} />
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
              אין עדיין שיחות
            </Text>
          }      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: hp(3),
    paddingHorizontal: wp(4),
  },
  title: {
    fontSize: hp(3),
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: hp(6),
    color: theme.colors.primary,
  },
  listContent: {
    paddingBottom: hp(3),
    marginTop: hp(4),
  },
  chatItem: {
    flexDirection: 'row-reverse',
    backgroundColor: theme.colors.card,
    padding: hp(1.8),
    borderRadius: theme.radius.xl,
    marginBottom: hp(2),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  chatContent: {
    flex: 1,
    marginRight: wp(4),
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: hp(2.1),
    fontWeight: '700',
    color: theme.colors.text,
  },
  time: {
    fontSize: hp(1.5),
    color: theme.colors.textSecondary,
  },
  lastMessage: {
    fontSize: hp(1.7),
    color: theme.colors.textSecondary,
    marginTop: hp(0.6),
    textAlign: 'right',
    fontWeight: '400',
  },
  separator: {
    height: 0.8,
    backgroundColor: theme.colors.border,
    width: '100%',
    marginTop: hp(2),
    marginBottom: hp(1),
    borderRadius: 4,
  },
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
  },
  backText: {
    color: theme.colors.primary,
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
});