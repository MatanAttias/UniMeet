import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

export default function UniMeetLogo({ width = 180, height = 48 }) {
  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            {/* עדכן צבעים לפי הלוגו שלך */}
            <Stop offset="0%" stopColor="#d8e6fa" />
            <Stop offset="50%" stopColor="#cebae8" />
            <Stop offset="100%" stopColor="#fd3587" />
          </LinearGradient>
        </Defs>
        <SvgText
          fill="url(#grad)"
          fontSize={height * 0.7}
          fontWeight="bold"
          fontFamily="Poppins" // אם מותקן, אחרת תשנה ל-System
          x="0"
          y={height * 0.75}
        >
          unimeet
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  shadowColor: '#000',
  shadowOffset: { width: 2, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 8,
},
});
