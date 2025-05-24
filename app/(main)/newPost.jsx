import React, { useEffect, useRef, useState } from 'react'
import {
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native'
import ScreenWrapper from '../../components/ScreenWrapper'
import Header from '../../components/Header'
import { hp, wp } from '../../constants/helpers/common'
import { theme } from '../../constants/theme'
import Avatar from '../../components/Avatar'
import RichTextEditor from '../../components/RichTextEditor'
import Button from '../../components/Button'
import Icon from '../../assets/icons'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { Video } from 'expo-av'
import { useAuth } from '../../contexts/AuthContext'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getSupabaseFileUrl } from '../../services/imageService'
import { createOrUpdatePost } from '../../services/PostService'

export default function NewPost() {
  const post = useLocalSearchParams()
  const { user } = useAuth()
  const router = useRouter()
  const bodyRef = useRef('')
  const editorRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)

  useEffect(() => {
    if (post?.id) {
      bodyRef.current = post.body
      setFile(post.file || null)
      setTimeout(() => editorRef.current?.setContentHTML(post.body), 300)
    }
  }, [])

  const onPick = async (isImage) => {
    const config = {
      mediaTypes: isImage ? ImagePicker.MediaType.Images : ImagePicker.MediaType.Videos,
      allowsEditing: true,
      aspect: isImage ? [4, 3] : undefined,
      quality: isImage ? 0.7 : undefined,
    }
    const result = await ImagePicker.launchImageLibraryAsync(config)
    if (!result.canceled) setFile(result.assets[0])
  }

  const isLocal = (f) => f && typeof f === 'object'
  const fileType = (f) => {
    if (!f) return null
    if (isLocal(f)) return f.type
    return f.includes('postImages') ? 'image' : 'video'
  }
  const fileUri = (f) => (isLocal(f) ? f.uri : getSupabaseFileUrl(f)?.uri)

  const onSubmit = async () => {
    if (!bodyRef.current && !file) {
      Alert.alert('Post', 'Please add text or select media.')
      return
    }
    setLoading(true)
    const payload = { id: post?.id, userId: user.id, body: bodyRef.current, file }
    const res = await createOrUpdatePost(payload)
    setLoading(false)
    if (res.success) {
      editorRef.current?.setContentHTML('')
      setFile(null)
      router.replace('/home')
    } else {
      Alert.alert('Post', res.msg)
    }
  }

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <SafeAreaView style={styles.flex}>
        {/* ======= Header עם כפתור סגירה ו־Post ======= */}
        <Header
          leftIcon="close"
          onLeftPress={() => router.back()}
          rightElement={
            <TouchableOpacity onPress={onSubmit} style={styles.postButton}>
              <Text style={styles.postText}>{post?.id ? 'Update' : 'Post'}</Text>
            </TouchableOpacity>
          }
        />

        {/* ======= Selector של ערוץ (Posting in …) ======= */}
        <View style={styles.selector}>
          <Text style={styles.selectorLabel}>Posting in</Text>
          <TouchableOpacity style={styles.selectorBtn}>
            <Text style={styles.selectorText}>General</Text>
            <Icon name="chevron-down" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* ======= תוכן הגולל ======= */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar + שם משתמש */}
            <View style={styles.userRow}>
              <Avatar uri={user.image} size={hp(6)} rounded={theme.radius.xl} />
              <Text style={styles.username}>{user.name}</Text>
            </View>

            {/* Editor */}
            <View style={styles.editorWrapper}>
              <RichTextEditor
                editorRef={editorRef}
                onChange={(html) => (bodyRef.current = html)}
                style={styles.editor}
                placeholder="What's on your mind?"
              />
            </View>

            {/* תצוגת מדיה אם נבחרה */}
            {file && (
              <View style={styles.mediaPreviewContainer}>
                {fileType(file) === 'video' ? (
                  <Video
                    source={{ uri: fileUri(file) }}
                    useNativeControls
                    resizeMode="cover"
                    isLooping
                    style={styles.mediaPreview}
                  />
                ) : (
                  <Image source={{ uri: fileUri(file) }} style={styles.mediaPreview} />
                )}
                <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
                  <Icon name="delete" size={18} color="white" />
                </Pressable>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* ======= ToolBar תחתון עם אייקונים ======= */}
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={() => onPick(true)}>
            <Icon name="image" size={28} color={theme.colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onPick(false)}>
            <Icon name="camera" size={28} color={theme.colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon name="gif" size={28} color={theme.colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon name="audio" size={28} color={theme.colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon name="more-horizontal" size={28} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  postButton: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  postText: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.white,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    gap: wp(2),
  },
  selectorLabel: {
    fontSize: hp(1.8),
    color: theme.colors.textLight,
  },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
  },
  selectorText: {
    fontSize: hp(1.9),
    color: theme.colors.text,
    marginRight: wp(1),
  },
  scrollContainer: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    gap: hp(2),
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  editorWrapper: {
    minHeight: hp(20),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  editor: {
    padding: wp(3),
    color: theme.colors.text,
  },
  mediaPreviewContainer: {
    width: '100%',
    height: hp(25),
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaPreview: {
    flex: 1,
    width: '100%',
  },
  closeIcon: {
    position: 'absolute',
    top: hp(1),
    right: wp(3),
    padding: hp(0.4),
    borderRadius: theme.radius.circle,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: hp(1),
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
})
