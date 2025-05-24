import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '../assets/icons'; // עדכן נתיב במידת הצורך
import Avatar from './Avatar';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';


// באדג' לכמות הודעות לא נקראות
const ChatTabIcon = ({ color, size, unreadCount }) => (
  <View style={{ width: size, height: size }}>
    <Icon name="chat" size={size} color={color} />
    {unreadCount > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{unreadCount}</Text>
      </View>
    )}
  </View>
);

export default function BottomBar({ currentUser, selected, unreadMessages = 0, unreadLikes = 0 }) {
  const router = useRouter();

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
      {/* צ׳אט */}
      <Pressable style={styles.tab} onPress={() => router.push('chats')}>
        <ChatTabIcon
          color={selected === 'chats' ? theme.colors.primary : theme.colors.textSecondary}
          size={hp(3)}
          unreadCount={unreadMessages}
        />
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
        <View style={{ width: hp(3), height: hp(3) }}>
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
        <Text style={[styles.label, selected === 'likes' && styles.selectedLabel]}>לייקים</Text>
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
    top: -7,
    right: -9,
    backgroundColor: theme.colors.rose ?? '#FF4F93',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
