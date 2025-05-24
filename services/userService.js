import { supabase } from '../lib/supabase';

// קבלת מידע על משתמש לפי מזהה
export const getUserData = async (userId) => {
  if (!userId) return { success: false, msg: 'חסר מזהה משתמש' };

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('id', userId)
      .single();

    if (error) return { success: false, msg: error.message };
    return { success: true, data };
  } catch (err) {
    console.error('getUserData error:', err);
    return { success: false, msg: err.message };
  }
};

// חיפוש משתמשים לפי מחרוזת בשם
export const searchUsersByName = async (searchTerm) => {
  if (!searchTerm) return { success: true, data: [] };

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, role, image')  // <-- הוסף כאן את שדה התמונה הרלוונטי
      .ilike('name', `%${searchTerm}%`);

    if (error) return { success: false, msg: error.message };
    return { success: true, data };
  } catch (err) {
    console.error('searchUsersByName error:', err);
    return { success: false, msg: err.message };
  }
};
// עדכון פרטי משתמש לפי מזהה
export const updateUser = async (userId, data) => {
  if (!userId || !data) return { success: false, msg: 'נתונים חסרים לעדכון' };

  try {
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', userId);

    if (error) return { success: false, msg: error.message };
    return { success: true };
  } catch (err) {
    console.error('updateUser error:', err);
    return { success: false, msg: err.message };
  }
};