import React from 'react';
import Home from './Home';
import { theme } from '../../constants/theme';
import Mail from './Mail';
import Lock from './Lock';
import User from './User';
import Heart from './Heart';
import Plus from './Plus';
import Search from './Search';
import Location from './Location';
import Call from './Call';
import Camera from './Camera';
import Edit from './Edit';
import ArrowLeft from './ArrowLeft';
import ThreeDotsCircle from './ThreeDotsCircle';
import ThreeDotsHorizontal from './ThreeDotsHorizontal';
import Comment from './Comment';
import Share from './Share';
import Send from './Send';
import Delete from './Delete';
import Logout from './Logout';
import Image from './Image';
import Video from './Video';
import Confirm from './Confirm';
import BookMark from './BookMark';
import React from 'react'
import Home from './Home'
import { theme } from '../../constants/theme'
import Mail from './Mail'
import Lock from './Lock'
import User from './User'
import Heart from './Heart'
import Plus from './Plus'
import Search from './Search'
import Location from './Location'
import Call from './Call'
import Camera from './Camera'
import Edit from './Edit'
import ArrowLeft from './ArrowLeft'
import ThreeDotsCircle from './ThreeDotsCircle'
import ThreeDotsHorizontal from './ThreeDotsHorizontal'
import Comment from './Comment'
import Share from './Share'
import Send from './Send'
import Delete from './Delete'
import Logout from './Logout'
import Image from './Image'
import Video from './Video'
import Confirm from './Confirm'
import Male from './Male'
import Female from './female'
import GenderNatural from './genderNatural' 

const icons = {
  home: Home,
  mail: Mail,
  lock: Lock,
  user: User,
  heart: Heart,
  plus: Plus,
  search: Search,
  location: Location,
  call: Call,
  camera: Camera,
  edit: Edit,
  arrowLeft: ArrowLeft,
  threeDotsCircle: ThreeDotsCircle,
  threeDotsHorizontal: ThreeDotsHorizontal,
  comment: Comment,
  share: Share,
  send: Send,
  delete: Delete,
  logout: Logout,
  image: Image,
  video: Video,
  confirm: Confirm,
  bookmark: BookMark,
};
  location: Location,
  male: Male,
  female: Female,
  genderNatural: GenderNatural,
}

const Icon = ({ name, size = 24, strokeWidth = 1.9, color, ...props }) => {
  const IconComponent = icons[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <IconComponent
      height={size}
      width={size}
      strokeWidth={strokeWidth}
      color={color || theme.colors.textLight}
      {...props}
    />
  );
};

export default Icon;