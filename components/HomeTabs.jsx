import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';

const HomeTabs = ({ selectedTab, onSelectTab, isParent = false }) => {
  return (
    <View style={styles.tabContainer}>
      {/* דף הבית */}
      <Pressable
        style={[styles.tab, selectedTab === 'home' && styles.activeTab]}
        onPress={() => onSelectTab('home')}
      >
        <Text style={[styles.tabText, selectedTab === 'home' && styles.activeTabText]}>
          דף הבית
        </Text>
      </Pressable>

      {/* שמורים - זמין לכולם */}
      <Pressable
        style={[styles.tab, selectedTab === 'saved' && styles.activeTab]}
        onPress={() => onSelectTab('saved')}
      >
        <Text style={[styles.tabText, selectedTab === 'saved' && styles.activeTabText]}>
          שמורים
        </Text>
      </Pressable>

      {/* טיפים להורים - רק להורים */}
      {isParent && (
        <Pressable
          style={[styles.tab, selectedTab === 'parentTips' && styles.activeTab]}
          onPress={() => onSelectTab('parentTips')}
        >
          <Text style={[styles.tabText, selectedTab === 'parentTips' && styles.activeTabText]}>
            טיפים להורים
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default HomeTabs;

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',  // מרכז את הtabs
    paddingHorizontal: wp(4),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderColor: theme.colors.surface,
    marginBottom: hp(1),
  },
  tab: {
    marginHorizontal: wp(2),  // שינוי מmarginLeft לmarginHorizontal לחלוקה שווה
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),  // הגדלת padding לכפתורים יותר גדולים
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: {
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.semibold,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.bold,
  },
});