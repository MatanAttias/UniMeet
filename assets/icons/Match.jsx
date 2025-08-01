import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
}

const Match: React.FC<Props> = ({
  size = 24,
  color = '#000',
  strokeWidth = 2,
  filled = false,
}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    {filled && (
      <Path
        d="M15 8H9C7.11438 8 6.17157 8 5.58579 8.58579C5 9.17157 5 10.1144 5 12V18C5 19.8856 5 20.8284 5.58579 21.4142C6.17157 22 7.11438 22 9 22H15C16.8856 22 17.8284 22 18.4142 21.4142C19 20.8284 19 19.8856 19 18V12C19 10.1144 19 9.17157 18.4142 8.58579C17.8284 8 16.8856 8 15 8Z"
        fill={color}
        fillOpacity={0.15}
      />
    )}

    <Path
      d="M15 8H9C7.11438 8 6.17157 8 5.58579 8.58579C5 9.17157 5 10.1144 5 12V18C5 19.8856 5 20.8284 5.58579 21.4142C6.17157 22 7.11438 22 9 22H15C16.8856 22 17.8284 22 18.4142 21.4142C19 20.8284 19 19.8856 19 18V12C19 10.1144 19 9.17157 18.4142 8.58579C17.8284 8 16.8856 8 15 8Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <Path
      d="M18 8V6C18 4.11438 18 3.17157 17.4142 2.58579C16.8284 2 15.8856 2 14 2H10C8.11438 2 7.17157 2 6.58579 2.58579C6 3.17157 6 4.11438 6 6V8"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <Path
      d="M12 8V5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 8V5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 8V5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12.1543 19C13.7259 19 15 17.7464 15 16.2C15 13.9048 12.5608 13.4 12.5608 11C10.7317 12 11 15 11 15C11 15 9.31084 15 9.31026 13.5C8.36162 16 9.66704 19 12.1543 19Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  </Svg>
);

export default Match;
