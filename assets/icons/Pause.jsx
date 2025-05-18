import React from 'react';
import { Svg, Rect } from 'react-native-svg';

const Pause = ({ height = 30, width = 30, color = 'white', ...props }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
    <Rect x="6" y="5" width="4" height="14" fill={color} />
    <Rect x="14" y="5" width="4" height="14" fill={color} />
  </Svg>
);

export default Pause;