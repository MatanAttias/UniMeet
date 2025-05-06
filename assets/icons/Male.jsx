import { View, Text } from 'react-native'
import React from 'react'
import Svg, { Path, Circle } from "react-native-svg";

const Male = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="#000000" fill="none" {...props}>
    <Circle 
      cx="10" 
      cy="14" 
      r="6" 
      stroke="currentColor" 
      strokeWidth={props.strokeWidth} 
    />
    <Path 
      d="M14 10L20 4" 
      stroke="currentColor" 
      strokeWidth={props.strokeWidth} 
      strokeLinecap="round" 
    />
    <Path 
      d="M20 9V4H15" 
      stroke="currentColor" 
      strokeWidth={props.strokeWidth} 
      strokeLinecap="round" 
    />
  </Svg>
);

export default Male;