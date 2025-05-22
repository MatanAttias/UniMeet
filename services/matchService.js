// services/matchService.js
import { supabase } from '../lib/supabase';

/**
 * Fetches up to 50 users (excluding the current user) for matching.
 * @param {string|number} userId - Current user ID
 * @returns {Promise<Array>} List of user profiles
 */
export const fetchAttributeMatches = async (userId) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .neq('id', userId)
    .limit(50);

  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
  return users;
};

/**
 * Register a “like” and, if reciprocal, upsert a chat record.
 * @param {string} userId
 * @param {string} targetId
 * @returns {Promise<{ matched: boolean, chatId?: number }>}
 */
export const likeUser = async (userId, targetId) => {
  // 1. Upsert the like interaction (avoids duplicate-key errors)
  const { error: likeError } = await supabase
    .from('interactions')
    .upsert(
      { user_id: userId, target_id: targetId, type: 'like' },
      { onConflict: ['user_id', 'target_id', 'type'] }
    );
  if (likeError) {
    console.error('likeUser error:', likeError);
    return { matched: false };
  }

  // 2. Check for reciprocal like
  const { data: reciprocal, error: recError } = await supabase
    .from('interactions')
    .select('id')
    .eq('user_id', targetId)
    .eq('target_id', userId)
    .eq('type', 'like')
    .limit(1);

  if (recError) {
    console.error('reciprocal like check error:', recError);
    return { matched: false };
  }

  // 3. If reciprocal, upsert into chats
  if (reciprocal && reciprocal.length) {
    // ensure consistent ordering for uniqueness
    const [u1, u2] = [userId, targetId].sort();
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .upsert(
        { user1_id: u1, user2_id: u2 },
        { onConflict: ['user1_id', 'user2_id'] }
      )
      .select('id')
      .single();

    if (chatError) {
      console.error('chats upsert error:', chatError);
      return { matched: true };
    }

    return { matched: true, chatId: chat.id };
  }

  return { matched: false };
};

/**
 * Register a “friend” (friendly) interaction.
 * @param {string} userId
 * @param {string} targetId
 */
export const friendUser = async (userId, targetId) => {
  const { error } = await supabase
    .from('interactions')
    .upsert(
      { user_id: userId, target_id: targetId, type: 'friend' },
      { onConflict: ['user_id', 'target_id', 'type'] }
    );
  if (error) console.error('friendUser error:', error);
};

/**
 * Register a “reject” interaction and advance to next match.
 * @param {string} userId
 * @param {string} targetId
 */
export const rejectUser = async (userId, targetId) => {
  const { error } = await supabase
    .from('interactions')
    .upsert(
      { user_id: userId, target_id: targetId, type: 'reject' },
      { onConflict: ['user_id', 'target_id', 'type'] }
    );
  if (error) console.error('rejectUser error:', error);
};

export const fetchMyInteractions = async (userId) => {
  const { data, error } = await supabase
    .from('interactions')
    .select(`
      id,
      type,
      created_at,
      user:users!user_id ( id, name ),
      target:users!target_id ( id, name )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching interactions with names:', error);
    return [];
  }
  return data;
};