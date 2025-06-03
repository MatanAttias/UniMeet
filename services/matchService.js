import { supabase } from '../lib/supabase';

/**
 * Fetch users for matching with improved gender and connection type filtering
 * @param {string} userId – Current user's UUID
 * @returns {Promise<Array>} List of user profiles that match preferences
 */
export const fetchAttributeMatches = async (userId) => {
  try {
    // First, get the current user's preferences
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('gender, connectionTypes')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching current user:', userError);
      return [];
    }

    if (!currentUser.gender || !currentUser.connectionTypes) {
      console.warn('User missing gender or connectionTypes');
      return [];
    }

    // Get ALL existing interactions to exclude (not just reject)
    const { data: allInteractions, error: intErr } = await supabase
      .from('interactions')
      .select('target_id, type')
      .eq('user_id', userId);

    if (intErr) {
      console.error('Error fetching interactions:', intErr);
      return [];
    }

    // Exclude users we already interacted with (any type: like, friend, reject)
    const excludedIds = Array.from(new Set(allInteractions.map(i => i.target_id)));
    
    console.log('🚫 Excluding users with existing interactions:', {
      total: excludedIds.length,
      interactions: allInteractions.map(i => `${i.target_id}: ${i.type}`)
    });

    // Parse current user's connection types (Hebrew format)
    const userWantsDating = currentUser.connectionTypes && currentUser.connectionTypes.includes('דייטים');
    const userWantsFriends = currentUser.connectionTypes && currentUser.connectionTypes.includes('חברויות');
    const userGender = currentUser.gender;

    console.log('🔍 User preferences:', {
      gender: userGender,
      wantsDating: userWantsDating,
      wantsFriends: userWantsFriends,
      connectionTypes: currentUser.connectionTypes
    });

    // Build the filtering logic
    let query = supabase
      .from('users')
      .select('*')
      .neq('id', userId)
      .not('gender', 'is', null)
      .not('connectionTypes', 'is', null);

    // Get all users first, then filter in JavaScript for more control
    const { data: allUsers, error: fetchErr } = await query;
    
    if (fetchErr) {
      console.error('Error fetching users:', fetchErr);
      return [];
    }

    // Filter out rejected users and apply matching logic
    const filteredUsers = allUsers
      .filter(user => !excludedIds.includes(user.id)) // Exclude rejected
      .filter(targetUser => {
      const targetGender = targetUser.gender;
      const targetWantsDating = targetUser.connectionTypes && targetUser.connectionTypes.includes('דייטים');
      const targetWantsFriends = targetUser.connectionTypes && targetUser.connectionTypes.includes('חברויות');

      console.log(`👤 Checking ${targetUser.name}:`, {
        gender: targetGender,
        wantsDating: targetWantsDating,
        wantsFriends: targetWantsFriends,
        connectionTypes: targetUser.connectionTypes
      });

      // Check if there's any compatible connection type
      let hasCompatibleConnection = false;

      // DATING COMPATIBILITY
      if (userWantsDating && targetWantsDating) {
        // Both want dating - must be opposite genders (Hebrew format)
        const oppositeGenders = (
          (userGender === 'זכר' && targetGender === 'נקבה') ||
          (userGender === 'נקבה' && targetGender === 'זכר')
        );
        
        if (oppositeGenders) {
          console.log(`💕 Dating compatibility: YES (opposite genders)`);
          hasCompatibleConnection = true;
        } else {
          console.log(`💕 Dating compatibility: NO (same gender)`);
        }
      }

      // FRIENDSHIP COMPATIBILITY  
      if (userWantsFriends && targetWantsFriends) {
        // Both want friends - any gender combination is fine
        console.log(`👫 Friendship compatibility: YES`);
        hasCompatibleConnection = true;
      }

      const result = hasCompatibleConnection;
      console.log(`✅ Final result for ${targetUser.name}: ${result ? 'MATCH' : 'NO MATCH'}`);
      
      return result;
    });

    console.log(`📊 Filtered ${filteredUsers.length} users from ${allUsers.length} total (excluded ${excludedIds.length} with existing interactions)`);
    
    // Limit to 50 users and randomize order for variety
    const shuffledUsers = filteredUsers
      .sort(() => Math.random() - 0.5)
      .slice(0, 50);

    return shuffledUsers;

  } catch (error) {
    console.error('Error in fetchAttributeMatches:', error);
    return [];
  }
};

/**
 * Enhanced function to determine if two users are compatible
 * @param {Object} user1 - First user object with gender and connectionTypes
 * @param {Object} user2 - Second user object with gender and connectionTypes  
 * @returns {Object} - Compatibility result with reasons
 */
