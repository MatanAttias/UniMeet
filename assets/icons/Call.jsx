import * as React from "react";
import Svg, { Path } from "react-native-svg";

const Call = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="#000000" fill="none" {...props}>
    <Path
      d="M3 5c0-1.1.9-2 2-2h3c.9 0 1.6.6 1.9 1.4l1 3c.2.5 0 1.1-.3 1.5l-1.7 2.1a11.9 11.9 0 0 0 6.3 6.3l2.1-1.7c.4-.3 1-.5 1.5-.3l3 1c.8.3 1.4 1 1.4 1.9v3c0 1.1-.9 2-2 2C10.8 23 3 15.2 3 5Z"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default Call;