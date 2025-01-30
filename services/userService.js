import User from "../assets/icons/User";
import { supabase } from "../lib/supabase";

export const getUserData = async (userId) =>{

    try{
        const { data, error } = await supabase
        .from('user')
        .select()
        .eq('id', userId)
        .single()
        
        if(error){
            return {success: false, msg: error?.message};
        }
        return{success: true, data};

    }catch(error){
        console.log('got error: ', error);
        return {success: false, msg: error.message};
    }
}

export const updateUser = async (userId, data) =>{

    try{
        const { error } = await supabase
        .from('user')
        .update(data) 
        .eq('id', userId);
 
        if(error){
            return {success: false, msg: error?.message};
        }
        return{success: true, data};

    }catch(error){
        console.log('got error: ', error);
        return {success: false, msg: error.message};
    }
}