export const checkUserCompatibility = (user1, user2) => {
  const user1WantsDating = user1.connectionTypes && user1.connectionTypes.includes('דייטים');
  const user1WantsFriends = user1.connectionTypes && user1.connectionTypes.includes('חברויות');
  const user2WantsDating = user2.connectionTypes && user2.connectionTypes.includes('דייטים');
  const user2WantsFriends = user2.connectionTypes && user2.connectionTypes.includes('חברויות');

  const compatibilityReasons = [];
  let isCompatible = false;

  // Check dating compatibility (Hebrew format)
  if (user1WantsDating && user2WantsDating) {
    const oppositeGenders = (
      (user1.gender === 'זכר' && user2.gender === 'נקבה') ||
      (user1.gender === 'נקבה' && user2.gender === 'זכר')
    );
    
    if (oppositeGenders) {
      compatibilityReasons.push('דייטים');
      isCompatible = true;
    }
  }

  // Check friendship compatibility
  if (user1WantsFriends && user2WantsFriends) {
    compatibilityReasons.push('חברויות');
    isCompatible = true;
  }

  return {
    compatible: isCompatible,
    reasons: compatibilityReasons,
    details: {
      user1WantsDating,
      user1WantsFriends,
      user2WantsDating, 
      user2WantsFriends,
      genders: [user1.gender, user2.gender]
    }
  };
};

export const likeUser = async (userId, targetId) => {
  console.log('🔄 Starting likeUser process:', { userId, targetId });
  
  // 1. Check if any interaction already exists
  console.log('🔍 Checking for existing interactions...');
  const { data: existingInteraction, error: checkError } = await supabase
    .from('interactions')
    .select('id, type')
    .eq('user_id', userId)
    .eq('target_id', targetId)
    .single();

  let interactionId;
  
  if (checkError && checkError.code === 'PGRST116') {
    // No existing interaction, create new like
    console.log('📝 Creating new like interaction...');
    const { data: likeRow, error: likeError } = await supabase
      .from('interactions')
      .insert({ user_id: userId, target_id: targetId, type: 'like' })
      .select('id')
      .single();
    
    if (likeError) {
      console.error('❌ likeUser error:', likeError);
      return { matched: false };
    }
    console.log('✅ Like interaction created:', likeRow);
    interactionId = likeRow.id;
  } else if (checkError) {
    console.error('❌ Error checking existing interaction:', checkError);
    return { matched: false };
  } else {
    // Interaction already exists
    console.log(`📝 Existing interaction found: ${existingInteraction.type}`);
    
    if (existingInteraction.type === 'like') {
      console.log('💕 Like already exists, using existing interaction');
      interactionId = existingInteraction.id;
    } else if (existingInteraction.type === 'friend') {
      // Upgrade friend to like
      console.log('👫➡️💕 Upgrading friend interaction to like...');
      const { data: updatedInteraction, error: updateError } = await supabase
        .from('interactions')
        .update({ type: 'like' })
        .eq('id', existingInteraction.id)
        .select('id')
        .single();
      
      if (updateError) {
        console.error('❌ Error upgrading to like:', updateError);
        return { matched: false };
      }
      console.log('✅ Friend upgraded to like');
      interactionId = updatedInteraction.id;
    } else if (existingInteraction.type === 'reject') {
      console.log('❌ User was rejected - cannot like');
      return { matched: false };
    }
  }

  // 2. Insert a "like" notification via RPC
  console.log('🔔 Inserting like notification...');
  const { error: likeNotifErr } = await supabase.rpc('insert_notification', {
    params: {
      user_id: targetId,
      actor_id: userId,
      type: 'like',
      interaction_id: interactionId,
    }
  });
  if (likeNotifErr) console.error('❌ Like notification RPC error:', likeNotifErr);
  else console.log('✅ Like notification sent');

  // 3. Check for reciprocal like
  console.log('🔍 Checking for reciprocal like...');
  const { data: reciprocal, error: recErr } = await supabase
    .from('interactions')
    .select('id')
    .eq('user_id', targetId)
    .eq('target_id', userId)
    .eq('type', 'like')
    .limit(1);
  
  if (recErr) {
    console.error('❌ Reciprocal like check error:', recErr);
    return { matched: false };
  }
  console.log('🔍 Reciprocal like result:', reciprocal);

  // 4. If reciprocal, complete the match flow
  if (reciprocal?.length) {
    console.log('🎉 RECIPROCAL LIKE FOUND! Starting match process...');
    const [u1, u2] = [userId, targetId].sort();
    console.log('👥 Sorted user IDs:', { u1, u2 });

    // a) Find or create chat
    console.log('💬 Looking for existing chat...');
    const { data: existingChat, error: findChatErr } = await supabase
      .from('chats')
      .select('id')
      .eq('user1_id', u1)
      .eq('user2_id', u2)
      .single();

    let chat;
    if (findChatErr && findChatErr.code === 'PGRST116') {
      console.log('💬 Creating new chat...');
      const { data: newChat, error: createChatErr } = await supabase
        .from('chats')
        .insert({ user1_id: u1, user2_id: u2 })
        .select('id')
        .single();
      if (createChatErr) console.error('❌ Chat creation error:', createChatErr);
      else chat = newChat;
    } else if (findChatErr) {
      console.error('❌ Chat find error:', findChatErr);
    } else {
      console.log('💬 Found existing chat');
      chat = existingChat;
    }
    console.log('✅ Chat step done:', chat);

    // b) Find or create match record (with correct column names)
    console.log('💕 Looking for existing match...');
    const { data: existingMatch, error: findMatchErr } = await supabase
      .from('matches')
      .select('id')
      .eq('user1', u1)
      .eq('user2', u2)
      .single();

    let match;
    if (findMatchErr && findMatchErr.code === 'PGRST116') {
      console.log('💕 Creating new match record...');
      const { data: newMatch, error: matchErr } = await supabase
        .from('matches')
        .insert({ user1: u1, user2: u2 })
        .select('id')
        .single();
      if (matchErr) console.error('❌ Match creation error:', matchErr);
      else {
        console.log('✅ Match record created:', newMatch);
        match = newMatch;
      }
    } else if (findMatchErr) {
      console.error('❌ Match find error:', findMatchErr);
    } else {
      console.log('💕 Found existing match:', existingMatch);
      match = existingMatch;
    }

    // c) Insert a "match" notification via RPC
    console.log('🔔 Inserting match notification...');
    const { error: matchNotifErr } = await supabase.rpc('insert_notification', {
      params: {
        user_id: targetId,
        actor_id: userId,
        type: 'match',
        interaction_id: reciprocal[0].id,
      }
    });
    if (matchNotifErr) console.error('❌ Match notification RPC error:', matchNotifErr);
    else console.log('✅ Match notification sent');

    console.log('🎉 Match process completed successfully!');
    return { matched: true, chatId: chat?.id };
  }

  console.log('📝 Like registered, but no reciprocal like found yet');
  return { matched: false };
};

