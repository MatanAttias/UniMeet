import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../constants';
import { supabase } from '../lib/supabase'; 

console.log("🔍 Supabase inside userService:", supabase);

export const getUserData = async (userId) => {
    console.log("🔍 Fetching user data for:", userId);
    if (!supabase) {
        console.error("❌ Supabase is undefined in getUserData");
        return { success: false, msg: "Supabase not initialized" };
    }

    try {
        const { data, error } = await supabase
            .from("users")
            .select()
            .eq("id", userId)
            .single();

        if (error) {
            return { success: false, msg: error.message };
        }
        return { success: true, data };
    } catch (error) {
        console.log("❌ Error in getUserData:", error);
        return { success: false, msg: error.message };
    }
};

export const updateUser = async (userId, data) => {
    console.log("🔍 Using Supabase inside updateUser:", supabase);

    if (!supabase) {
        console.error("❌ Supabase is undefined inside updateUser!");
        return { success: false, msg: "Supabase not initialized" };
    }

    try {
        const { error } = await supabase
            .from("users")
            .update(data)
            .eq("id", userId);

        if (error) {
            console.log("❌ Update Error:", error);
            return { success: false, msg: error?.message };
        }
        return { success: true, data };
    } catch (error) {
        console.log("❌ Catch Error in updateUser:", error);
        return { success: false, msg: error.message };
    }
};
