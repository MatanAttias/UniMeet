import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Modal } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';
import Icon from '../assets/icons';
import { Share } from 'react-native';
import { stripHtmlTags } from '../constants/helpers/common';

const PostOptions = ({ 
  visible, 
  onClose, 
  postId, 
  postUserId,
  onDelete,
  item 
}) => {
  const { user } = useAuth();
  
  const isMyPost = user?.id === postUserId;

  const handleSavePost = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_posts')  
        .insert([{ userid: user.id, postid: postId }]);

      if (error) {
        console.log('Save post error:', error);
        Alert.alert('שגיאה', 'לא הצלחנו לשמור את הפוסט');
      } else {
        Alert.alert('✅ נשמר!', 'הפוסט נשמר בהצלחה');
        onClose();
      }
    } catch (error) {
      console.error('Save post error:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשמירת הפוסט');
    }
  };

  const handleDeletePost = () => {
    Alert.alert(
      '🗑️ מחיקת פוסט',
      'האם אתה בטוח שברצונך למחוק את הפוסט?\nפעולה זו לא ניתנת לביטול.',
      [
        {
          text: 'ביטול',
          style: 'cancel'
        },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              onClose(); 
              
              const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId)
                .eq('userId', user.id); 

              if (error) {
                console.error('Delete error:', error);
                Alert.alert('שגיאה', 'לא הצלחנו למחוק את הפוסט');
              } else {
                if (onDelete && item) {
                  onDelete(item);
                }
                Alert.alert('✅ נמחק!', 'הפוסט נמחק בהצלחה');
              }
            } catch (error) {
              console.error('Delete post error:', error);
              Alert.alert('שגיאה', 'אירעה שגיאה במחיקת הפוסט');
            }
          }
        }
      ]
    );
  };

  const handleReportPost = () => {
    Alert.alert(
      '🚨 דיווח על פוסט',
      'האם ברצונך לדווח על פוסט זה כתוכן לא הולם?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'דווח',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('reports')
                .insert([{
                  reporter_id: user.id,
                  post_id: postId,
                  reason: 'inappropriate_content',
                  created_at: new Date().toISOString()
                }]);

              if (error) {
                console.error('Report error:', error);
                Alert.alert('שגיאה', 'לא הצלחנו לשלוח את הדיווח');
              } else {
                Alert.alert('📋 תודה!', 'הדיווח נשלח והמועבר לבדיקה');
                onClose();
              }
            } catch (error) {
              console.error('Report post error:', error);
              Alert.alert('שגיאה', 'אירעה שגיאה בשליחת הדיווח');
            }
          }
        }
      ]
    );
  };

  const handleSharePost = async () => {
    try {
      let shareContent = '';
      
      if (item?.body) {
        const cleanText = stripHtmlTags ? stripHtmlTags(item.body) : item.body;
        shareContent = cleanText.length > 100 
          ? cleanText.substring(0, 100) + '...' 
          : cleanText;
      }
      
      const shareData = {
        title: `פוסט מ-UniMeet`,
        message: shareContent || 'בואו לראות את הפוסט הזה באפליקציה!',
      };

      const result = await Share.share(shareData);
      
      if (result.action === Share.sharedAction) {
        console.log('✅ Post shared successfully');
        
        try {
          await supabase
            .from('post_shares')
            .insert([{
              post_id: postId,
              shared_by: user.id,
              shared_at: new Date().toISOString()
            }]);
        } catch (error) {
          console.log('Share tracking error:', error);
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('שגיאה', 'לא ניתן לשתף את הפוסט כרגע');
    }
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide" 
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <View style={styles.menu}>
          <View style={styles.line} />
          
          <Text style={styles.menuTitle}>אפשרויות פוסט</Text>

          <Pressable 
            style={({ pressed }) => [
              styles.item, 
              pressed && styles.itemPressed
            ]} 
            onPress={handleSavePost}
          >
            <View style={styles.row}>
              <Icon name="bookmark" size={22} color={theme.colors.primary} />
              <Text style={styles.text}>שמור פוסט</Text>
              <Icon name="arrowLeft" size={16} color={theme.colors.textLight} />
            </View>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [
              styles.item, 
              pressed && styles.itemPressed
            ]} 
            onPress={handleSharePost}
          >
            <View style={styles.row}>
              <Icon name="share" size={22} color={theme.colors.textSecondary} />
              <Text style={styles.text}>שתף פוסט</Text>
              <Icon name="arrowLeft" size={16} color={theme.colors.textLight} />
            </View>
          </Pressable>

          <View style={styles.separator} />

          {isMyPost && (
            <Pressable 
              style={({ pressed }) => [
                styles.item, 
                pressed && styles.itemPressed
              ]} 
              onPress={handleDeletePost}
            >
              <View style={styles.row}>
                <Icon name="delete" size={22} color={theme.colors.rose} />
                <Text style={[styles.text, styles.deleteText]}>מחק פוסט</Text>
                <Icon name="arrowLeft" size={16} color={theme.colors.rose} />
              </View>
            </Pressable>
          )}

          {!isMyPost && (
            <Pressable 
              style={({ pressed }) => [
                styles.item, 
                pressed && styles.itemPressed
              ]} 
              onPress={handleReportPost}
            >
              <View style={styles.row}>
                <Icon name="flag" size={22} color={theme.colors.rose} />
                <Text style={[styles.text, styles.reportText]}>דווח על פוסט</Text>
                <Icon name="arrowLeft" size={16} color={theme.colors.rose} />
              </View>
            </Pressable>
          )}

          <Pressable 
            style={({ pressed }) => [
              styles.cancelButton, 
              pressed && styles.cancelPressed
            ]} 
            onPress={onClose}
          >
            <Text style={styles.cancelText}>ביטול</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default PostOptions;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(4),
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderWidth: 1,
    borderTopColor: theme.colors.border,
    borderLeftColor: theme.colors.border,
    borderRightColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  line: {
    width: wp(12),
    height: hp(0.5),
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    borderRadius: hp(0.25),
    marginBottom: hp(2),
  },
  menuTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: hp(1.5),
  },
  item: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.lg,
    marginBottom: hp(0.5),
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.surface,
  },
  itemPressed: {
    backgroundColor: theme.colors.surface,
    transform: [{ scale: 0.98 }],
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    fontSize: hp(1.9),
    color: theme.colors.textPrimary,
    fontWeight: theme.fonts.medium,
    flex: 1,
    textAlign: 'right',
    marginRight: wp(3),
  },
  deleteText: {
    color: theme.colors.rose,
  },
  reportText: {
    color: theme.colors.rose,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.surface,
    marginVertical: hp(1),
    marginHorizontal: wp(2),
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    marginTop: hp(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelPressed: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.98 }],
  },
  cancelText: {
    fontSize: hp(1.9),
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.semibold,
    textAlign: 'center',
  },
});