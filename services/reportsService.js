import { supabase } from '../lib/supabase';

// 1. Create a new report - תוקן להתמודד עם bigint
export const createReport = async (reportData) => {
  try {
    console.log('🚨 Creating report with data:', reportData);
    const postIdAsNumber = parseInt(reportData.postId, 10);
    if (isNaN(postIdAsNumber)) {
      console.error('❌ Invalid post ID:', reportData.postId);
      return { success: false, msg: 'מזהה פוסט לא תקין' };
    }

    // בדוק אם כבר דיווחת על הפוסט הזה
    const { data: existingReport, error: checkError } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', reportData.reporterId)
      .eq('post_id', postIdAsNumber)
      .single();
    if (existingReport && !checkError) {
      console.log('❌ User already reported this post');
      return { success: false, msg: 'כבר דיווחת על הפוסט הזה' };
    }

    const { data, error } = await supabase
      .from('reports')
      .insert([{        
        reporter_id: reportData.reporterId,
        post_id: postIdAsNumber,
        reason: reportData.reason,
        description: reportData.description || null,
        created_at: new Date().toISOString(),
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Create report error:', error);
      return { success: false, msg: error.message || 'לא ניתן לשלוח דיווח' };
    }

    console.log('✅ Report created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Create report error:', error);
    return { success: false, msg: error.message || 'לא ניתן לשלוח דיווח' };
  }
};

// 2. Fetch all reports (for admin)
export const fetchAllReports = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:users!reporter_id(id, name, email, image),
        post:posts!post_id(
          id,
          body,
          file,
          created_at,
          user:users!userId(id, name, email, image)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Fetch all reports error:', error);
    return { success: false, msg: error.message || 'לא ניתן לטעון דיווחים' };
  }
};

// 3. Delete a post and update its report to "approved" with action "post_deleted"
export const deletePostAndUpdateReport = async (postId, reportId) => {
  try {
    console.log('🔄 Starting deletePostAndUpdateReport:', { postId, reportId });

    // המרת postId למספר
    const postIdAsNumber = parseInt(postId, 10);
    if (isNaN(postIdAsNumber)) {
      return { success: false, msg: 'מזהה פוסט לא תקין' };
    }

    // שלב 1: בדיקה שהפוסט קיים
    const { data: postCheck, error: postCheckError } = await supabase
      .from('posts')
      .select('id, userId, body')
      .eq('id', postIdAsNumber)
      .single();
    console.log('📋 Post check result:', { postCheck, postCheckError });
    if (postCheckError) {
      if (postCheckError.code === 'PGRST116') {
        return { success: false, msg: 'הפוסט לא קיים במערכת' };
      }
      return { success: false, msg: 'שגיאה בבדיקת הפוסט' };
    }

    // שלב 2: בדיקה שהדיווח קיים
    const { data: reportCheck, error: reportCheckError } = await supabase
      .from('reports')
      .select('id, status, post_id')
      .eq('id', reportId)
      .single();
    console.log('📋 Report check result:', { reportCheck, reportCheckError });
    if (reportCheckError) {
      if (reportCheckError.code === 'PGRST116') {
        return { success: false, msg: 'הדיווח לא קיים במערכת' };
      }
      return { success: false, msg: 'שגיאה בבדיקת הדיווח' };
    }

    // שלב 3: בדיקה שהדיווח מתייחס לפוסט הנכון
    if (reportCheck.post_id !== postIdAsNumber) {
      return { success: false, msg: 'הדיווח לא מתייחס לפוסט המבוקש' };
    }

    // שלב 4: עדכון הדיווח
    console.log('📝 Updating report:', reportId);
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'approved',
        resolved_at: new Date().toISOString(),
        admin_action: 'post_deleted'
      })
      .eq('id', reportId)
      .select()
      .single();
    if (updateError) {
      console.error('❌ Update report error:', updateError);
      return { success: false, msg: 'הפוסט נמחק אך לא ניתן לעדכן את הדיווח' };
    }
    console.log('✅ Report updated successfully:', updatedReport);

    // שלב 5: מחיקת הפוסט
    console.log('🗑️ Deleting post:', postIdAsNumber);
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postIdAsNumber);
    if (deleteError) {
      console.error('❌ Delete post error:', deleteError);
      return { success: false, msg: 'לא ניתן למחוק את הפוסט' };
    }
    console.log('✅ Post deleted successfully');

    return { success: true, data: updatedReport };
  } catch (error) {
    console.error('❌ deletePostAndUpdateReport error:', error);
    return { success: false, msg: error.message || 'לא ניתן למחוק פוסט ולעדכן דיווח' };
  }
};

