import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Modal } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';
import Icon from '../assets/icons'; // אם יש לך קובץ Icon גלובלי

const PostOptions = ({ visible, onClose, postId }) => {
  const { user } = useAuth();

  const handleSavePost = async () => {
    const { data, error } = await supabase
      .from('saved_posts')
      .insert([{ user_id: user.id, post_id: postId }]);

    if (error) {
      console.log('Save post error:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לשמור את הפוסט');
    } else {
      Alert.alert('הצלחה', 'הפוסט נשמר');
      onClose(); // סגור את התפריט
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* אזור שסוגר את המודל בלחיצה */}
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <View style={styles.menu}>
          <View style={styles.line} />

          <Pressable style={styles.item} onPress={handleSavePost}>
            <View style={styles.row}>
              <Icon name="bookmark" size={20} />
              <Text style={styles.text}>שמור</Text>
            </View>
          </Pressable>

          {/* תוכל להוסיף כאן עוד אופציות בעתיד */}
          {/* <Pressable style={styles.item}><Text style={styles.text}>שיתוף</Text></Pressable> */}
        </View>
      </View>
    </Modal>
  );
};

export default PostOptions;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: theme.colors.background,
    padding: 16,
    paddingBottom: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  line: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: 16,
  },
  item: {
    paddingVertical: 12,
  },
  text: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
