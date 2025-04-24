import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { supabaseUrl } from '../constants';

export const getUserImageSrc = (imagePath) => {
  if (imagePath && imagePath.startsWith("http")) {
    return { uri: imagePath }; // אם זה URL חוקי, החזר אותו
  } else {
    return require('../assets/images/defaultUser.png'); // תמונת ברירת מחדל
  }
};

export const getSupabaseFileUrl = (filePath) => {
  if (!filePath) return undefined;
  if (filePath.startsWith("http")) {
    return { uri: filePath };
  }
  return { uri: `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}` };
};

export const uploadFile = async (folderName, fileUri, isImage = true) => {
  try {
    if (!fileUri) {
      return { success: false, msg: 'Missing file URI' };
    }

    const fileName = getFilePath(folderName, isImage);

    const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileBuffer = decode(fileBase64);

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: isImage ? 'image/png' : 'video/mp4',
      });

    if (error) {
      console.error('File upload error:', error.message);
      return { success: false, msg: 'Could not upload file' };
    }

    const imageUrl = supabase
      .storage
      .from('uploads')
      .getPublicUrl(fileName).data.publicUrl;

    return { success: true, data: imageUrl };
  } catch (error) {
    console.error('Unexpected file upload error:', error.message);
    return { success: false, msg: 'Unexpected error occurred' };
  }
};

export const getFilePath = (folderName, isImage) => {
  return `${folderName}/${new Date().getTime()}${isImage ? '.png' : '.mp4'}`;
};
