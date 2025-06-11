import { View, Text } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../constants/theme'

const ScreenWrapper = ({ children, bg = theme.colors.background }) => {
  const { top } = useSafeAreaInsets()
  const paddingTop = top + 50

  const renderChildren = () => {
    if (!children) return null

    if (typeof children === 'string' || typeof children === 'number') {
      return <Text>{children}</Text>
    }

    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (typeof child === 'string' || typeof child === 'number') {
          return <Text key={index}>{child}</Text>
        }
        return <React.Fragment key={index}>{child}</React.Fragment>
      })
    }

    if (React.isValidElement(children)) {
      return children
    }

    return null
  }

  return (
    <View style={{ flex: 1, paddingTop, backgroundColor: bg }}>
      {renderChildren()}
    </View>
  )
}

export default ScreenWrapper