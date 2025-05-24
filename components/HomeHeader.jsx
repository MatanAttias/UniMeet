import React from 'react';
import { SafeAreaView, View, Text, Pressable, StyleSheet } from 'react-native';
import HomeTabs from './HomeTabs';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

const HomeHeader = ({ activeTab, onTabChange }) => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* שורת אייקונים ולוגו */}
      <View style={styles.topRow}>
        {/* אייקון תפריט חבור (hamburger) */}
        <Pressable onPress={() => {/* כאן אפשר לפתוח את צ’יפס הקטגוריות */}} style={styles.iconButton}>
          <Ionicons name="menu-outline" size={24} color={theme.colors.pink} />
        </Pressable>

        {/* לוגו UniMeet */}
        <Text style={styles.logoText}>UniMeet</Text>

        {/* שורת אייקונים מימין */}
        <View style={styles.iconRow}>
  <Pressable onPress={() => router.push('/newPost')} style={styles.iconButton}>
    <Ionicons name="add-circle-outline" size={26} color={theme.colors.pink} />
  </Pressable>
  <Pressable onPress={() => router.push('search')} style={styles.iconButton}>
    <Ionicons name="search-outline" size={24} color={theme.colors.pink} />
  </Pressable>
  <Pressable onPress={() => rrouter.push('/bookMark')} style={styles.iconButton}>
    <Ionicons name="bookmark-outline" size={24} color={theme.colors.pink} />
  </Pressable>
  <Pressable onPress={() => router.push('/notifications')} style={styles.iconButton}>
    <Ionicons name="notifications-outline" size={24} color={theme.colors.pink} />
  </Pressable>
</View>
      </View>

      {/* לשוניות Home / Matches */}
      <HomeTabs activeTab={activeTab} onTabChange={onTabChange} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 16,
  },
});

export default HomeHeader;
