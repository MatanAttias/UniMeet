import React from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '../constants/theme';
import { hp } from '../constants/helpers/common';

/**
 * Avatar component
 * @param {string|object} uri - URL string או אובייקט Asset מ-ImagePicker עם שדה .uri
 * @param {number} size - גובה ורוחב של האוואטר
 * @param {number} rounded - רדיוס הפינות
 * @param {object} style - סגנונות נוספים
 */
const Avatar = ({
  uri,
  size = hp(4.5),
  rounded = theme.radius.md,
  style = {},
}) => {
  // אם uri הוא אובייקט עם שדה .uri (כמו result.assets[0]), יוצא את המחרוזת
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
