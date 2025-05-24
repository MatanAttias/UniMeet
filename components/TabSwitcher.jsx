import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';

export default function TabSwitcher({ tabs, selected, onSelect }) {
  return (
    <View style={[styles.container, tabs.length === 2 && styles.twoTabs]}>
      {tabs.map((tab) => {
        const isActive = selected === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={({ pressed }) => [
              styles.tabButton,
              isActive && styles.tabButtonActive,
              pressed && styles.tabButtonPressed
            ]}
            onPress={() => onSelect(tab.key)}
            accessibilityRole="button"
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: wp(4),
    marginVertical: hp(1),
  },
  twoTabs: {
    justifyContent: 'space-evenly',
  },
  tabButton: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(6),
    marginHorizontal: wp(1.5),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabButtonPressed: {
    opacity: 0.7,
  },
  tabLabel: {
    color: theme.colors.textSecondary,
    fontSize: hp(2.2),
  },
  tabLabelActive: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});