// 4. Approve report without deleting post
export const approveReportWithoutDeletion = async (reportId) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .update({
        status: 'approved',
        resolved_at: new Date().toISOString(),
        admin_action: 'approved_no_action'
      })
      .eq('id', reportId)
      .select()
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Approve report error:', error);
    return { success: false, msg: error.message || 'לא ניתן לאשר דיווח' };
  }
};

// 5. Dismiss report
export const dismissReport = async (reportId) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .update({
        status: 'dismissed',
        resolved_at: new Date().toISOString(),
        admin_action: 'dismissed'
      })
      .eq('id', reportId)
      .select()
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Dismiss report error:', error);
    return { success: false, msg: error.message || 'לא ניתן לדחות דיווח' };
  }
};

// 6. Get basic reports stats
export const getReportsStats = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('status');
    if (error) throw error;
    const stats = {
      total: data.length,
      pending: data.filter(r => !r.status || r.status === 'pending').length,
      approved: data.filter(r => r.status === 'approved').length,
      dismissed: data.filter(r => r.status === 'dismissed').length,
    };
    return { success: true, data: stats };
  } catch (error) {
    console.error('Get reports stats error:', error);
    return { success: false, msg: error.message || 'לא ניתן לטעון סטטיסטיקות' };
  }
};

// 7. Check if user already reported a post - תוקן להתמודד עם bigint
export const checkUserReportedPost = async (userId, postId) => {
  try {
    const postIdAsNumber = parseInt(postId, 10);
    if (isNaN(postIdAsNumber)) {
      return { success: false, msg: 'מזהה פוסט לא תקין' };
    }
    const { data, error } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', userId)
      .eq('post_id', postIdAsNumber)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return { success: true, hasReported: !!data };
  } catch (error) {
    console.error('Check user reported post error:', error);
    return { success: false, msg: error.message || 'לא ניתן לבדוק דיווח קודם' };
  }
};

// 8. Fetch reports by reason
export const fetchReportsByReason = async (reason) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:users!reporter_id(id, name, email, image),
        post:posts!post_id(
          id,
          body,
          file,
          created_at,
          user:users!userId(id, name, email, image)
        )
      `)
      .eq('reason', reason)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Fetch reports by reason error:', error);
    return { success: false, msg: error.message || 'לא ניתן לטעון דיווחים לפי סיבה' };
  }
};

// 9. Fetch reports by date range
export const fetchReportsByDateRange = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:users!reporter_id(id, name, email, image),
        post:posts!post_id(
          id,
          body,
          file,
          created_at,
          user:users!userId(id, name, email, image)
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Fetch reports by date range error:', error);
    return { success: false, msg: error.message || 'לא ניתן לטעון דיווחים לפי תאריך' };
  }
};

// 10. Delete a report outright
export const deleteReport = async (reportId) => {
  try {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Delete report error:', error);
    return { success: false, msg: error.message || 'לא ניתן למחוק דיווח' };
  }
};

// 11. Add or update admin note on a report
export const addAdminNote = async (reportId, note) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .update({ admin_notes: note })
      .eq('id', reportId)
      .select()
      .single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Add admin note error:', error);
    return { success: false, msg: error.message || 'לא ניתן להוסיף הערה' };
  }
};

// 12. Fetch pending reports only
export const fetchPendingReports = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:users!reporter_id(id, name, email, image),
        post:posts!post_id(
          id,
          body,
          file,
          created_at,
          user:users!userId(id, name, email, image)
        )
      `)
      .or('status.is.null,status.eq.pending')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Fetch pending reports error:', error);
    return { success: false, msg: error.message || 'לא ניתן לטעון דיווחים ממתינים' };
  }
};

// 13. Update report status directly (generic)
export const updateReportStatus = async (reportId, status, adminAction = null) => {
  try {
    const updateData = { status, resolved_at: new Date().toISOString() };
    if (adminAction) updateData.admin_action = adminAction;

    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Update report status error:', error);
    return { success: false, msg: error.message || 'לא ניתן לעדכן סטטוס דיווח' };
  }
};
