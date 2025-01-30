import * as React from "react";
import Svg, { Path, Rect } from "react-native-svg";

const Mail = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="#000000" fill="none" {...props}>
    <Rect width={21} height={17} x={2} y={5} rx={2} stroke="currentColor" strokeWidth={props.strokeWidth || 2} />
    <Path
      d="M4 7 12 13 20 7"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default Mail;