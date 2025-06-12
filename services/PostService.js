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
        comments(count)
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
  if (!userId) return { success: false, msg: 'Missing user ID' };

  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .select(`
        id,
        created_at,
        posts (
          id,
          body,
          file,
          userId,
          created_at,
          users (
            id,
            name,
            image
          ),
          postLikes:postLikes(count),
          comments:comments(count)
        )
      `)
      .eq('userid', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch saved posts error:', error);
      return { success: false, msg: error.message };
    }

    // פרמט את הנתונים
    const formattedPosts = data.map(savedPost => ({
      ...savedPost.posts,
      user: savedPost.posts.users,
      savedAt: savedPost.created_at,
      isSaved: true
    }));

    return { success: true, data: formattedPosts };
  } catch (error) {
    console.error('Fetch saved posts error:', error);
    return { success: false, msg: error.message };
  }
};

// שמירת פוסט
export const savePost = async (userId, postId) => {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .insert([{
        userid: userId,
        postid: postId
      }]);

    if (error) {
      return { success: false, msg: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Save post error:', error);
    return { success: false, msg: error.message };
  }
};

// בדיקה אם פוסט שמור
export const isPostSaved = async (userId, postId) => {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('userid', userId)
      .eq('postid', postId)
      .single();

    return { success: true, isSaved: !!data };
  } catch (error) {
    return { success: true, isSaved: false };
  }
};

// הסרת פוסט מהשמורים
export const unsavePost = async (userId, postId) => {
  try {
    const { data, error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('userid', userId)
      .eq('postid', postId)
      .select();

    if (error) {
      console.error('Unsave post error:', error);
      return { success: false, msg: error.message };
    }

    console.log('✅ Post unsaved successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unsave post error:', error);
    return { success: false, msg: error.message };
  }
};

// בדיקה אם טיפ שמור
export const isParentTipSaved = async (userId, tipId) => {
  try {
    const { data, error } = await supabase
      .from('saved_tips')
      .select('id')
      .eq('user_id', userId)
      .eq('tip_id', tipId)
      .single();

    return { success: true, isSaved: !!data };
  } catch (error) {
    return { success: true, isSaved: false };
  }
};

// שמירת טיפ להורים
export const saveParentTip = async (userId, tipData) => {
  try {
    console.log('🔄 Attempting to save tip:', { userId, tipData });
    
    const { data, error } = await supabase
      .from('saved_tips')
      .insert([{
        user_id: userId,
        tip_id: tipData.id,
        tip_title: tipData.title,
        tip_content: tipData.content || tipData.summary,
        tip_category: tipData.category,
        saved_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Save tip error:', error);
      
      // טיפול בשגיאת duplicate
      if (error.code === '23505') {
        return { success: false, msg: 'הטיפ כבר שמור ברשימה שלך' };
      }
      
      return { success: false, msg: error.message };
    }

    console.log('✅ Tip saved successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Save tip error:', error);
    return { success: false, msg: error.message };
  }
};

// הסרת טיפ מהשמורים
export const unsaveParentTip = async (userId, tipId) => {
  try {
    console.log('🗑️ Attempting to unsave tip:', { userId, tipId });
    
    const { data, error } = await supabase
      .from('saved_tips')
      .delete()
      .eq('user_id', userId)
      .eq('tip_id', tipId)
      .select();

    if (error) {
      console.error('Unsave tip error:', error);
      return { success: false, msg: error.message };
    }

    console.log('✅ Tip unsaved successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Unsave tip error:', error);
    return { success: false, msg: error.message };
  }
};

// שליפת טיפים שמורים
export const fetchSavedTips = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('saved_tips')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) {
      return { success: false, msg: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Fetch saved tips error:', error);
    return { success: false, msg: error.message };
  }
};