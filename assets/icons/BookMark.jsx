import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function BookMark(props) {
  return (
    <MaterialCommunityIcons
      name="bookmark-outline"
      size={24}
      color="#000"
      {...props}
    />
  );
}