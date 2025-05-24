import { StyleSheet, Text, View, Pressable } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';
import BackButton from './BackButton';
import Avatar from './Avatar'; // וודא שקיים
import BookMark from '../assets/icons/BookMark';



const Header = ({ title = 'UniMeet', showBackButton = false, mb = 10 }) => {
  const router = useRouter();

  return (
  
      <Text style={styles.title}>{title}</Text>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: hp(4),
    paddingHorizontal: wp(4),
    backgroundColor: theme.colors.dark,
  },
  title: {
    fontSize: hp(2.7),
    fontWeight: theme.fonts.semibold,
    color: '#F8EBE8',
    textAlign: 'center',
    flex: 1,
  },
  left: {
    position: 'absolute',
    left: 10,
  },
  rightIcons: {
    position: 'absolute',
    right: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: wp(3),
  },
});
