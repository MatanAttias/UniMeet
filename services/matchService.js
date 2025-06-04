import { supabase } from '../lib/supabase';

/**
 * Fetch users for matching with improved gender and connection type filtering
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

    // Get ALL existing interactions to exclude
    const { data: allInteractions, error: intErr } = await supabase
      .from('interactions')
      .select('target_id, type')
      .eq('user_id', userId);

    if (intErr) {
      console.error('Error fetching interactions:', intErr);
      return [];
    }

    const excludedIds = Array.from(new Set(allInteractions.map(i => i.target_id)));
    
    console.log('🚫 Excluding users with existing interactions:', {
      total: excludedIds.length,
      interactions: allInteractions.map(i => `${i.target_id}: ${i.type}`)
    });

    // Parse current user's connection types
    const userWantsDating = currentUser.connectionTypes && currentUser.connectionTypes.includes('דייטים');
    const userWantsFriends = currentUser.connectionTypes && currentUser.connectionTypes.includes('חברויות');
    const userGender = currentUser.gender;

    console.log('🔍 User preferences:', {
      gender: userGender,
      wantsDating: userWantsDating,
      wantsFriends: userWantsFriends,
      connectionTypes: currentUser.connectionTypes
    });

    // Get all users first, then filter in JavaScript
    const { data: allUsers, error: fetchErr } = await supabase
      .from('users')
      .select('*')
      .neq('id', userId)
      .not('gender', 'is', null)
      .not('connectionTypes', 'is', null);
    
    if (fetchErr) {
      console.error('Error fetching users:', fetchErr);
      return [];
    }

    // Apply matching logic
    const filteredUsers = allUsers
      .filter(user => !excludedIds.includes(user.id))
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

        let hasCompatibleConnection = false;

        // DATING COMPATIBILITY
        if (userWantsDating && targetWantsDating) {
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
          console.log(`👫 Friendship compatibility: YES`);
          hasCompatibleConnection = true;
        }

        const result = hasCompatibleConnection;
        console.log(`✅ Final result for ${targetUser.name}: ${result ? 'MATCH' : 'NO MATCH'}`);
        
        return result;
      });

    console.log(`📊 Filtered ${filteredUsers.length} users from ${allUsers.length} total (excluded ${excludedIds.length} with existing interactions)`);
    
    // Limit to 50 users and randomize order
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
 * Check for mismatch between interaction types
 */
const checkInteractionMismatch = (userAType, userBType) => {
  if (userAType === userBType) {
    return { hasMismatch: false, matchType: userAType };
  }
  
  return {
    hasMismatch: true,
    likeUser: userAType === 'like' ? 'A' : 'B',
    friendUser: userAType === 'friend' ? 'A' : 'B'
  };
};

/**
 * Create a chat request notification for mismatched interactions
 * ✅ עכשיו יעבוד עם constraint מעודכן
 */
