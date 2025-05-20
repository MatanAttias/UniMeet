import { supabase } from '../lib/supabase';
import moment from 'moment';

/**
 * Fetches matches based on overlapping connectionTypes, preferred gender, location, and user-specified age range.
 * @param {string|number} userId - Current user ID
 * @param {number|null} minAge - Minimum age inclusive
 * @param {number|null} maxAge - Maximum age inclusive
 * @returns {{ success: boolean, data?: Array, msg?: string }}
 */
export const fetchAttributeMatches = async (userId, minAge = null, maxAge = null) => {
  try {
    // 1. Load current user's profile
    const { data: me, error: errMe } = await supabase
      .from('users')
      .select('id, birth_date, gender, connectionTypes, location, preferredMatch')
      .eq('id', userId)
      .single();
    console.log('🛠️ Debug fetchAttributeMatches - me:', me, 'errMe:', errMe);
    if (errMe || !me) {
      console.error('Error fetching user profile:', errMe);
      return { success: false, msg: 'Failed to load user profile' };
    }

    // 2. Calculate current user's age
    const calcAge = (dateStr) => moment().diff(moment(dateStr), 'years');
    const myAge = me.birth_date ? calcAge(me.birth_date) : null;

    // 3. Derive birth_date range from user-specified age bounds
    const today = moment();
    let minBirth = null;
    let maxBirth = null;
    if (maxAge != null) {
      minBirth = today.clone().subtract(maxAge, 'years').format('YYYY-MM-DD');
    }
    if (minAge != null) {
      maxBirth = today.clone().subtract(minAge, 'years').format('YYYY-MM-DD');
    }
    console.log('🛠️ Debug birth_date range:', { minBirth, maxBirth });

    // 4. Build Supabase query with filters
    let query = supabase
      .from('users')
      .select('id, name, image, birth_date, gender, connectionTypes, location')
      .neq('id', userId);

    // NOTE: temporarily disable location filter for debugging
    // if (me.location) {
    //   query = query.eq('location', me.location);
    // }
    if (minBirth && maxBirth) {
      query = query.gte('birth_date', minBirth).lte('birth_date', maxBirth);
    } else if (minBirth) {
      query = query.gte('birth_date', minBirth);
    } else if (maxBirth) {
      query = query.lte('birth_date', maxBirth);
    }
    if (me.connectionTypes?.length) {
      query = query.overlaps('connectionTypes', me.connectionTypes);
    }
    if (me.preferredMatch) {
      if (Array.isArray(me.preferredMatch)) {
        query = query.in('gender', me.preferredMatch);
      } else {
        query = query.eq('gender', me.preferredMatch);
      }
    }
    console.log('🛠️ Debug query filters:', { connectionTypes: me.connectionTypes, preferredMatch: me.preferredMatch });

    // 5. Execute query
    const { data: candidates, error } = await query;
    console.log('🛠️ Debug candidates:', candidates, 'error:', error);

    if (error) {
      console.error('Error fetching candidates:', error);
      return { success: false, msg: 'Failed to load candidates' };
    }

    // 6. Map to lightweight DTOs
    const result = (candidates || []).map((u) => {
      const connections = (me.connectionTypes || []).filter((ct) =>
        u.connectionTypes?.includes(ct)
      );
      return {
        id: u.id,
        name: u.name,
        image: u.image,
        age: u.birth_date ? calcAge(u.birth_date) : null,
        commonConnections: connections,
        commonConnectionsCount: connections.length,
        location: u.location,
      };
    });
    console.log('🛠️ Debug result DTOs:', result);

    return { success: true, data: result };
  } catch (err) {
    console.error('Unexpected error in fetchAttributeMatches:', err);
    return { success: false, msg: 'Unexpected error fetching matches' };
  }
};
