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
import {Video} from 'expo-av'
import { createOrUpdatePost } from '../../services/PostService'
import { useLocalSearchParams, useRouter } from 'expo-router';

const NewPost = () => {

  const post = useLocalSearchParams()
  console.log('post', post)
  const { user } = useAuth();
  const bodyRef = useRef("");
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const router = useRouter();

  useEffect(()=> {
    if(post && post.id){
      bodyRef.current = post.body
      setFile(post.file || null)
      setTimeout(()=> {
        editorRef?.current?.setContentHTML(post.body)
      }, 300)

    }
  },[])

  const onPick=async (isImage)=>{

    let mediaConfig = {
          mediaTypes: ImagePicker.MediaType.Images,
          allowsEditing: true,
          aspect: [4,3],
          quality: 0.7,


    }
    if(!isImage){
        mediaConfig={
          mediaTypes: ImagePicker.MediaType.Videos,
          allowsEditing: true
        }
    }

    let result = await ImagePicker.launchImageLibraryAsync(mediaConfig)
             
    if(!result.canceled){
      setFile(result.assets[0]);
    }

  }  
  const isLocalFile = file =>{
      if(!file) return null
      if(typeof file == 'object') return true

      return false
  }
  const getFileType = file =>{
      if(!file) return null
      if(isLocalFile(file)){
          return file.type
      }


      // check image or video for remote file
      if(file.includes('postImages')){
          return 'image'
      }

      return 'video'
  }
  const getFileUri = file =>{
      if(!file) return null
      if(isLocalFile(file)){
          return file.uri

      }

      return getSupabaseFileUrl(file)?.uri
  }

  const onSubmit = async () => {
    if (!bodyRef.current && !file) {
      Alert.alert('Post', "please choose an image or add post body");
      return;
    }
  
    let data = {
      file,
      body: bodyRef.current,
      userId: user?.id,
    };

    if(post && post.id) data.id = post.id
  
    // create post
    setLoading(true);
    let res = await createOrUpdatePost(data);
    setLoading(false);
    if (res.success) {
      setFile(null);
      bodyRef.current = '';
      editorRef.current?.setContentHTML('');
      router.replace('/home'); // חזרה למסך הבית
    } else {
      Alert.alert('Post', res.msg);
    }
  }

  return (
    <ScreenWrapper bg="white">
      <View style={styles.container}>
        <Header title="Create Post" />
  
        {/* החלק שגוללים בו */}
        <View style={styles.content}>
          <ScrollView contentContainerStyle={{ gap: 20, flexGrow: 1 }}>
            {/* Avatar */}
            <View style={styles.header}>
              <Avatar
                uri={user?.image}
                size={hp(6.5)}
                rounded={theme.radius.xl}
              />
              <View style={{ gap: 2 }}>
                <Text style={styles.username}>{user?.name}</Text>
                <Text style={styles.publicText}>Public</Text>
              </View>
            </View>
  
            {/* תיבת טקסט מעוצבת */}
            <View style={styles.textEditor}>
              <RichTextEditor
                editorRef={editorRef}
                onChange={(body) => (bodyRef.current = body)}
              />
            </View>
  
            {
              file && (
                <View style={styles.file}>
                      {
                          getFileType(file) == 'video'? (
                              <Video
                                  style={{flex: 1}}
                                  source={{
                                      uri: getFileUri(file)
                                  }}
                                  useNativeControls
                                  resizeMode='cover'
                                  isLooping
                                />
                          ):(
                                <Image source={{uri: getFileUri(file)}} resizeMode='cover' style={{flex: 1}} />
                          )
                      }

                      <Pressable style={styles.closeIcon} onPress={()=> setFile(null)} >
                            <Icon name="delete" size={20} color="white" />
                      </Pressable>
                </View>
              )
            }

            {/* אזור המדיה */}
            <View style={styles.media}>
              <Text style={styles.addImageText}>Add to your post</Text>
              <View style={styles.mediaIcons}>
                <TouchableOpacity onPress={() => onPick(true)}>
                  <Icon name="image" size={30} color={theme.colors.dark} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onPick(false)}>
                  <Icon name="video" size={33} color={theme.colors.dark} />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
  
        {/* הכפתור נמצא מחוץ ל-ScrollView כדי להצמיד אותו לתחתית */}
        <View style={styles.buttonContainer}>
          <Button
            buttonStyle={{ height: hp(6.2), width: '100%' }} // הכפתור ימלא את כל הרוחב
            title={post && post.id? "Update": "Post"}
            loading={loading}
            hasShadow={false}
            onPress={onSubmit}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
  
}

export default NewPost

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 30,
    paddingHorizontal: wp(4),
    gap: 15,
  },
  content: {
    flex: 1, // מאפשר ל-ScrollView למלא את הגובה
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
    textAlign: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  username: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  avatar: {
        height: hp(6.5),
        width: hp(6.5),
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    publicText: {
        fontSize: hp(1.7),
        fontWeight: theme.fonts.medium,
        color: theme.colors.textLight,
    },
  textEditor: {
    marginTop: 10,
  },

  media: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    padding: 12,
    paddingHorizontal: 18,
    borderRadius: theme.radius.xl,
    borderCurve: 'continuous',
    borderColor: theme.colors.gray,
  },

  mediaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },

  addImageText: {
    fontSize: hp(1.9),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },

  imageIcon: {
    borderRadius: theme.radius.md,
    padding: 6,
  },

  file: {
    height: hp(30),
    width: '100%',
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderCurve: 'continuous',
  },

  video: {},

  buttonContainer: {
    paddingBottom: 20, // מרווח מהתחתית
    backgroundColor: 'white', // רקע כדי שהכפתור לא יהיה שקוף
    paddingTop: 10, // מרווח קטן מעל הכפתור
    alignItems: 'center', // ממקם את הכפתור באמצע
    width: '100%', // מבטיח שהתיבה שבה הכפתור נמצא תמלא את כל הרוחב
  },

  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 7,
    borderRadius: 50,
    backgroundColor: 'rgba(8, 8, 8, 0.45)',
  },
});