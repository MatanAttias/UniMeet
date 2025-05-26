import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { searchUsersByName } from '../services/userService';

const UsersSearch = ({ onSelectUser }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        setError('');
        return;
      }
      setLoading(true);
      const res = await searchUsersByName(query);
      setLoading(false);
      if (res.success) {
        setResults(res.data);
        setError('');
      } else {
        setError(res.msg || 'אירעה שגיאה בחיפוש');
      }
    };
    fetchResults();
  }, [query]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => onSelectUser && onSelectUser(item)}>
      <Image
        source={item.image ? { uri: item.image } : require('../assets/default-avatar.png')}
        style={styles.avatar}
      />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.role}>{item.role}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="חפש משתמש לפי שם"
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.loading}>טוען...</Text> : null}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          !loading && query.length >= 2 ? (
            <Text style={styles.empty}>לא נמצאו משתמשים</Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    margin: 10,
    textAlign: 'right',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  role: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  loading: {
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default UsersSearch;