import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAttributeMatches } from '../../services/matchService';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import Avatar from '../../components/Avatar';

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  console.log('👤 MatchesScreen loaded for user:', user?.id, user?.name);

  // הפונקציה שמביאה את ההתאמות
  const loadMatches = async () => {
    setLoading(true);
    console.log('🔄 Loading matches for user id:', user.id);
    try {
      const res = await fetchAttributeMatches(user.id);
      console.log('🔍 fetchAttributeMatches response:', res);
      if (res.success) {
        setMatches(res.data || []);
      } else {
        console.warn('⚠️ Failed to fetch matches:', res.msg);
        setMatches([]);
      }
    } catch (err) {
      console.error('❗ loadMatches error:', err);
      setMatches([]);
    }
    setLoading(false);
  };

  // טען אוטומטית בהכנסה למסך
  useEffect(() => {
    loadMatches();
  }, []);

  // מצב של טעינה
  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  // מצב שאין התאמות
  if (matches.length === 0) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={styles.emptyText}>אין עדיין התאמות להצגה</Text>
          <Pressable style={styles.button} onPress={loadMatches}>
            <Text style={styles.buttonText}>∞ מצא התאמות</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  // רשימת התאמות
  return (
    <ScreenWrapper>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Avatar uri={item.image} size={hp(8)} rounded={theme.radius.md} />
            <View style={styles.info}>
              <Text style={styles.name}>
                {item.name}, {item.age}
              </Text>
              <Text style={styles.sub}>
                {item.location} • {item.commonConnectionsCount} תחומי עניין משותפים
              </Text>
            </View>
          </View>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: hp(2),
    color: theme.colors.textSecondary,
    marginBottom: hp(2),
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(6),
    borderRadius: theme.radius.md,
  },
  buttonText: {
    color: '#fff',
    fontSize: hp(1.9),
    fontFamily: 'Poppins_600SemiBold',
  },
  list: {
    padding: wp(4),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(2),
    marginBottom: hp(2),
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
  },
  info: {
    marginLeft: wp(4),
  },
  name: {
    fontSize: hp(2),
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.textPrimary,
  },
  sub: {
    fontSize: hp(1.6),
    color: theme.colors.textSecondary,
    marginTop: hp(0.5),
  },
});
