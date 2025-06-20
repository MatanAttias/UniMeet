import { supabase } from '../lib/supabase';

export const fetchUserChats = async (userId) => {
  const { data, error } = await supabase
    .from('chats')
    .select(`
      id,
      user1_id,
      user2_id,
      user1_read,
      user2_read,
      last_message,
      updated_at,
      user1:user1_id (id, name, image),
      user2:user2_id (id, name, image)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return data.map((chat) => {
    const isUser1 = chat.user1_id === userId;
    const otherUser = isUser1 ? chat.user2 : chat.user1;
  
    return {
      id: chat.id,
      name: otherUser.name,
      image: otherUser.image,
      lastMessage: chat.last_message,
      user1_id: chat.user1_id,
      user2_id: chat.user2_id,
      user1_read: chat.user1_read,
      user2_read: chat.user2_read,
      time: new Date(chat.updated_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  });
};