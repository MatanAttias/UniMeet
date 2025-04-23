import { Pressable, StyleSheet, Text } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';

const CustomBackButton = ({
  text = 'חזור',
  to = '/welcome',
  style = {},
  textStyle = {},
}) => {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(to)}
      style={({ pressed }) => [
        styles.backButton,
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      <Text style={[styles.backText, textStyle]}>{text}</Text>
    </Pressable>
  );
};

export default CustomBackButton;

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: hp(4.5),
    right: wp(4),
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3.5),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    zIndex: 10,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
    fontWeight: theme.fonts.semibold,
    textAlign: 'center',
  },
});
