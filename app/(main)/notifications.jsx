import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { fetchNotifications } from '../../services/notificationService'
import ScreenWrapper from '../../components/ScreenWrapper'
import { hp, wp } from '../../constants/helpers/common'
import { useRouter } from 'expo-router'
import NotificationItem from '../../components/NotificationItem'
import { theme } from '../../constants/theme'
import Header from '../../components/Header'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    getNotifications()
  }, [])

  const getNotifications = async () => {
    let res = await fetchNotifications(user.id)
    if (res.success) setNotifications(res.data)
  }

  const goBack = () => router.back();

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={styles.container}>
        <Header title="התראות" />
        
        {/* כפתור חזור */}
        <Pressable style={styles.backButton} onPress={goBack}>
          <Text style={styles.backText}>חזור</Text>
        </Pressable>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listStyle}
        >
          {notifications.length > 0 ? (
            notifications.map(item => (
              <NotificationItem
                item={item}
                key={item?.id}
                router={router}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>אין התראות חדשות</Text>
              <Text style={styles.emptySubtitle}>
                כשמישהו יעשה לייק או יגיב לפוסט שלך, תקבל התראה כאן
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  )
}

export default Notifications

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  backButton: {
    position: 'absolute',
    top: hp(8),
    right: wp(4),
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
    zIndex: 10,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: hp(1.8),
    fontWeight: theme.fonts.semibold,
  },
  listStyle: {
    paddingTop: hp(2), 
    paddingBottom: hp(5),
    gap: hp(1),
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
    marginTop: hp(10),
  },
  emptyTitle: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: hp(1),
  },
  emptySubtitle: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: hp(2.5),
    writingDirection: 'rtl',
  },
});