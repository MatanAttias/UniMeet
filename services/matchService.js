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
 * Check for mismatch between two users' interaction preferences
 * @param {string} userAType - Type of interaction from user A ('like' or 'friend')
 * @param {string} userBType - Type of interaction from user B ('like' or 'friend')
 * @returns {Object} - Mismatch info
 */
const checkInteractionMismatch = (userAType, userBType) => {
  if (userAType === userBType) {
    return { hasMismatch: false, matchType: userAType };
  }
  
  // One wants dating (like), one wants friendship (friend)
  return {
    hasMismatch: true,
    likeUser: userAType === 'like' ? 'A' : 'B',
    friendUser: userAType === 'friend' ? 'A' : 'B'
  };
};

/**
 * Create a chat request notification for mismatched interactions
 * @param {string} userId - User receiving the notification
 * @param {string} actorId - User who triggered the notification
 * @param {string} userType - 'like' or 'friend' - what the receiving user wants
 * @param {string} actorType - 'like' or 'friend' - what the actor wants
 */
const createChatRequestNotification = async (userId, actorId, userType, actorType) => {
  try {
    const { error } = await supabase
      .from('match_notifications')
      .insert({
        user_id: userId,
        actor_id: actorId,
        type: 'chat_request',
        read: false,
        metadata: {
          user_preference: userType,
          actor_preference: actorType,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      });
    
    if (error) {
      console.error('❌ Error creating chat request notification:', error);
    } else {
      console.log('✅ Chat request notification created');
    }
  } catch (error) {
    console.error('❌ Error in createChatRequestNotification:', error);
  }
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

  // 2. Check for reciprocal interaction (like or friend)
  console.log('🔍 Checking for reciprocal interaction...');
  const { data: reciprocalInteraction, error: recErr } = await supabase
    .from('interactions')
    .select('id, type')
    .eq('user_id', targetId)
    .eq('target_id', userId)
    .in('type', ['like', 'friend'])
    .single();
  
  if (recErr && recErr.code !== 'PGRST116') {
    console.error('❌ Reciprocal interaction check error:', recErr);
    return { matched: false };
  }

  if (reciprocalInteraction) {
    console.log(`🔍 Found reciprocal interaction: ${reciprocalInteraction.type}`);
    
    // Check for mismatch
    const mismatchInfo = checkInteractionMismatch('like', reciprocalInteraction.type);
    
    if (mismatchInfo.hasMismatch) {
      console.log('⚠️ MISMATCH DETECTED: like vs friend');
      
      // Create chat request notifications for both users
      await createChatRequestNotification(userId, targetId, 'like', 'friend');
      await createChatRequestNotification(targetId, userId, 'friend', 'like');
      
      return { 
        matched: false, 
        mismatch: true,
        message: 'נוצרה בקשת צ\'אט בגלל העדפות שונות'
      };
    } else {
      // Perfect match - both like
      console.log('🎉 PERFECT MATCH! Both users want dating');
      return await createMatch(userId, targetId, interactionId, reciprocalInteraction.id);
    }
  } else {
    console.log('📝 Like registered, no reciprocal interaction found yet');
    
    // Send like notification
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
    
    return { matched: false };
  }
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
    // Interaction already exists
    console.log(`📝 Existing interaction found: ${existingInteraction.type}`);
    
    if (existingInteraction.type === 'reject') {
      console.log('❌ User was rejected - cannot add as friend');
      return { success: false };
    } else if (existingInteraction.type === 'friend') {
      console.log('👫 Friend interaction already exists');
    } else if (existingInteraction.type === 'like') {
      console.log('💕 Like exists - this will be handled by match logic');
    }
  }

  // Check for reciprocal interaction
  console.log('🔍 Checking for reciprocal interaction...');
  const { data: reciprocalInteraction, error: recErr } = await supabase
    .from('interactions')
    .select('id, type')
    .eq('user_id', targetId)
    .eq('target_id', userId)
    .in('type', ['like', 'friend'])
    .single();
  
  if (recErr && recErr.code !== 'PGRST116') {
    console.error('❌ Reciprocal interaction check error:', recErr);
    return { success: false };
  }

  if (reciprocalInteraction) {
    console.log(`🔍 Found reciprocal interaction: ${reciprocalInteraction.type}`);
    
    // Check for mismatch
    const mismatchInfo = checkInteractionMismatch('friend', reciprocalInteraction.type);
    
    if (mismatchInfo.hasMismatch) {
      console.log('⚠️ MISMATCH DETECTED: friend vs like');
      
      // Create chat request notifications for both users
      await createChatRequestNotification(userId, targetId, 'friend', 'like');
      await createChatRequestNotification(targetId, userId, 'like', 'friend');
      
      return { 
        success: false, 
        mismatch: true,
        message: 'נוצרה בקשת צ\'אט בגלל העדפות שונות'
      };
    } else {
      // Perfect match - both friend
      console.log('👫 FRIENDSHIP MATCH! Creating chat immediately');
      return await createFriendshipChat(userId, targetId);
    }
  } else {
    // No reciprocal, create chat immediately for friendship
    console.log('👫 Creating friendship chat immediately');
    return await createFriendshipChat(userId, targetId);
  }
};

