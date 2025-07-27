import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { hp, wp } from '../../constants/helpers/common';
import { theme } from '../../constants/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Loading from '../../components/Loading';
import Avatar from '../../components/Avatar';
import * as Haptics from 'expo-haptics';
import {
  fetchAllReports,
  deletePostAndUpdateReport,
  approveReportWithoutDeletion,
  dismissReport,
} from '../../services/reportsService';

const Reports = () => {
  const { isAdmin } = useAuth();
  const router = useRouter();
  
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    dismissed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      Alert.alert('אין הרשאה', 'רק אדמין יכול לגשת לעמוד זה', [
        { text: 'חזור', onPress: () => router.back() }
      ]);
      return;
    }
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const { success, data, msg } = await fetchAllReports();
      if (!success) throw new Error(msg);
      setReports(data);
      calculateStats(data);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לטעון את הדיווחים');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (list) => {
    setStats({
      total: list.length,
      pending: list.filter(r => !r.status || r.status === 'pending').length,
      approved: list.filter(r => r.status === 'approved').length,
      dismissed: list.filter(r => r.status === 'dismissed').length,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const confirmAndHandle = (title, message, onConfirm) => {
    Alert.alert(title, message, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'אישור', onPress: onConfirm }
    ]);
  };

  const handleDeletePost = (postId, reportId) =>
    confirmAndHandle('🗑️ מחיקת פוסט', 'האם למחוק את הפוסט?', async () => {
      const { success, msg } = await deletePostAndUpdateReport(postId, reportId);
      if (!success) return Alert.alert('שגיאה', msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ הושלם', 'הפוסט נמחק והדיווח אושר');
      setModalVisible(false);
      loadReports();
    });

  const handleApprove = (reportId) =>
    confirmAndHandle('✅ אישור דיווח', 'אשר דיווח בלי מחיקה?', async () => {
      const { success, msg } = await approveReportWithoutDeletion(reportId);
      if (!success) return Alert.alert('שגיאה', msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ הושלם', 'הדיווח אושר');
      setModalVisible(false);
      loadReports();
    });

  const handleDismiss = (reportId) =>
    confirmAndHandle('❌ דחיית דיווח', 'האם לדחות את הדיווח?', async () => {
      const { success, msg } = await dismissReport(reportId);
      if (!success) return Alert.alert('שגיאה', msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ הושלם', 'הדיווח נדחה');
      setModalVisible(false);
      loadReports();
    });

  const openReportDetails = (report) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const getStatusText = (s) =>
    s === 'approved' ? 'אושר' : s === 'dismissed' ? 'נדחה' : 'ממתין';

  const getStatusColor = (s) =>
    s === 'approved' ? theme.colors.success :
    s === 'dismissed' ? theme.colors.warning : theme.colors.rose;

  const getReasonText = (r) => ({
    inappropriate_content: 'תוכן לא הולם',
    spam: 'ספאם',
    harassment: 'הטרדה',
    hate_speech: 'הסתה',
    violence: 'אלימות',
    fake_news: 'חדשות מזויפות',
  }[r] || r || 'לא צוין');

  const renderStats = () => (
    <View style={styles.statsContainer}>
      {['סה"כ ד', 'ממתינים', 'אושרו', 'נדחו'].map((label, i) => (
        <View key={i} style={[styles.statCard, i === 1 && { borderColor: theme.colors.rose }, i === 2 && { borderColor: theme.colors.success }, i === 3 && { borderColor: theme.colors.warning }]}>
          <Text style={[styles.statNumber, i === 1 && { color: theme.colors.rose }, i === 2 && { color: theme.colors.success }, i === 3 && { color: theme.colors.warning }]}>
            {[stats.total, stats.pending, stats.approved, stats.dismissed][i]}
          </Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );

  const renderReport = ({ item }) => {
    const pending = !item.status || item.status === 'pending';
    return (
      <Pressable style={[styles.reportCard, pending && styles.pendingCard]} onPress={() => openReportDetails(item)}>
        <View style={styles.reportHeader}>
          <View style={styles.reportInfo}>
            <Text style={styles.reportId}>דיווח #{item.post_id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
            </View>
          </View>
          <Text style={styles.reportDate}>{new Date(item.created_at).toLocaleDateString('he-IL')}</Text>
        </View>
        <View style={styles.reportBody}>
          <View style={styles.reporterInfo}>
            <Avatar uri={item.reporter?.image} size={hp(4)} rounded={theme.radius.full} />
            <View style={styles.reporterDetails}>
              <Text style={styles.reporterName}>מדווח: {item.reporter?.name || 'לא ידוע'}</Text>
              <Text style={styles.reasonText}>סיבה: {getReasonText(item.reason)}</Text>
            </View>
          </View>
          {item.post && (
            <View style={styles.postPreview}>
              <Text style={styles.postAuthor}>מחבר: {item.post.user?.name || 'לא ידוע'}</Text>
              <Text style={styles.postContent} numberOfLines={2}>{item.post.body?.replace(/<[^>]*>/g, '')}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const renderModal = () => {
    if (!selectedReport) return null;
    return (
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>דיווח #{selectedReport.post_id}</Text>
            <Pressable onPress={() => setModalVisible(false)}><MaterialCommunityIcons name="close" size={24} color={theme.colors.textPrimary} /></Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>פרטי דיווח</Text>
              <Text style={styles.detailText}>תאריך: {new Date(selectedReport.created_at).toLocaleString('he-IL')}</Text>
              <Text style={styles.detailText}>סיבה: {getReasonText(selectedReport.reason)}</Text>
              <Text style={styles.detailText}>סטטוס: {getStatusText(selectedReport.status)}</Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>מדווח</Text>
              <View style={styles.userInfo}>
                <Avatar uri={selectedReport.reporter?.image} size={hp(6)} rounded={theme.radius.full} />
                <View>
                  <Text style={styles.userName}>{selectedReport.reporter?.name || 'לא ידוע'}</Text>
                  <Text style={styles.userEmail}>{selectedReport.reporter?.email}</Text>
                </View>
              </View>
            </View>
            {selectedReport.post && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>פוסט</Text>
                <Avatar uri={selectedReport.post.user?.image} size={hp(6)} rounded={theme.radius.full} />
                <Text style={styles.postText}>{selectedReport.post.body?.replace(/<[^>]*>/g, '')}</Text>
                <Text style={styles.postDate}>נוצר: {new Date(selectedReport.post.created_at).toLocaleString('he-IL')}</Text>
              </View>
            )}
            <View style={styles.actionSection}>
              <Pressable style={[styles.modalActionBtn, styles.deletePostBtn]} onPress={() => handleDeletePost(selectedReport.post.id, selectedReport.id)}>
                <MaterialCommunityIcons name="delete" size={20} color="#fff" /><Text style={styles.modalActionText}>מחק פוסט</Text>
              </Pressable>
              <Pressable style={[styles.modalActionBtn, styles.approveBtn]} onPress={() => handleApprove(selectedReport.id)}>
                <MaterialCommunityIcons name="check" size={20} color="#fff" /><Text style={styles.modalActionText}>אשר דיווח</Text>
              </Pressable>
              <Pressable style={[styles.modalActionBtn, styles.dismissBtn]} onPress={() => handleDismiss(selectedReport.id)}>
                <MaterialCommunityIcons name="close" size={20} color="#fff" /><Text style={styles.modalActionText}>דחה דיווח</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper bg={theme.colors.background}>
        <Header title="ניהול דיווחים" showBackButton />
        <View style={styles.loadingContainer}><Loading /></View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <Header title="ניהול דיווחים" showBackButton />
      {renderStats()}
      <FlatList
        data={reports}
        keyExtractor={item => `report-${item.id}`}
        renderItem={renderReport}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="shield-check" size={64} color={theme.colors.textLight} />
            <Text style={styles.emptyTitle}>אין דיווחים</Text>
          </View>
        }
        contentContainerStyle={styles.listContainer}
      />
      {renderModal()}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statsContainer: { flexDirection: 'row', padding: wp(4), gap: wp(2) },
  statCard: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: hp(2), alignItems: 'center', borderWidth: 2, borderColor: theme.colors.border },
  statNumber: { fontSize: hp(3), fontWeight: 'bold', color: theme.colors.textPrimary },
  statLabel: { fontSize: hp(1.4), color: theme.colors.textSecondary, marginTop: hp(0.5) },
  listContainer: { paddingBottom: hp(10) },
  reportCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: wp(4), marginBottom: hp(2), borderWidth: 1, borderColor: theme.colors.border },
  pendingCard: { borderColor: theme.colors.rose, borderWidth: 2 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: hp(1.5) },
  reportInfo: { flexDirection: 'row', alignItems: 'center', gap: wp(2) },
  reportId: { fontSize: hp(1.8), fontWeight: 'bold', color: theme.colors.textPrimary },
  statusBadge: { paddingHorizontal: wp(2), paddingVertical: hp(0.3), borderRadius: theme.radius.sm },
  statusText: { color: '#fff', fontSize: hp(1.2), fontWeight: 'bold' },
  reportDate: { fontSize: hp(1.4), color: theme.colors.textLight },
  reportBody: { gap: hp(1.5) },
  reporterInfo: { flexDirection: 'row', alignItems: 'center', gap: wp(3) },
  reporterDetails: { flex: 1 },
  reporterName: { fontSize: hp(1.6), fontWeight: '600', color: theme.colors.textPrimary },
  reasonText: { fontSize: hp(1.4), color: theme.colors.textSecondary },
  postPreview: { backgroundColor: theme.colors.background, padding: wp(3), borderRadius: theme.radius.md, borderRightWidth: 3, borderRightColor: theme.colors.primary },
  postAuthor: { fontSize: hp(1.4), fontWeight: '600', color: theme.colors.textSecondary },
  postContent: { fontSize: hp(1.6), color: theme.colors.textPrimary },
  emptyContainer: { alignItems: 'center', paddingVertical: hp(8) },
  emptyTitle: { fontSize: hp(2.2), fontWeight: 'bold', color: theme.colors.textPrimary },
  modalContainer: { flex: 1, backgroundColor: theme.colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: wp(4), borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modalTitle: { fontSize: hp(2.4), fontWeight: 'bold', color: theme.colors.textPrimary },
  modalContent: { flex: 1, padding: wp(4) },
  section: { marginBottom: hp(3) },
  sectionTitle: { fontSize: hp(2), fontWeight: 'bold', color: theme.colors.textPrimary },
  detailText: { fontSize: hp(1.6), color: theme.colors.textSecondary, marginBottom: hp(0.5) },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: wp(3), marginBottom: hp(1) },
  userName: { fontSize: hp(1.8), fontWeight: '600', color: theme.colors.textPrimary },
  userEmail: { fontSize: hp(1.4), color: theme.colors.textSecondary },
  postText: { fontSize: hp(1.6), color: theme.colors.textPrimary, marginBottom: hp(1) },
  postDate: { fontSize: hp(1.3), color: theme.colors.textLight },
  actionSection: { marginTop: hp(2), borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: hp(2) },
  modalActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: hp(1.5), borderRadius: theme.radius.lg, marginBottom: hp(1.5), gap: wp(2) },
  deletePostBtn: { backgroundColor: theme.colors.rose },
  approveBtn: { backgroundColor: theme.colors.success },
  dismissBtn: { backgroundColor: theme.colors.warning },
  modalActionText: { color: '#fff', fontSize: hp(1.6), fontWeight: '600' },
});

export default Reports;
