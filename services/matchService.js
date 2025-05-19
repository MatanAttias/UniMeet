import { supabase } from '../lib/supabase';
import moment from 'moment';

/**
 * Fetches all matches for a given user based on profile attributes:
 * - overlapping connectionTypes
 * - matching preferredMatch gender
 * - same location
 * - age difference within threshold
 * Returns an array of { id, name, image, age, commonConnections, location }.
 */
export const fetchAttributeMatches = async (userId) => {
  try {
    // 1. Get current user's profile
    console.log('🔍 fetchAttributeMatches for userId:', userId);
    const { data: me, error: errMe } = await supabase
      .from('users')
      .select('id, birth_date, gender, connectionTypes, location, preferredMatch')
      .eq('id', userId)
      .single();
    if (errMe || !me) {
      console.error('❌ Error fetching current user:', errMe);
      return { success: false, msg: 'Failed to load user profile' };
    }
    console.log('👤 Current user profile:', me);

    // Helper to calculate age from birth_date
    const calcAge = (dateStr) => {
      const birth = moment(dateStr);
      return moment().diff(birth, 'years');
    };
    const myAge = me.birth_date ? calcAge(me.birth_date) : null;
    console.log('🎂 My age:', myAge);

    // 2. Fetch all other users
    const { data: others, error: errOthers } = await supabase
      .from('users')
      .select('id, name, image, birth_date, gender, connectionTypes, location')
      .neq('id', userId);
    if (errOthers) {
      console.error('❌ Error fetching candidates:', errOthers);
      return { success: false, msg: 'Failed to load candidates' };
    }
    console.log('👥 Candidates count:', others.length);

    // 3. Filter candidates
    const AGE_THRESHOLD = 5;
    const matches = others.filter((u) => {
      console.log(`
--- Checking candidate ${u.id} (${u.name}) ---`);
      // a) connectionTypes overlap
      const overlap = me.connectionTypes?.some((ct) => u.connectionTypes?.includes(ct));
      console.log('▶️ connectionTypes overlap:', overlap);
      if (!overlap) return false;

      // b) gender matches preferredMatch
      if (me.preferredMatch) {
        if (Array.isArray(me.preferredMatch)) {
          const genderOk = me.preferredMatch.includes(u.gender);
          console.log('▶️ gender match (array)?', genderOk);
          if (!genderOk) return false;
        } else {
          const genderOk = u.gender === me.preferredMatch;
          console.log('▶️ gender match (single)?', genderOk);
          if (!genderOk) return false;
        }
      }

      // c) same location
      const locationOk = me.location && u.location && me.location === u.location;
      console.log('▶️ location match:', locationOk);
      if (!locationOk) return false;

      // d) age difference
      if (myAge != null && u.birth_date) {
        const otherAge = calcAge(u.birth_date);
        const ageDiff = Math.abs(myAge - otherAge);
        console.log('▶️ age difference:', ageDiff);
        if (ageDiff > AGE_THRESHOLD) return false;
      }

      return true;
    });
    console.log('✅ Matches found:', matches.length);

    // 4. Map to lighter objects
    const result = matches.map((u) => ({
      id: u.id,
      name: u.name,
      image: u.image,
      age: u.birth_date ? calcAge(u.birth_date) : null,
      commonConnections: me.connectionTypes.filter((ct) => u.connectionTypes.includes(ct)),
      location: u.location,
    }));
    console.log('📦 Result payload:', result);

    return { success: true, data: result };
  } catch (err) {
    console.error('❗ fetchAttributeMatches catch error:', err);
    return { success: false, msg: 'Unexpected error fetching matches' };
  }
};
