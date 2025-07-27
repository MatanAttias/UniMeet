import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '../assets/icons';
import Avatar from './Avatar';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';
import { supabase } from '../lib/supabase'; // ✅ ודא שהנתיב נכון
import { fetchLikesAndRequests } from '../services/matchService';
import { useAuth } from '../contexts/AuthContext';

// 👉 פונקציה להבאת הצ'אטים של המשתמש
const fetchUserChats = async (userId) => {
  if (!userId) return [];
  
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (error) {
    console.error('Error fetching chats:', error.message);
    return [];
  }

  return data || [];
};

export default function BottomBar({ currentUser, selected }) {
  const router = useRouter();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadLikes, setUnreadLikes] = useState(0);
  const [likesData, setLikesData] = useState({
    liked_you: [],
    matches: [],
    active_chats: []
  });
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
  
    const loadLikes = async () => {
      try {
        const data = await fetchLikesAndRequests(user.id);
        setLikesData(data); // שומר את כל האובייקט
        setUnreadLikes(data.liked_you?.length || 0); // שומר את כמות הלייקים
      } catch (error) {
        console.error('Error loading likes:', error);
      }
    };
  
    loadLikes();
  }, [user?.id]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.id) return;
      
      try {
        // שליפת שיחות ועדכון הודעות שלא נקראו
        const chats = await fetchUserChats(currentUser.id);
        const unread = chats.reduce((count, chat) => {
          const isUser1 = currentUser.id === chat.user1_id;
          return count + ((isUser1 ? !chat.user1_read : !chat.user2_read) ? 1 : 0);
        }, 0);
        setUnreadMessages(unread);

        // שליפת לייקים שלא נקראו מטבלת interactions
        const { data: likes, error: likesError } = await supabase
          .from('interactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'liked_you'); // <== הוספה קריטית
        if (likesError) throw likesError;

        setUnreadLikes(likes?.length || 0);

      } catch (err) {
        console.error('Error in BottomBar useEffect:', err);
      }
    };

    fetchData();
  }, [currentUser?.id]);

  return (
    <View style={styles.container}>
      {/* פרופיל */}
      <Pressable style={styles.tab} onPress={() => router.push('/profile')}>
        <Avatar
          uri={currentUser?.image} 
          size={hp(3.3)}
          rounded={theme.radius.full}
          style={styles.avatar}
        />
        <Text style={[styles.label, selected === 'profile' && styles.selectedLabel]}>פרופיל</Text>
      </Pressable>

      {/* צ'אט */}
      <Pressable style={styles.tab} onPress={() => router.push('/chats')}>
        <View style={{ width: hp(3), height: hp(3) }}>
          <Icon
            name="chat"
            size={hp(3)}
            color={selected === 'chats' ? theme.colors.primary : theme.colors.textSecondary}
          />
          {unreadMessages > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadMessages}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.label, selected === 'chats' && styles.selectedLabel]}>צ׳אט</Text>
      </Pressable>

      {/* התאמות */}
      <Pressable style={styles.tab} onPress={() => router.push('/matches')}>
        <Icon
          name="match"
          size={hp(3)}
          color={selected === 'matches' ? theme.colors.primary : theme.colors.textSecondary}
        />
        <Text style={[styles.label, selected === 'matches' && styles.selectedLabel]}>
          התאמות
        </Text>
      </Pressable>

      {/* לייקים */}
      <Pressable style={styles.tab} onPress={() => router.push('/likes')}>
        <View style={{ alignItems: 'center' }}>
          {/* container שמגדיר position: 'relative' */}
          <View style={{ width: hp(3), height: hp(3), position: 'relative' }}>
            <Icon
              name="heart"
              size={hp(3)}
              color={selected === 'likes' ? theme.colors.primary : theme.colors.textSecondary}
            />
            {unreadLikes > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadLikes}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.label, selected === 'likes' && styles.selectedLabel]}>
            לייקים
          </Text>
        </View>
      </Pressable>

      {/* בית */}
      <Pressable style={styles.tab} onPress={() => router.push('/home')}>
        <Icon
          name="home"
          size={hp(3)}
          color={selected === 'home' ? theme.colors.primary : theme.colors.textSecondary}
        />
        <Text style={[styles.label, selected === 'home' && styles.selectedLabel]}>בית</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface,
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
    borderRadius: theme.radius.xl,
    marginHorizontal: wp(2),
    marginBottom: hp(1.5),
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: -2 },
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.lg,
  },
  label: {
    fontSize: hp(1.3),
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  selectedLabel: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  avatar: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.primary, // ✅ צבע ורוד/פריימרי
    borderRadius: 10,
    paddingHorizontal: 5,
    height: 18,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});