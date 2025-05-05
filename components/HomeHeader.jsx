import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import HomeTabs from './HomeTabs';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

const HomeHeader = ({ activeTab, onTabChange }) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* לוגו ואייקונים */}
      <View style={styles.topRow}>
        <Text style={styles.logoText}>UniMeet</Text>

        <View style={styles.iconRow}>
          <Pressable onPress={() => router.push('/newPost')}>
            <Ionicons name="add-circle-outline" size={26} color={theme.colors.pink} />
          </Pressable>
          <Pressable onPress={() => router.push('/Search')}>
            <Ionicons name="search-outline" size={24} color={theme.colors.pink} />
          </Pressable>
          <Pressable onPress={() => router.push('/BookMark')}>
            <Ionicons name="bookmark-outline" size={24} color={theme.colors.pink} />
          </Pressable>
          <Pressable onPress={() => router.push('/notifications')}>
            <Ionicons name="heart-outline" size={24} color={theme.colors.pink} />
          </Pressable>
        </View>
      </View>

      {/* טאבים */}
      <HomeTabs activeTab={activeTab} onTabChange={onTabChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
});

export default HomeHeader;
