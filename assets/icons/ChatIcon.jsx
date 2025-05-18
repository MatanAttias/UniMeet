import React from 'react';
import Svg, { Path } from 'react-native-svg';

const ChatIcon = ({ size = 24, color = '#FFFFFF', strokeWidth = 2 }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* בועת צ׳אט עגולה */}
    <Path d="M8 20C8 11.1634 15.1634 4 24 4h16c8.8366 0 16 7.1634 16 16v16c0 8.8366-7.1634 16-16 16H24l-12 12V40H24C15.1634 40 8 32.8366 8 24V20Z" />
    
    {/* ברק */}
    <Path d="M32 18l-6 12h5l-3 10 8-12h-6l2-10Z" />
  </Svg>
);

export default ChatIcon;
