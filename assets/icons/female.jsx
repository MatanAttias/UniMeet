import { View, Text } from 'react-native'
import React from 'react'
import Svg, { Path, Circle } from "react-native-svg";

const Female = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="#000000" fill="none" {...props}>
    <Circle 
      cx="12" 
      cy="8" 
      r="5" 
      stroke="currentColor" 
      strokeWidth={props.strokeWidth} 
    />
    <Path 
      d="M12 13V21" 
      stroke="currentColor" 
      strokeWidth={props.strokeWidth} 
      strokeLinecap="round" 
    />
    <Path 
      d="M9 18H15" 
      stroke="currentColor" 
      strokeWidth={props.strokeWidth} 
      strokeLinecap="round" 
    />
  </Svg>
);

export default Female;