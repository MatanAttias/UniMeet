import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import React from 'react';
import { hp } from '../constants/helpers/common';

const BottomButtonContainer = ({ children }) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={hp(4)}
      style={styles.wrapper}
    >
      <View style={styles.inner}>
        {children}
      </View>
    </KeyboardAvoidingView>
  );
};

export default BottomButtonContainer;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  inner: {
    width: '100%',
    paddingHorizontal: hp(3),
    paddingBottom: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(2),
  }
});
