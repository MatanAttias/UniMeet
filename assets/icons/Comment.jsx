import * as React from "react";
import Svg, { Path } from "react-native-svg";

const Comment = (props) => (
  <Svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color="#000000" fill="none" {...props}>
    <Path d="M21 8C21 5.23858 18.7614 3 16 3C13.2386 3 11 5.23858 11 8C11 9.71322 11.8363 11.2567 13.1716 12.1716C12.4717 12.5139 12 13.2171 12 14C12 14.7839 12.4717 15.4871 13.1716 15.8284C11.8363 16.7433 11 18.2868 11 20C11 20.3106 11.0624 20.6177 11.1716 20.8787C10.8087 21.0152 10.4115 21 10 21C7.23858 21 5 18.7614 5 16C5 13.2386 7.23858 11 10 11C12.7614 11 15 8.76142 15 6C15 3.23858 12.7614 1 10 1C7.23858 1 5 3.23858 5 6" stroke="currentColor" strokeWidth={props.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default Comment;