/**
 * Create a romantic match with all the bells and whistles
 */
const createMatch = async (userId, targetId, userInteractionId, targetInteractionId) => {
  const [u1, u2] = [userId, targetId].sort();
  
  // Create chat
  console.log('💬 Creating match chat...');
  const { data: chat, error: chatErr } = await supabase
    .from('chats')
    .upsert({ user1_id: u1, user2_id: u2 }, { onConflict: 'user1_id,user2_id' })
    .select('id')
    .single();
  
  if (chatErr) {
    console.error('❌ Chat creation error:', chatErr);
    return { matched: false };
  }
  
  // Create match record
  console.log('💕 Creating match record...');
  const { error: matchErr } = await supabase
    .from('matches')
    .upsert({ user1: u1, user2: u2 }, { onConflict: 'user1,user2' });
  
  if (matchErr) console.error('❌ Match creation error:', matchErr);
  
  // Send match notifications
  const { error: matchNotifErr } = await supabase.rpc('insert_notification', {
    params: {
      user_id: targetId,
      actor_id: userId,
      type: 'match',
      interaction_id: targetInteractionId,
    }
  });
  if (matchNotifErr) console.error('❌ Match notification error:', matchNotifErr);
  
  console.log('🎉 Match created successfully!');
  return { matched: true, chatId: chat.id };
};

/**
 * Create a friendship chat
 */
const createFriendshipChat = async (userId, targetId) => {
  const [u1, u2] = [userId, targetId].sort();
  
  console.log('💬 Creating friendship chat...');
  const { data: chat, error: chatErr } = await supabase
    .from('chats')
    .upsert({ user1_id: u1, user2_id: u2 }, { onConflict: 'user1_id,user2_id' })
    .select('id')
    .single();
  
  if (chatErr) {
    console.error('❌ Friendship chat creation error:', chatErr);
    return { success: false };
  }
  
  console.log('✅ Friendship chat created successfully!');
  return { success: true, chatId: chat.id };
};

/**
 * Fetch all likes, chat requests, matches and active chats for the likes screen
 * @param {string} userId - Current user's UUID
 * @returns {Promise<Object>} Object with categorized data
 */
