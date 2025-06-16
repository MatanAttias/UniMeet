import { supabase } from "../lib/supabase";

/**
 * יצירת התראה חדשה
 * @param {Object} notification 
 */
export const createNotification = async (notification) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.log("❌ createNotification error:", error);
      return { success: false, msg: "שגיאה ביצירת ההתראה" };
    }

    return { success: true, data };
  } catch (error) {
    console.log("❌ createNotification catch:", error);
    return { success: false, msg: "שגיאה לא צפויה ביצירת ההתראה" };
  }
};

/**
 * @param {string} receiverId
 */
export const fetchNotifications = async (receiverId) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        *,
        sender: senderId(id, name, image)
      `)
      .eq("receiverId", receiverId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("❌ fetchNotifications error:", error);
      return { success: false, msg: "שגיאה בשליפת התראות" };
    }

    return { success: true, data };
  } catch (error) {
    console.log("❌ fetchNotifications catch:", error);
    return { success: false, msg: "שגיאה לא צפויה בשליפת התראות" };
  }
};
