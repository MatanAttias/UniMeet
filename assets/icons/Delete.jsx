import * as React from "react";
import Svg, { Path } from "react-native-svg";

const Delete = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={props.size || 24} height={props.size || 24} fill="none" {...props}>
    {/* פח המחזור */}
    <Path
      d="M5 6H19"
      stroke={props.color || "#000000"}
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* גוף הפח */}
    <Path
      d="M7 6V18C7 18.5304 7.21071 19.0391 7.58579 19.4142C7.96086 19.7893 8.46957 20 9 20H15C15.5304 20 16.0391 19.7893 16.4142 19.4142C16.7893 19.0391 17 18.5304 17 18V6"
      stroke={props.color || "#000000"}
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* מכסה הפח */}
    <Path
      d="M10 4V2H14V4"
      stroke={props.color || "#000000"}
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* חציית ה-X במחיקה */}
    <Path
      d="M9 10L15 14"
      stroke={props.color || "#000000"}
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 10L9 14"
      stroke={props.color || "#000000"}
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default Delete;
