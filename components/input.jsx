import { StyleSheet, TextInput, View } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { hp } from '../constants/helpers/common'

const Input = ({ icon, iconPosition = 'left', containerStyle, inputRef, inputStyle, ...props }) => {
  return (
    <View
      style={[
        styles.container,
        iconPosition === 'right' && styles.rowReverse,
        containerStyle,
      ]}
    >
      {icon && icon}
      <TextInput
        style={[styles.input, inputStyle]} // שימוש בסטייל של input בצורה נקייה
        placeholderTextColor={theme.colors.textLight}
        ref={inputRef}
        {...props}
      />
    </View>
  )
}

export default Input

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: hp(7.2),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.xxl,
    paddingHorizontal: 18,
    gap: 12,
    backgroundColor: theme.colors.card,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    textAlign: 'right',            // כיווניות טקסט
    writingDirection: 'rtl',       // תוודא שהתווים מימין לשמאל
  },
})