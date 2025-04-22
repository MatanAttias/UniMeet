import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { hp, wp } from '../constants/helpers/common'
import Loading from './Loading'

const Button = ({
  buttonStyle,
  textStyle,
  title = '',
  onPress = () => {},
  loading = false,
  hasShadow = true,
  bg = theme.colors.primary,
  textColor = theme.colors.textPrimary,
  disabled = false,
}) => {
  const shadowStyle = {
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  }

  const baseButtonStyle = [
    styles.button,
    {
      backgroundColor: disabled ? theme.colors.textDisabled : bg,
      opacity: disabled ? 0.7 : 1,
    },
    hasShadow && !disabled && shadowStyle,
    buttonStyle,
  ]

  const baseTextStyle = [
    styles.text,
    {
      color: disabled ? theme.colors.surface : textColor,
    },
    textStyle,
  ]

  if (loading) {
    return (
      <View style={baseButtonStyle}>
        <Loading />
      </View>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={baseButtonStyle}
    >
      <Text style={baseTextStyle}>{title}</Text>
    </Pressable>
  )
}

export default Button

const styles = StyleSheet.create({
  button: {
    height: hp(6),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.xl,
    paddingHorizontal: wp(4),
  },
  text: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
  },
})