export const fetchLikesAndRequests = async (userId) => {
  try {
    console.log('🔍 Fetching likes and requests for user:', userId);
    
    // 1. Get users who liked me (and I haven't responded yet)
    const { data: likedYou, error: likedError } = await supabase
      .from('interactions')
      .select(`
        id,
        created_at,
        user:users!interactions_user_id_fkey (
          id, name, image, birth_date
        )
      `)
      .eq('target_id', userId)
      .eq('type', 'like')
      .order('created_at', { ascending: false });

    if (likedError) {
      console.error('❌ Error fetching liked you:', likedError);
    }

    // Filter out users I already responded to
    const { data: myInteractions, error: myIntError } = await supabase
      .from('interactions')
      .select('target_id')
      .eq('user_id', userId);

    const myTargets = new Set(myInteractions?.map(i => i.target_id) || []);
    const filteredLikedYou = likedYou?.filter(like => !myTargets.has(like.user.id)) || [];

    // 2. Get chat requests (from match_notifications with type 'chat_request')
    const { data: chatRequests, error: requestError } = await supabase
      .from('match_notifications')
      .select(`
        id,
        created_at,
        type,
        metadata,
        actor:users!match_notifications_actor_id_fkey (
          id, name, image, birth_date
        )
      `)
      .eq('user_id', userId)
      .eq('type', 'chat_request')
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (requestError) {
      console.error('❌ Error fetching chat requests:', requestError);
    }

    // 3. Get matches (users I have mutual likes with)
    const { data: matches, error: matchError } = await supabase
      .from('matches')
      .select(`
        id,
        created_at,
        user1,
        user2
      `)
      .or(`user1.eq.${userId},user2.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (matchError) {
      console.error('❌ Error fetching matches:', matchError);
    }

    // Get user details for matches and find corresponding chats
    const matchesWithDetails = [];
    if (matches) {
      for (const match of matches) {
        const otherUserId = match.user1 === userId ? match.user2 : match.user1;
        
        // Get other user details
        const { data: otherUser, error: userErr } = await supabase
          .from('users')
          .select('id, name, image, birth_date')
          .eq('id', otherUserId)
          .single();

        if (!userErr && otherUser) {
          // Find corresponding chat
          const [u1, u2] = [userId, otherUserId].sort();
          const { data: chat, error: chatErr } = await supabase
            .from('chats')
            .select('id')
            .eq('user1_id', u1)
            .eq('user2_id', u2)
            .single();

          matchesWithDetails.push({
            id: match.id,
            user: otherUser,
            chatId: chat?.id || null,
            created_at: match.created_at
          });
        }
      }
    }

    // 4. Get active chats
    const { data: activeChats, error: chatError } = await supabase
      .from('chats')
      .select(`
        id,
        created_at,
        last_message,
        updated_at,
        user1_id,
        user2_id
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (chatError) {
      console.error('❌ Error fetching active chats:', chatError);
    }

    // Get user details for active chats
    const chatsWithDetails = [];
    if (activeChats) {
      for (const chat of activeChats) {
        const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
        
        const { data: otherUser, error: userErr } = await supabase
          .from('users')
          .select('id, name, image, birth_date')
          .eq('id', otherUserId)
          .single();

        if (!userErr && otherUser) {
          chatsWithDetails.push({
            id: chat.id,
            user: otherUser,
            last_message: chat.last_message,
            updated_at: chat.updated_at,
            created_at: chat.created_at
          });
        }
      }
    }

    const result = {
      liked_you: filteredLikedYou || [],
      chat_requests: chatRequests || [],
      matches: matchesWithDetails || [],
      active_chats: chatsWithDetails || []
    };

    console.log('📊 Likes data summary:', {
      liked_you: result.liked_you.length,
      chat_requests: result.chat_requests.length,
      matches: result.matches.length,
      active_chats: result.active_chats.length
    });

    return result;

  } catch (error) {
    console.error('❌ Error in fetchLikesAndRequests:', error);
    return {
      liked_you: [],
      chat_requests: [],
      matches: [],
      active_chats: []
    };
  }
};

/**
 * Like a user back (from the likes screen)
 */
export const likeUserBack = async (userId, targetId) => {
  console.log('💕 Liking user back:', { userId, targetId });
  
  try {
    // Create like interaction
    const { data: likeRow, error: likeError } = await supabase
      .from('interactions')
      .insert({ user_id: userId, target_id: targetId, type: 'like' })
      .select('id')
      .single();
    
    if (likeError) {
      console.error('❌ Error creating like back:', likeError);
      return { matched: false };
    }

    // Since we know the other user already liked us, this should be a match
    const [u1, u2] = [userId, targetId].sort();
    
    // Create chat
    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .upsert({ user1_id: u1, user2_id: u2 }, { onConflict: 'user1_id,user2_id' })
      .select('id')
      .single();
    
    if (chatErr) {
      console.error('❌ Chat creation error:', chatErr);
      return { matched: false };
    }
    
    // Create match record
    const { error: matchErr } = await supabase
      .from('matches')
      .upsert({ user1: u1, user2: u2 }, { onConflict: 'user1,user2' });
    
    if (matchErr) console.error('❌ Match creation error:', matchErr);
    
    console.log('🎉 Match created successfully!');
    return { matched: true, chatId: chat.id };

  } catch (error) {
    console.error('❌ Error in likeUserBack:', error);
    return { matched: false };
  }
};

/**
 * Handle response to chat request (approve/reject)
 * @param {string} userId - User responding
 * @param {string} actorId - Original actor
 * @param {boolean} approved - Whether user approved the chat request
 */
export const respondToChatRequest = async (userId, actorId, approved) => {
  console.log('📋 Responding to chat request:', { userId, actorId, approved });
  
  try {
    // Find the notification
    const { data: notification, error: findError } = await supabase
      .from('match_notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('actor_id', actorId)
      .eq('type', 'chat_request')
      .single();

    if (findError) {
      console.error('❌ Error finding notification:', findError);
      return { success: false };
    }

    if (!approved) {
      // Mark as read and rejected
      const { error: updateError } = await supabase
        .from('match_notifications')
        .update({ 
          read: true,
          metadata: { 
            ...notification.metadata, 
            status: 'rejected',
            rejected_at: new Date().toISOString()
          }
        })
        .eq('id', notification.id);

      if (updateError) {
        console.error('❌ Error updating rejection:', updateError);
      }

      console.log('❌ Chat request declined');
      return { success: true, chatCreated: false };
    }

    // User approved - mark as approved
    const { error: approveError } = await supabase
      .from('match_notifications')
      .update({ 
        read: true,
        metadata: { 
          ...notification.metadata, 
          status: 'approved',
          approved_at: new Date().toISOString()
        }
      })
      .eq('id', notification.id);

    if (approveError) {
      console.error('❌ Error updating approval:', approveError);
      return { success: false };
    }

    // Check if the other user also approved
    const { data: otherNotification, error: otherError } = await supabase
      .from('match_notifications')
      .select('*')
      .eq('user_id', actorId)
      .eq('actor_id', userId)
      .eq('type', 'chat_request')
      .single();

    if (otherError && otherError.code !== 'PGRST116') {
      console.error('❌ Error checking other user response:', otherError);
      return { success: false };
    }

    // Check if both users approved
    const otherApproved = otherNotification?.metadata?.status === 'approved';
    
    if (otherApproved) {
      console.log('🎉 Both users approved! Creating chat...');
      
      // Create the chat
      const [u1, u2] = [userId, actorId].sort();
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .upsert({ user1_id: u1, user2_id: u2 }, { onConflict: 'user1_id,user2_id' })
        .select('id')
        .single();
      
      if (chatError) {
        console.error('❌ Chat creation error:', chatError);
        return { success: false };
      }

      console.log('✅ Chat created successfully!');
      return { 
        success: true, 
        chatCreated: true, 
        chatId: chat.id 
      };
    } else {
      console.log('⏳ Waiting for other user to respond...');
      return { 
        success: true, 
        chatCreated: false, 
        message: 'התגובה נשמרה, מחכים לתגובת המשתמש השני' 
      };
    }

  } catch (error) {
    console.error('❌ Error in respondToChatRequest:', error);
    return { success: false };
  }
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