export const friendUser = async (userId, targetId) => {
  console.log('😊 Starting friendUser process:', { userId, targetId });
  
  // Check if any interaction already exists
  const { data: existingInteraction, error: checkError } = await supabase
    .from('interactions')
    .select('id, type')
    .eq('user_id', userId)
    .eq('target_id', targetId)
    .single();

  if (checkError && checkError.code === 'PGRST116') {
    // No existing interaction, create new friend interaction
    console.log('📝 Creating new friend interaction...');
    const { error } = await supabase
      .from('interactions')
      .insert({ user_id: userId, target_id: targetId, type: 'friend' });
    if (error) {
      console.error('❌ friendUser error:', error);
      return { success: false };
    }
    console.log('✅ Friend interaction created');
  } else if (checkError) {
    console.error('❌ Error checking existing interaction:', checkError);
    return { success: false };
  } else {
    // Interaction already exists - check what type
    console.log(`📝 Existing interaction found: ${existingInteraction.type}`);
    
    if (existingInteraction.type === 'like') {
      console.log('💕 Like already exists - this should create a match first!');
      // If like exists, we shouldn't be here - the user should already be matched
      // But let's handle it gracefully by checking for existing chat
    } else if (existingInteraction.type === 'reject') {
      console.log('❌ User was rejected - cannot add as friend');
      return { success: false };
    } else if (existingInteraction.type === 'friend') {
      console.log('👫 Friend interaction already exists - checking for existing chat');
    }
  }

  // For friendships, create chat immediately (no need for reciprocal)
  console.log('💬 Looking for existing chat...');
  const [u1, u2] = [userId, targetId].sort();
  
  // Check if chat already exists
  const { data: existingChat, error: findChatErr } = await supabase
    .from('chats')
    .select('id')
    .eq('user1_id', u1)
    .eq('user2_id', u2)
    .single();

  let chatId;
  if (findChatErr && findChatErr.code === 'PGRST116') {
    // Create new chat
    console.log('💬 Creating new friendship chat...');
    const { data: newChat, error: createChatErr } = await supabase
      .from('chats')
      .insert({ user1_id: u1, user2_id: u2 })
      .select('id')
      .single();
    
    if (createChatErr) {
      console.error('❌ Chat creation error:', createChatErr);
      return { success: false };
    }
    
    console.log('✅ Friendship chat created:', newChat);
    chatId = newChat.id;
  } else if (findChatErr) {
    console.error('❌ Chat find error:', findChatErr);
    return { success: false };
  } else {
    console.log('💬 Chat already exists:', existingChat);
    chatId = existingChat.id;
  }

  return { success: true, chatId };
};

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
      user:users!interactions_user_id_fkey (id, name),
      target:users!interactions_target_id_fkey (id, name)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching interactions:', error);
    return [];
  }
  return data;
};