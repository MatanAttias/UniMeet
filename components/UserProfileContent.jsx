import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MotiView } from 'moti';
import Avatar from './Avatar';
import PostCard from './PostCard';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';

// קומפוננטת שורת מידע (אייקון + טקסט)
const InfoItem = ({ icon, text }) => (
  <View style={styles.inlineItem}>
    <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primary} />
    <Text style={styles.inlineText}>{text}</Text>
  </View>
);

// קומפוננטת רשימת תגיות
const TagList = ({ label, tags }) => {
  if (!tags?.length) return null;
  return (
    <>
      <Text style={styles.subSectionTitle}>{label}</Text>
      <View style={styles.tagList}>
        {tags.map((tag, idx) => (
          <View key={idx.toString()} style={styles.tagPill}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </>
  );
};

// קומפוננטת גיל
const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  return new Date().getFullYear() - new Date(birthDate).getFullYear();
};

export default function UserProfileContent({ user, posts }) {
  const age = calculateAge(user.birth_date);

  return (
    <View style={styles.container}>
      {/* Avatar + Name */}
      <View style={styles.avatarContainer}>
        <Avatar uri={user?.image} size={hp(12)} rounded={theme.radius.xxl * 1.4} />
      </View>
      <Text style={styles.userName}>
        {user?.fullName || user?.name || '—'}{age ? `, ${age}` : ''}
      </Text>

      {/* פרטי בסיס */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.infoBox}
      >
        <View style={styles.row}>
          {user.birth_date && <InfoItem icon="cake-variant" text={age} />}
          {user.gender && <InfoItem icon="gender-male-female" text={user.gender} />}
          {user.status && <InfoItem icon="heart" text={user.status} />}
        </View>

        {user.connectionTypes && (
          <View style={[styles.inlineItem, styles.rowReverse]}>
            <MaterialCommunityIcons name="magnify-plus-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.inlineText}>{user.connectionTypes}</Text>
          </View>
        )}
        {user.preferredMatch && (
          <View style={[styles.inlineItem, styles.rowReverse]}>
            <MaterialCommunityIcons name="account-heart" size={24} color={theme.colors.primary} />
            <Text style={styles.inlineText}>{user.preferredMatch}</Text>
          </View>
        )}
      </MotiView>

      {/* הקדמה אישית */}
      {user.introduction && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.infoBox}
        >
          <View style={styles.inlineItem}>
            <MaterialCommunityIcons name="comment-text-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.inlineText}>{user.introduction}</Text>
          </View>
        </MotiView>
      )}

      {/* רשימות תגיות */}
      <TagList label="תכונות" tags={user.traits} />
      <TagList label="סגנונות תקשורת" tags={user.communicationStyles} />
      <TagList label="זהויות" tags={user.identities} />
      <TagList label="צרכים" tags={user.supportNeeds} />

      {/* פוסטים */}
      {Array.isArray(posts) && (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PostCard post={item} />}
          contentContainerStyle={styles.postsList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.background,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: hp(2),
  },
  userName: {
    fontSize: hp(3),
    fontWeight: '500',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: hp(1),
  },
  infoBox: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    marginBottom: hp(1),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
    marginTop: hp(1),
  },
  inlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: wp(2),
    marginBottom: hp(0.5),
  },
  inlineText: {
    color: theme.colors.textPrimary,
    fontSize: hp(2),
    marginStart: wp(1),
  },
  subSectionTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: hp(2),
    marginBottom: hp(1),
    textAlign: 'right',
  },
  tagList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    rowGap: hp(1),
    columnGap: wp(2),
    marginBottom: hp(2),
  },
  tagPill: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
  },
  tagText: {
    color: '#fff',
    fontSize: hp(1.8),
  },
  postsList: {
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },
});
