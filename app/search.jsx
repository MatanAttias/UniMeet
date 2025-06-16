import React, { useState } from 'react';
import { View, TextInput, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { searchUsersByName } from '../services/userService';
import { hp, wp } from '../constants/helpers/common';
import { theme } from '../constants/theme';
import Avatar from '../components/Avatar';
import { useRouter } from 'expo-router';

export default function Search() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (text) => {
    setSearchTerm(text);
    setError('');
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await searchUsersByName(text);
      if (res.success) {
        setResults(res.data);
      } else {
        setError(res.msg || 'אירעה שגיאה בחיפוש');
        setResults([]);
      }
    } catch (e) {
      setError('אירעה שגיאה ברשת');
      setResults([]);
    }
    setLoading(false);
  };

  const handleUserPress = (userId) => {
    router.push({ pathname: '/visitedProfile', params: { userId } });
  };

  const renderItem = ({ item }) => {
    return (
      <Pressable style={styles.userItem} onPress={() => handleUserPress(item.id)}>
        <Avatar
          uri={item.image || null}
          size={hp(6)}
          rounded={hp(6) / 2}
        />
        <View style={styles.userContent}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userRole}>{item.role}</Text>
        </View>
      </Pressable>
    );
  };

  const goBack = () => router.back();

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={goBack}>
        <Text style={styles.backText}>חזור</Text>
      </Pressable>
      <TextInput
        placeholder="חפש משתמש לפי שם"
        style={styles.input}
        value={searchTerm}
        onChangeText={handleSearch}
        placeholderTextColor={theme.colors.textSecondary}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.loading}>טוען...</Text> : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && (
            <Text style={styles.empty}>אין תוצאות</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: hp(3),
    paddingHorizontal: wp(4),
  },
  input: {
    height: hp(6),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    paddingHorizontal: wp(4),
    fontSize: hp(2),
    color: theme.colors.text,
    textAlign: 'right',
    backgroundColor: theme.colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginTop: 120,
  },
  listContent: {
    paddingBottom: hp(3),
    marginTop: hp(4),
  },
  userItem: {
    flexDirection: 'row-reverse',
    backgroundColor: theme.colors.card,
    padding: hp(1.8),
    borderRadius: theme.radius.xl,
    marginBottom: hp(2),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  userContent: {
    flex: 1,
    marginRight: wp(4),
  },
  userName: {
    fontSize: hp(2.1),
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'right',
  },
  userRole: {
    fontSize: hp(1.7),
    color: theme.colors.textSecondary,
    marginTop: hp(0.3),
    textAlign: 'right',
  },
  empty: {
    textAlign: 'center',
    marginTop: hp(10),
    color: theme.colors.textSecondary,
    fontSize: hp(2),
  },
  error: {
    color: theme.colors.error || 'red',
    textAlign: 'center',
    marginVertical: hp(1),
    fontSize: hp(1.8),
  },
  loading: {
    textAlign: 'center',
    marginVertical: hp(1),
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
  },
  backButton: {
    position: 'absolute',
    top: hp(8),
    right: hp(4),
    backgroundColor: theme.colors.card,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
  partnerName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  }
});