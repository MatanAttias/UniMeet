import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';

const HomeTabs = ({ selectedTab, onSelectTab }) => {
  return (
    <View style={styles.tabContainer}>
      <Pressable
        style={[styles.tab, selectedTab === 'home' && styles.activeTab]}
        onPress={() => onSelectTab('home')}
      >
        <Text style={[styles.tabText, selectedTab === 'home' && styles.activeTabText]}>
          דף הבית
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, selectedTab === 'matches' && styles.activeTab]}
        onPress={() => onSelectTab('matches')}
      >
        <Text style={[styles.tabText, selectedTab === 'matches' && styles.activeTabText]}>
          התאמות
        </Text>
      </Pressable>
    </View>
  );
};

export default HomeTabs;

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row-reverse',
    paddingHorizontal: wp(4),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderColor: theme.colors.gray,
    marginBottom: hp(1),
  },
  tab: {
    marginLeft: wp(4),
    paddingVertical: hp(0.8),
    borderBottomWidth: 3,
    borderColor: 'transparent',
  },
  activeTab: {
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(2),
    color: theme.colors.textLight,
    fontWeight: theme.fonts.medium,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.bold,
  },
});
