import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';
import { supabaseUrl } from '../constants';

export const uploadAudioFile = async (fileUri) => {
  try {
    if (!fileUri) {
      return { success: false, msg: 'Missing audio file URI' };
    }

    const fileName = getAudioFilePath(); 

    const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileBuffer = decode(fileBase64);

    const { error } = await supabase.storage
      .from('uploads')
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'audio/m4a',
      });

    if (error) {
      console.error('Audio upload error:', error.message);
      return { success: false, msg: 'Could not upload audio' };
    }

    const publicUrl = supabase.storage.from('uploads').getPublicUrl(fileName).data.publicUrl;

    return { success: true, data: publicUrl };
  } catch (error) {
    console.error('Unexpected audio upload error:', error.message);
    return { success: false, msg: 'Unexpected error occurred' };
  }
};

const getAudioFilePath = () => {
  return `audio/${Date.now()}.m4a`;
};