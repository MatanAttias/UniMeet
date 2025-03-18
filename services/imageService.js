import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system'
import { supabaseUrl } from '../constants';


export const getUserImageSrc = (imagePath) => {
    if (imagePath && imagePath.startsWith("http")) {
        return { uri: imagePath }; // אם זה URL חוקי, החזר אותו
    } else {
        return require('../assets/images/defaultUser.png'); // תמונת ברירת מחדל
    }
};

export const getSupabaseFileUrl = filePath => {
    if (!filePath) return undefined; // החזרת undefined במקרה שאין נתיב
    if (filePath.startsWith("http")) {
        return { uri: filePath }; // אם זה כבר URL מלא, מחזירים אותו כמו שהוא
    }
    return { uri: `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}` };
};

export const uploadFile = async (folderName, fileUri, isImage = true) => {
    try {
        let fileName = getFilePath(folderName, isImage);

        // קריאה של הקובץ כמערך של בתים
        const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64
        });

        let imageData = decode(fileBase64);

        let { data, error } = await supabase
            .storage
            .from('uploads')
            .upload(fileName, imageData, {
                cacheControl: '3600',
                upsert: false,
                contentType: isImage ? 'image/*' : 'video/*'
        });
            
        if (error) {
            console.error('File upload error:', error);
            return { success: false, msg: 'Could not upload media' };
        }

        // יצירת URL ישיר לתמונה
        const imageUrl = `${supabase.storage.from('uploads').getPublicUrl(fileName).data.publicUrl}`;

        console.log('Upload successful:', imageUrl);
        return { success: true, data: imageUrl };

    } catch (error) {
        console.error('Unexpected file upload error:', error);
        return { success: false, msg: 'Unexpected error occurred' };
    }
};


export const getFilePath = (folderName, isImage) => {
    return `${folderName}/${new Date().getTime()}${isImage ? '.png' : '.mp4'}`;
};
