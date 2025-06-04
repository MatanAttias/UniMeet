import { View, Text } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../constants/theme'

const ScreenWrapper = ({ children, bg = theme.colors.background }) => {
  const { top } = useSafeAreaInsets()
  const paddingTop = top > 0 ? top + 5 : 30

  const renderChildren = () => {
    // אם יש רק טקסט - עטוף אותו
    if (typeof children === 'string' || typeof children === 'number') {
      return <Text>{children}</Text>
    }

    // אם יש מערך של ילדים, נבדוק כל אחד
    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (typeof child === 'string' || typeof child === 'number') {
          return <Text key={index}>{child}</Text>
        }
        return child
      })
    }

    // במקרה רגיל
    return children
  }

  return (
    <View style={{ flex: 1, paddingTop, backgroundColor: bg }}>
      {renderChildren()}
    </View>
  )
}

export default ScreenWrapper