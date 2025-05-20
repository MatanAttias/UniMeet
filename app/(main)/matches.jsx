// app/(main)/matches.jsx
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import Avatar from '../../components/Avatar';
import Header from '../../components/Header';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Audio } from 'expo-av';
import { MotiView } from 'moti';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Matches() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [isPlayingMap, setIsPlayingMap] = useState({});
  const [soundObjects, setSoundObjects] = useState({});

  // fetch matches list
  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', user.id);
      if (error) {
        Alert.alert('שגיאה', 'לא ניתן לטעון התאמות');
      } else {
        setMatches(data || []);
      }
      setLoading(false);
    }
    if (user?.id) fetchMatches();
  }, [user?.id]);

  // play / pause per user
  const onPlayAudio = async (id, uri) => {
    if (!uri) return;
    const current = soundObjects[id];
    if (current) {
      await current.unloadAsync();
      setSoundObjects(prev => ({ ...prev, [id]: null }));
      setIsPlayingMap(prev => ({ ...prev, [id]: false }));
      return;
    }
    const { sound } = await Audio.Sound.createAsync({ uri });
    setSoundObjects(prev => ({ ...prev, [id]: sound }));
    await sound.playAsync();
    setIsPlayingMap(prev => ({ ...prev, [id]: true }));
    sound.setOnPlaybackStatusUpdate(status => {
      if (status.didJustFinish) onPlayAudio(id, uri);
      setIsPlayingMap(prev => ({ ...prev, [id]: status.isPlaying }));
    });
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const renderItem = ({ item }) => {
    const age = item.birth_date
      ? new Date().getFullYear() - new Date(item.birth_date).getFullYear()
      : null;
    return (
      <View style={styles.card}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.overlay}>
          <Text style={styles.name}>
            {item.name}{age ? `, ${age}` : ''}
          </Text>
        </View>
        <View style={styles.actions}>
          {/* friendly */}
          <Pressable
            style={styles.btnFriendly}
            onPress={() => {/* handle friendly */}}
          >
            <MaterialCommunityIcons
              name="happy-outline"
              size={hp(4)}
              color={theme.colors.primaryLight}
            />
          </Pressable>
          {/* like */}
          <Pressable
            style={styles.btnLike}
            onPress={() => {/* handle like */}}
          >
            <MaterialCommunityIcons
              name="heart"
              size={hp(4)}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <Header title="התאמות" />
      <FlatList
        data={matches}
        keyExtractor={item => item.id.toString()}
        horizontal
        pagingEnabled
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: wp(4) }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: SCREEN_WIDTH - wp(8),
    height: hp(60),
    marginHorizontal: wp(4),
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute',
    bottom: hp(20),
    left: wp(4),
  },
  name: {
    color: '#fff',
    fontSize: hp(3),
    fontWeight: 'bold',
  },
  actions: {
    position: 'absolute',
    bottom: hp(4),
    left: wp(4),
    flexDirection: 'row',
  },
  btnFriendly: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: hp(1),
    marginRight: wp(2),
    borderRadius: theme.radius.md,
  },
  btnLike: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: hp(1),
    borderRadius: theme.radius.md,
  },
});