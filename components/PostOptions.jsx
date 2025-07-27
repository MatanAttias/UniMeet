import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  Modal,
  Share,
  TextInput
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';
import { hp, wp, stripHtmlTags } from '../constants/helpers/common';
import Icon from '../assets/icons';
import { savePost, deletePost } from '../services/PostService';
import { createReport } from '../services/reportsService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const reasonLabels = {
  inappropriate_content: 'תוכן לא הולם',
  spam:               'ספאם',
  harassment:         'הטרדה',
  hate_speech:        'הסתה',
  violence:           'אלימות',
  fake_news:          'חדשות מזויפות',
  copyright:          'זכויות יוצרים',
  other:              'אחר'
};

const PostOptions = ({ visible, onClose, postId, postUserId, onDelete, item }) => {
  const { user } = useAuth();
  const isMyPost = user?.id === postUserId;

  // Modal states
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [customDesc, setCustomDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSavePost = async () => {
    try {
      console.log('💾 Attempting to save post:', postId);
      const { success, msg } = await savePost(user.id, postId);
      if (success) {
        Alert.alert('✅ נשמר!', 'הפוסט נשמר בהצלחה');
        onClose();
      } else {
        console.error('Save post failed:', msg);
        Alert.alert('שגיאה', msg || 'לא הצלחנו לשמור את הפוסט');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      Alert.alert('שגיאה', 'לא ניתן לשמור פוסט כרגע');
    }
  };

  const handleDeletePost = () => {
    Alert.alert(
      '🗑️ מחיקת פוסט',
      'האם אתה בטוח שברצונך למחוק את הפוסט?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              onClose();
              console.log('🗑️ Attempting to delete post:', postId);
              const { success, msg } = await deletePost(postId, user.id);
              if (success) {
                onDelete(item);
                Alert.alert('✅ נמחק!', 'הפוסט נמחק בהצלחה');
              } else {
                console.error('Delete post failed:', msg);
                Alert.alert('שגיאה', msg || 'לא הצלחנו למחוק את הפוסט');
              }
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('שגיאה', 'לא ניתן למחוק פוסט כרגע');
            }
          }
        }
      ]
    );
  };

  // Open report modal: close options first, then open report
  const handleReportPost = () => {
    console.log('🚨 Opening report modal for post:', postId);
    onClose();
    setTimeout(() => {
      setSelectedReason(null);
      setCustomDesc('');
      setReportModalVisible(true);
    }, 100);
  };

  const handleSharePost = async () => {
    let shareContent = '';
    if (item?.body) {
      const clean = stripHtmlTags(item.body);
      shareContent = clean.length > 100
        ? `${clean.substring(0,100)}...`
        : clean;
    }
    try {
      await Share.share({
        title: 'פוסט מ-UniMeet',
        message: shareContent || 'בואו לראות את הפוסט הזה באפליקציה!'
      });
      onClose();
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('שגיאה', 'לא ניתן לשתף את הפוסט כרגע');
    }
  };

  // Submit report
  const submitReport = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const description = selectedReason === 'other' ? customDesc : null;
      const reportData = {
        reporterId: user.id,
        postId,
        reason: selectedReason,
        description
      };
      console.log('📦 Final report data:', reportData);
      const result = await createReport(reportData);
      if (result.success) {
        Alert.alert('📋 תודה!', 'הדיווח נשלח לבדיקה');
        setReportModalVisible(false);
      } else {
        Alert.alert('שגיאה', result.msg || 'לא הצלחנו לשלוח את הדיווח');
      }
    } catch (error) {
      console.error('Error in submitReport:', error);
      Alert.alert('שגיאה', 'לא ניתן לשלוח דיווח כרגע');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Main options modal */}
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

            {!isMyPost && (
              <Pressable style={styles.item} onPress={handleSavePost}>
                <View style={styles.row}>
                  <Icon name="bookmark" size={22} color={theme.colors.primary} />
                  <Text style={styles.text}>שמור פוסט</Text>
                  <Icon name="arrowLeft" size={16} color={theme.colors.textLight} />
                </View>
              </Pressable>
            )}

            <Pressable style={styles.item} onPress={handleSharePost}>
              <View style={styles.row}>
                <Icon name="share" size={22} color={theme.colors.textSecondary} />
                <Text style={styles.text}>שתף פוסט</Text>
                <Icon name="arrowLeft" size={16} color={theme.colors.textLight} />
              </View>
            </Pressable>

            <View style={styles.separator} />

            {isMyPost ? (
              <Pressable style={styles.item} onPress={handleDeletePost}>
                <View style={styles.row}>
                  <Icon name="delete" size={22} color={theme.colors.rose} />
                  <Text style={[styles.text, styles.deleteText]}>מחק פוסט</Text>
                  <Icon name="arrowLeft" size={16} color={theme.colors.rose} />
                </View>
              </Pressable>
            ) : (
              <Pressable style={styles.item} onPress={handleReportPost}>
                <View style={styles.row}>
                  <MaterialCommunityIcons name="flag" size={22} color={theme.colors.rose} />
                  <Text style={[styles.text, styles.reportText]}>דווח על פוסט</Text>
                  <Icon name="arrowLeft" size={16} color={theme.colors.rose} />
                </View>
              </Pressable>
            )}

            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>ביטול</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Report reason modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setReportModalVisible(false)} />
          <View style={styles.menu}>
            <View style={styles.line} />
            <Text style={styles.menuTitle}>בחר סיבת דיווח</Text>

            {Object.entries(reasonLabels).map(([key, label]) => (
              <Pressable
                key={key}
                style={[
                  styles.item,
                  selectedReason === key && styles.selectedItem
                ]}
                onPress={() => setSelectedReason(key)}
              >
                <View style={styles.row}>
                  <View style={[
                    styles.radioButton,
                    selectedReason === key && styles.radioButtonSelected
                  ]}>
                    {selectedReason === key && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={[
                    styles.text,
                    selectedReason === key && styles.selectedText
                  ]}>
                    {label}
                  </Text>
                </View>
              </Pressable>
            ))}

            {selectedReason === 'other' && (
              <TextInput
                style={styles.textInput}
                placeholder="תיאור נוסף (לא חובה)"
                placeholderTextColor={theme.colors.textLight}
                value={customDesc}
                onChangeText={setCustomDesc}
                multiline
                maxLength={200}
                textAlign="right"
              />
            )}

            <Pressable
              style={[
                styles.submitButton,
                (!selectedReason || isSubmitting) && styles.submitButtonDisabled
              ]}
              disabled={!selectedReason || isSubmitting}
              onPress={submitReport}
            >
              <Text style={[
                styles.submitButtonText,
                (!selectedReason || isSubmitting) && styles.submitButtonTextDisabled
              ]}>
                {isSubmitting ? 'שולח...' : 'שלח דיווח'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setReportModalVisible(false)}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelText}>בטל</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
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
    borderColor: theme.colors.border,
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
  selectedItem: {
    backgroundColor: theme.colors.primary + '10',
    borderColor: theme.colors.primary + '30',
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
  selectedText: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.semibold,
  },
  deleteText: {
    color: theme.colors.rose,
  },
  reportText: {
    color: theme.colors.rose,
  },
  radioButton: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(2),
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(1.25),
    backgroundColor: theme.colors.primary,
  },
  textInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: wp(4),
    marginVertical: hp(1),
    fontSize: hp(1.8),
    color: theme.colors.textPrimary,
    minHeight: hp(8),
    textAlignVertical: 'top',
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.surface,
    marginVertical: hp(1),
    marginHorizontal: wp(2),
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1.8),
    borderRadius: theme.radius.lg,
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.surface,
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: hp(1.9),
    color: '#fff',
    fontWeight: theme.fonts.semibold,
    textAlign: 'center',
  },
  submitButtonTextDisabled: {
    color: theme.colors.textLight,
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    marginTop: hp(1),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelText: {
    fontSize: hp(1.9),
    color: theme.colors.textSecondary,
    fontWeight: theme.fonts.semibold,
    textAlign: 'center',
  }
});
