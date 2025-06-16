import React from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../constants/theme';
import { hp } from '../constants/helpers/common';

/**
 * Avatar component
 * @param {string|object} uri 
 * @param {number} size 
 * @param {number} rounded
 * @param {object} style 
 */
const Avatar = ({
  uri,
  size = hp(4.5),
  rounded = theme.radius.md,
  style = {},
}) => {
  const resolvedUri = uri && typeof uri === 'object' && uri.uri
    ? uri.uri
    : uri;

  return (
    <Image
      source={{ uri: resolvedUri }}
      transition={100}
      style={[
        styles.avatar,
        { height: size, width: size, borderRadius: rounded },
        style,
      ]}
    />
  );
};

export default Avatar;

const styles = StyleSheet.create({
  avatar: {
    borderCurve: 'continuous',
    borderColor: theme.colors.darkLight,
    borderWidth: 1,
  },
});