const createChatRequestNotification = async (userId, actorId, userType, actorType) => {
  try {
    const { error } = await supabase
      .from('match_notifications')
      .insert({
        user_id: userId,
        actor_id: actorId,
        type: 'chat_request', // ✅ עכשיו מותר בconstraint
        interaction_id: null,
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
  
  // Check if interaction already exists
  const { data: existingInteraction, error: checkError } = await supabase
    .from('interactions')
    .select('id, type')
    .eq('user_id', userId)
    .eq('target_id', targetId)
    .single();

  let interactionId;
  
  if (checkError && checkError.code === 'PGRST116') {
    // Create new like interaction
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
    console.log('✅ Like interaction created');
    interactionId = likeRow.id;
  } else if (checkError) {
    console.error('❌ Error checking existing interaction:', checkError);
    return { matched: false };
  } else {
    console.log(`📝 Existing interaction found: ${existingInteraction.type}`);
    
    if (existingInteraction.type === 'like') {
      console.log('💕 Like already exists');
      interactionId = existingInteraction.id;
    } else if (existingInteraction.type === 'friend') {
      // Upgrade friend to like
      console.log('👫➡️💕 Upgrading friend to like...');
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
    return { matched: false };
  }

  if (reciprocalInteraction) {
    console.log(`🔍 Found reciprocal interaction: ${reciprocalInteraction.type}`);
    
    const mismatchInfo = checkInteractionMismatch('like', reciprocalInteraction.type);
    
    if (mismatchInfo.hasMismatch) {
      console.log('⚠️ MISMATCH DETECTED: like vs friend');
      
      // Create notifications for both users
      await createChatRequestNotification(userId, targetId, 'like', 'friend');
      await createChatRequestNotification(targetId, userId, 'friend', 'like');
      
      return { 
        matched: false, 
        mismatch: true,
        message: 'נוצרה בקשת צ\'אט בגלל העדפות שונות'
      };
    } else {
      // Perfect match
      console.log('🎉 PERFECT MATCH! Both users want dating');
      return await createMatch(userId, targetId, interactionId, reciprocalInteraction.id);
    }
  } else {
    console.log('📝 Like registered, no reciprocal interaction found yet');
    
    // Send like notification
    const { error: likeNotifErr } = await supabase
      .from('notifications')
      .insert({
        receiverId: targetId,
        senderId: userId,
        title: 'מישהו עשה לך לייק!',
        data: JSON.stringify({
          type: 'like',
          interaction_id: interactionId
        })
      });
      
    if (likeNotifErr) console.error('❌ Like notification error:', likeNotifErr);
    else console.log('✅ Like notification sent');
    
    return { matched: false };
  }
};

export const friendUser = async (userId, targetId) => {
  console.log('😊 Starting friendUser process:', { userId, targetId });
  
  // Check if interaction already exists
  const { data: existingInteraction, error: checkError } = await supabase
    .from('interactions')
    .select('id, type')
    .eq('user_id', userId)
    .eq('target_id', targetId)
    .single();

  if (checkError && checkError.code === 'PGRST116') {
    // Create new friend interaction
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
    console.log(`📝 Existing interaction found: ${existingInteraction.type}`);
    
    if (existingInteraction.type === 'reject') {
      console.log('❌ User was rejected - cannot add as friend');
      return { success: false };
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
    
    const mismatchInfo = checkInteractionMismatch('friend', reciprocalInteraction.type);
    
    if (mismatchInfo.hasMismatch) {
      console.log('⚠️ MISMATCH DETECTED: friend vs like');
      
      // Create notifications for both users
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
    // No reciprocal for friendship - create chat immediately
    console.log('👫 Creating friendship chat immediately');
    return await createFriendshipChat(userId, targetId);
  }
};

/**
 * Create a romantic match
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
  
  // Send match notification
  const { error: matchNotifErr } = await supabase
    .from('match_notifications')
    .insert({
      user_id: targetId,
      actor_id: userId,
      type: 'match',
      interaction_id: targetInteractionId,
      read: false,
      metadata: {
        chat_id: chat.id,
        match_type: 'romantic'
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
  
  // Send friendship match notification
  const { error: friendNotifErr } = await supabase
    .from('match_notifications')
    .insert({
      user_id: targetId,
      actor_id: userId,
      type: 'friend',
      interaction_id: null,
      read: false,
      metadata: {
        chat_id: chat.id,
        match_type: 'friendship'
      }
    });
    
  if (friendNotifErr) console.error('❌ Friend notification error:', friendNotifErr);
  
  console.log('✅ Friendship chat created successfully!');
  return { success: true, chatId: chat.id };
};

/**
 * Fetch likes and requests data
 */
export const fetchLikesAndRequests = async (userId) => {
  try {
    console.log('🔍 Fetching likes and requests for user:', userId);
    
    // Get users who liked me
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

    // Get chat requests from match_notifications
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
      .eq('type', 'chat_request') // ✅ עכשיו מותר
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (requestError) {
      console.error('❌ Error fetching chat requests:', requestError);
    }

    // Get matches
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

    // Get user details for matches
    const matchesWithDetails = [];
    if (matches) {
      for (const match of matches) {
        const otherUserId = match.user1 === userId ? match.user2 : match.user1;
        
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

    // Get active chats
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

export const likeUserBack = async (userId, targetId) => {
  console.log('💕 Liking user back:', { userId, targetId });
  
  try {
    const { data: likeRow, error: likeError } = await supabase
      .from('interactions')
      .insert({ user_id: userId, target_id: targetId, type: 'like' })
      .select('id')
      .single();
    
    if (likeError) {
      console.error('❌ Error creating like back:', likeError);
      return { matched: false };
    }

    // Create match since we know other user liked us
    const [u1, u2] = [userId, targetId].sort();
    
    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .upsert({ user1_id: u1, user2_id: u2 }, { onConflict: 'user1_id,user2_id' })
      .select('id')
      .single();
    
    if (chatErr) {
      console.error('❌ Chat creation error:', chatErr);
      return { matched: false };
    }
    
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

export const respondToChatRequest = async (userId, actorId, approved) => {
  console.log('📋 Responding to chat request:', { userId, actorId, approved });
  
  try {
    if (!approved) {
      // Mark as read and rejected
      const { error: updateError } = await supabase
        .from('match_notifications')
        .update({ 
          read: true,
          metadata: { 
            status: 'rejected', 
            rejected_at: new Date().toISOString() 
          }
        })
        .eq('user_id', userId)
        .eq('actor_id', actorId)
        .eq('type', 'chat_request');

      if (updateError) {
        console.error('❌ Error updating rejection:', updateError);
      }

      console.log('❌ Chat request declined');
      return { success: true, chatCreated: false };
    }

    // User approved - create chat
    console.log('🎉 Chat request approved! Creating chat...');
    
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

    // Mark notification as read and approved
    await supabase
      .from('match_notifications')
      .update({ 
        read: true,
        metadata: { 
          status: 'approved', 
          approved_at: new Date().toISOString(),
          chat_id: chat.id
        }
      })
      .eq('user_id', userId)
      .eq('actor_id', actorId)
      .eq('type', 'chat_request');

    console.log('✅ Chat created successfully!');
    return { 
      success: true, 
      chatCreated: true, 
      chatId: chat.id 
    };

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