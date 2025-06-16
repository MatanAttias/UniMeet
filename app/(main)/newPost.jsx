import { Alert, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import Header from '../../components/Header'
import { hp, wp } from '../../constants/helpers/common'
import { theme } from '../../constants/theme'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../contexts/AuthContext'
import RichTextEditor from '../../components/RichTextEditor'
import Button from '../../components/Button'
import * as ImagePicker from 'expo-image-picker'
import Icon from '../../assets/icons'
import { Image } from 'expo-image'
import { getSupabaseFileUrl } from '../../services/imageService'
import { Video } from 'expo-av'
import { createOrUpdatePost } from '../../services/PostService'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Animated } from 'react-native'
import {
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

const NewPost = () => {
  const post = useLocalSearchParams()
  const { user } = useAuth()
  const bodyRef = useRef('')
  const editorRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const router = useRouter()
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (post && post.id) {
      bodyRef.current = post.body
      setFile(post.file || null)
      setTimeout(() => {
        editorRef?.current?.setContentHTML(post.body)
      }, 300)
    }
  }, [])

  const onPick = async (isImage) => {
    let mediaConfig = {
      mediaTypes: isImage ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    }

    const result = await ImagePicker.launchImageLibraryAsync(mediaConfig)
    if (!result.canceled) {
      setFile(result.assets[0])
    }
  }

  const isLocalFile = (file) => typeof file === 'object'

  const getFileType = (file) => {
    if (!file) return null
    if (isLocalFile(file)) return file.type
    return file.includes('postImages') ? 'image' : 'video'
  }

  const getFileUri = (file) => {
    if (!file) return null
    return isLocalFile(file) ? file.uri : getSupabaseFileUrl(file)?.uri
  }

  const onSubmit = async () => {
    if (!bodyRef.current && !file) {
      Alert.alert('פוסט', 'אנא בחר תמונה או הוסף תוכן לפוסט')
      return
    }

    let data = {
      file,
      body: bodyRef.current,
      userId: user?.id,
    }
    if (post && post.id) data.id = post.id

    setLoading(true)
    const res = await createOrUpdatePost(data)
    setLoading(false)

    if (res.success) {
      setFile(null)
      bodyRef.current = ''
      editorRef.current?.setContentHTML('')
      router.replace('/home')
    } else {
      Alert.alert('פוסט', res.msg)
    }
  }
  console.log("Profile Image URL:", user?.image);
  console.log("Full user object:", user);
  return (
    <ScreenWrapper bg="black">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.container}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backText}>חזור</Text>
            </Pressable>
  
            <Text style={styles.title}>יצירת פוסט</Text>
  
            <View style={styles.content}>
              <ScrollView contentContainerStyle={{ gap: 20, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Avatar uri={user?.image} size={hp(6.5)} rounded={theme.radius.xl} />
              <Text style={styles.username}>{user?.name}</Text>
            </View>

            <Animated.View style={styles.textEditor}>
              <RichTextEditor editorRef={editorRef} onChange={(body) => (bodyRef.current = body)} />
            </Animated.View>

            {file && (
              <View style={styles.filePreview}>
                {getFileType(file) === 'video' ? (
                  <Video
                    style={{ flex: 1 }}
                    source={{ uri: getFileUri(file) }}
                    useNativeControls
                    resizeMode="cover"
                    isLooping
                  />
                ) : (
                  <Image source={{ uri: getFileUri(file) }} resizeMode="cover" style={{ flex: 1 }} />
                )}
                <Pressable style={styles.deleteButton} onPress={() => setFile(null)}>
                  <Icon name="delete" size={20} color="white" />
                </Pressable>
              </View>
            )}

            <View style={styles.mediaRow}>
              <TouchableOpacity onPress={() => onPick(true)}>
                <Icon name="image" size={30} color={theme.colors.dark} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onPick(false)}>
                <Icon name="video" size={33} color={theme.colors.dark} />
              </TouchableOpacity>
              <Text style={styles.addImageText}>הוסף לפוסט שלך תמונה או סירטון</Text>
            </View>
          </ScrollView>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            buttonStyle={{ height: hp(6.2), width: '100%' }}
            title={post && post.id ? 'עדכון' : 'פרסם'}
            loading={loading}
            hasShadow={false}
            onPress={onSubmit}
          />
        </View>
      </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  </ScreenWrapper>
  )
}

export default NewPost

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 30,
    paddingHorizontal: wp(4),
    gap: 15,
    backgroundColor: theme.colors.background,  
    writingDirection: 'rtl',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: hp(2.8),
    fontWeight: 'bold',
    color: theme.colors.primary,  
    textAlign: 'center',
    marginTop: -5,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginTop: 25,
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.primary, 
    textAlign: 'right',
  },
  textEditor: {
    borderRadius: theme.radius.md,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    backgroundColor: theme.colors.black + 'cc', 
    elevation: 6,
    transform: [{ scale: 1 }],
    transitionDuration: '300ms',
  },
  filePreview: {
    height: hp(30),
    width: '100%',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e0e0e5', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.4)', 
    padding: 5,
    borderRadius: 20,
    opacity: 0.8,
    transitionDuration: '200ms',
  },
  mediaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary + 'cc', 
    borderRadius: theme.radius.xl,
    padding: 12,
    gap: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addImageText: {
    fontSize: hp(1.8),
    color: theme.colors.black + 'dd', 
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
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
    alignSelf: 'flex-end',  
    marginTop: 13,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: hp(2),
    fontWeight: '600',
  },
})
