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
    <ScreenWrapper>
      <Header title="Notifications" />
      
      {/* שורת כפתור חזור - בתוך View רגיל, לא absolute */}
      <View style={styles.backWrapper}>
        <Pressable style={styles.backButton} onPress={goBack}>
          <Text style={styles.backText}>חזור</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listStyle}
      >
        {
          notifications.map(item => (
            <NotificationItem
              item={item}
              key={item?.id}
              router={router}
            />
          ))
        }
        {
          notifications.length === 0 && (
            <Text style={styles.noData}>No notifications yet</Text>
          )
        }
      </ScrollView>
    </ScreenWrapper>
  )
}

export default Notifications

const styles = StyleSheet.create({
  backWrapper: {
    alignItems: 'flex-end',
    marginTop: hp(1),
    marginBottom: hp(1),
    paddingHorizontal: wp(4),
    marginTop: -400,
  },
  backButton: {
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
    marginTop: -150,

  },
  backText: {
    color: theme.colors.primary,
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
  listStyle: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(5),
    gap: 10,
  },
  noData: {
    fontSize: hp(1.8),
    fontWeight: theme.fonts.medium,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: hp(2),
  },
})