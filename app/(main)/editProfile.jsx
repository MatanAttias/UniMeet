import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWrapper'
import { hp, wp } from '../../constants/helpers/common'
import { theme } from '../../constants/theme'
import Header from '../../components/Header'
import { getUserImageSrc } from '../../services/imageService'
import { useAuth } from '../../contexts/AuthContext'
import { Image } from 'expo-image'
import Icon from '../../assets/icons'
import Input from '../../components/input'
import Button from '../../components/Button'
import { Alert } from 'react-native'
import { updateUser } from '../../services/userService'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { uploadFile } from '../../services/imageService'
import { supabase } from '../../lib/supabase';



const EditProfile = () => {

    const {user: currentUser, setUserData} = useAuth();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    
    const [user, setUser] = useState({
        name: '',
        phoneNumber: '',
        email: '',
        image: null,
        address: '',
        bio: ''
    });

    useEffect(() => {
        if (currentUser) {
            setUser({
                name: currentUser.name || '',
                phoneNumber: currentUser.phoneNumber || '',
                email: currentUser.email || '',
                image: currentUser.image || '',
                bio: currentUser.bio || '',
                address: currentUser.address || '',
            });
        }
    }, [currentUser]);

    const updateUserProfileImage = async (userId, imageUrl) => {

    
      const { data, error } = await supabase
          .from('users')
          .update({ image: imageUrl })
          .eq('id', userId)
          .select();
  
      if (error) {
          console.error("❌ Error updating user image:", error);
          return false;
      }
  
      console.log("✅ User image updated successfully:", data);
      return true;
  };
  
  
  
    const onPickImage = async ()=>{

        let result = await ImagePicker.launchImageLibraryAsync ({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4,3],
          quality: 0.7,
        });

        if (!result.canceled) {
          console.log(result.assets[0]);
          setUser({...user, image: result.assets[0]});
        }
    }
    
    const onSubmit = async () => {
      let userData = { ...user };
      setLoading(true);
      console.log("🚀 Start updating user profile...");
  
      try {
          if (typeof user.image === 'object') {
              console.log("📤 Uploading image to Supabase...");
              let imageRes = await uploadFile('profiles', user.image.uri, true);
  
              if (imageRes.success) {
                  userData.image = imageRes.data;
                  const updatedImage = await updateUserProfileImage(currentUser?.id, userData.image);
  
                  if (!updatedImage) throw new Error("Failed to update user image in DB");
              } else {
                  throw new Error("Image upload failed");
              }
          }
  
          console.log("📡 Sending updateUser request with data:", userData);
          const res = await updateUser(currentUser?.id, userData);
          console.log("🔄 Update user response:", res);
  
          if (!res.success) throw new Error("User update failed");
  
          setUserData({ ...currentUser, ...userData });
          router.back();
      } catch (error) {
          console.error("❌ Error updating profile:", error);
          Alert.alert("Update Failed", error.message);
      } finally {
          setLoading(false);
      }
  };
  
  
  

  let imageSource = user.image && typeof user.image == 'object'? user.image.uri : getUserImageSrc(user.image);

  
  return (
    <ScreenWrapper bg="white">
        <View style={styles.container}>
            <ScrollView style={{flex: 1}}>
                <Header title="Edit Profile"/>


                {/* form */}
                <View style={styles.form}>
                    <View style={styles.avatarContainer}>
                        <Image source={imageSource} style={styles.avatar}/>
                        <Pressable style={styles.cameraIcon} onPress={onPickImage}>
                            <Icon name="camera" size={20} storkewidth={2}/>
                        </Pressable>
                    </View>
                    <Text style={{fontSize: hp(1.5), color: theme.colors.text}}>
                        Please fill your profile details
                    </Text>
                    
                    <Input
                        icon={<Icon name="user" />}
                        placeholder='Enter your name'
                        value={user.name}
                        onChangeText={value=> setUser({...user, name: value})}
                    />
                    <Input
                        icon={<Icon name="call" />}
                        placeholder='Enter your phone number'
                        value={user.phoneNumber}
                        onChangeText={value=> setUser({...user, phoneNumber: value})}
                    />
                    <Input
                        icon={<Icon name="mail" />}
                        placeholder='Enter your email'
                        value={user.email}
                        onChangeText={value=> setUser({...user, email: value})}
                    /><Input
                        icon={<Icon name="location" />}
                        placeholder='Enter your address'
                        value={user.address}
                        onChangeText={value=> setUser({...user, address: value})}
                    /><Input
                        placeholder='Enter your bio'
                        value={user.bio}
                        multiline={true}
                        containerStyle={styles.bio}
                        onChangeText={value=> setUser({...user, bio: value})}
                    />

                    <Button title={'Update'} loading={loading} onPress={onSubmit} />

                </View>
            </ScrollView>
        </View>
    </ScreenWrapper>
  )
}

export default EditProfile;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: wp(4),
    },
    avatarContainer: {
        height: hp(14),
        width: hp(14),
        alignSelf: 'center',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: theme.radius.xxl * 1.8,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: theme.colors.darkLight,
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: -10,
        padding: 8,
        borderRadius: 50,
        backgroundColor: 'white',
        shadowColor: theme.colors.textLight,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 7,
    },
    form: {
        gap: 18,
        marginTop: 20,
    },
    bio: {
        flexDirection: 'row',
        height: hp(15),
        alignItems: 'flex-start',
        paddingVertical: 15,
    }
});
