import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const HomeTabs = ({ selectedTab, onSelectTab, isParent = false, isAdmin = false }) => {
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

      {/* טיפים להורים - להורים או לאדמין */}
      {(isParent || isAdmin) && (
        <Pressable
          style={[styles.tab, selectedTab === 'parentTips' && styles.activeTab]}
          onPress={() => onSelectTab('parentTips')}
        >
          <Text style={[styles.tabText, selectedTab === 'parentTips' && styles.activeTabText]}>
            טיפים להורים
          </Text>
        </Pressable>
      )}

      {/* דיווחים - רק לאדמין */}
      {isAdmin && (
        <Pressable
          style={[styles.tab, selectedTab === 'reports' && styles.activeTab]}
          onPress={() => onSelectTab('reports')}
        >
          <View style={styles.tabWithIcon}>
            <MaterialCommunityIcons 
              name="shield-alert" 
              size={16} 
              color={selectedTab === 'reports' ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text style={[styles.tabText, selectedTab === 'reports' && styles.activeTabText]}>
              דיווחים
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
};

export default HomeTabs;

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    paddingHorizontal: wp(4),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderColor: theme.colors.surface,
    marginBottom: hp(1),
  },
  tab: {
    marginHorizontal: wp(2),
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
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
  tabWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});