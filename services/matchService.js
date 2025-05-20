import { supabase } from '../lib/supabase';

/**
 * Temporary fetchAttributeMatches for debugging purposes: no filters.
 * Fetches up to 50 users excluding the current user.
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