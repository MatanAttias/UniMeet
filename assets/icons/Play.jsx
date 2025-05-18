import React from 'react';
import { Svg, Path } from 'react-native-svg';

const Play = ({ height = 30, width = 30, color = 'white', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
    <Path d="M8 5v14l11-7L8 5z" fill={color} />
  </Svg>
);

export default Play;