import * as React from "react";
import Svg, { Path } from "react-native-svg";

const CameraIcon = (props) => (
  <Svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    width={24} 
    height={24} 
    fill="none" 
    {...props}
    style={{
      shadowColor: "#000", 
      shadowOffset: { width: 2, height: 3 }, // מיקום הצל
      shadowOpacity: 0.18, // עוצמת הצל
      shadowRadius: 1, // רדיוס הצל
    }}
  >
    <Path
      d="M20 5h-3.4l-1-1.8c-.2-.4-.6-.6-1.1-.6h-6.6c-.4 0-.8.2-1.1.6l-1 1.8H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zM12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

export default CameraIcon;