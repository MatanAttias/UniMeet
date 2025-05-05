import { supabase } from "../lib/supabase";
import { uploadFile } from "./imageService";

// יצירת פוסט או עדכון פוסט קיים
export const createOrUpdatePost = async (post) => {
  try {
    if (post.file && typeof post.file === 'object') {
      const isImage = post.file.type === 'image';
      const folderName = isImage ? 'postImages' : 'postVideos';
      const fileResult = await uploadFile(folderName, post.file.uri, isImage);

      if (!fileResult.success) return fileResult;
      post.file = fileResult.data;
    }

    const { data, error } = await supabase
      .from('posts')
      .upsert(post)
      .select()
      .single();

    if (error) {
      console.error('createOrUpdatePost error:', error);
      return { success: false, msg: 'יצירת הפוסט נכשלה' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('createOrUpdatePost error:', error);
    return { success: false, msg: 'שגיאה בלתי צפויה ביצירת הפוסט' };
  }
};

// שליפת פוסטים
export const fetchPosts = async (limit = 15, userId) => {
  try {
    const query = supabase
      .from('posts')
      .select(`
        *,
        user: users (id, name, image),
        postLikes (*),
        comments (count)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) query.eq('userId', userId);

    const { data, error } = await query;

    if (error) {
      console.error('fetchPosts error:', error);
      return { success: false, msg: 'שליפת פוסטים נכשלה' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('fetchPosts error:', error);
    return { success: false, msg: 'שגיאה בשליפת פוסטים' };
  }
};

// שליפת פוסט לפי מזהה
export const fetchPostDetails = async (postId) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        user: users (id, name, image),
        postLikes (*),
        comments (*, user: users(id, name, image))
      `)
      .eq('id', postId)
      .order('created_at', { ascending: false, foreignTable: 'comments' })
      .single();

    if (error) {
      console.error('fetchPostDetails error:', error);
      return { success: false, msg: 'שליפת הפוסט נכשלה' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('fetchPostDetails error:', error);
    return { success: false, msg: 'שגיאה בשליפת פרטי הפוסט' };
  }
};

// לייק לפוסט
export const createPostLike = async (postLike) => {
  try {
    const { data, error } = await supabase
      .from('postLikes')
      .insert(postLike)
      .select()
      .single();

    if (error) {
      console.error('createPostLike error:', error);
      return { success: false, msg: 'לא ניתן לעשות לייק' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('createPostLike error:', error);
    return { success: false, msg: 'שגיאה בלייק לפוסט' };
  }
};

// הסרת לייק
export const removePostLike = async (postId, userId) => {
  try {
    const { error } = await supabase
      .from('postLikes')
      .delete()
      .eq('userId', userId)
      .eq('postId', postId);

    if (error) {
      console.error('removePostLike error:', error);
      return { success: false, msg: 'לא ניתן להסיר לייק' };
    }

    return { success: true };
  } catch (error) {
    console.error('removePostLike error:', error);
    return { success: false, msg: 'שגיאה בהסרת לייק' };
  }
};

// יצירת תגובה
export const createComment = async (comment) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select()
      .single();

    if (error) {
      console.error('createComment error:', error);
      return { success: false, msg: 'לא ניתן לשלוח תגובה' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('createComment error:', error);
    return { success: false, msg: 'שגיאה בשליחת תגובה' };
  }
};

// מחיקת תגובה
export const removeComment = async (commentId) => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('removeComment error:', error);
      return { success: false, msg: 'לא ניתן למחוק את התגובה' };
    }

    return { success: true, data: { commentId } };
  } catch (error) {
    console.error('removeComment error:', error);
    return { success: false, msg: 'שגיאה במחיקת תגובה' };
  }
};

// מחיקת פוסט
export const removePost = async (postId) => {
  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('removePost error:', error);
      return { success: false, msg: 'לא ניתן למחוק את הפוסט' };
    }

    return { success: true, data: { postId } };
  } catch (error) {
    console.error('removePost error:', error);
    return { success: false, msg: 'שגיאה במחיקת פוסט' };
  }
};


// שליפת פוסטים שמורים
export const fetchSavedPosts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .select(`
        post: posts (
          *,
          user: users (id, name, image),
          postLikes (*),
          comments (count)
        )
      `)
      .eq('userId', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('fetchSavedPosts error:', error);
      return { success: false, msg: 'שליפת פוסטים שמורים נכשלה' };
    }

    // החזרת רק הפוסטים מתוך המערך
    const posts = data.map((entry) => entry.post);

    return { success: true, data: posts };
  } catch (error) {
    console.error('fetchSavedPosts error:', error);
    return { success: false, msg: 'שגיאה בשליפת פוסטים שמורים' };
  }
};
