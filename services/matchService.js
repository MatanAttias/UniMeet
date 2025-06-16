import { supabase } from '../lib/supabase';


export const fetchAttributeMatches = async (userId) => {
  try {
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('gender, connectionTypes')
      .eq('id', userId)
      .single();

    if (userError || !currentUser) {
      console.error('Error fetching current user:', userError);
      return [];
    }
    if (!currentUser.gender || !currentUser.connectionTypes) {
      console.warn('User missing gender or connectionTypes');
      return [];
    }

    const { data: outgoingInteractions, error: outErr } = await supabase
      .from('interactions')
      .select('target_id')
      .eq('user_id', userId);
    if (outErr) {
      console.error('Error fetching outgoing interactions:', outErr);
      return [];
    }
    const outgoingIds = outgoingInteractions.map((i) => i.target_id);

 
    const { data: incomingInteractions, error: inErr } = await supabase
      .from('interactions')
      .select('user_id')
      .eq('target_id', userId);
    if (inErr) {
      console.error('Error fetching incoming interactions:', inErr);
      return [];
    }
    const incomingIds = incomingInteractions.map((i) => i.user_id);

    const excludedIdsSet = new Set([...outgoingIds, ...incomingIds]);

    const userWantsDating = currentUser.connectionTypes.includes('דייטים');
    const userWantsFriends = currentUser.connectionTypes.includes('חברויות');
    const userGender = currentUser.gender;

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

    
    const filteredUsers = allUsers
      .filter((u) => !excludedIdsSet.has(u.id))
      .filter((targetUser) => {
        const targetGender = targetUser.gender;
        const targetWantsDating = targetUser.connectionTypes.includes('דייטים');
        const targetWantsFriends = targetUser.connectionTypes.includes('חברויות');

        let hasCompatibleConnection = false;

        if (userWantsDating && targetWantsDating) {
          const oppositeGenders =
            (userGender === 'זכר' && targetGender === 'נקבה') ||
            (userGender === 'נקבה' && targetGender === 'זכר');
          if (oppositeGenders) {
            hasCompatibleConnection = true;
          }
        }

        if (userWantsFriends && targetWantsFriends) {
          hasCompatibleConnection = true;
        }

        return hasCompatibleConnection;
      });

    const shuffledUsers = filteredUsers.sort(() => Math.random() - 0.5).slice(0, 50);
    return shuffledUsers;
  } catch (error) {
    console.error('Error in fetchAttributeMatches:', error);
    return [];
  }
};


export const likeUser = async (userId, targetId) => {
  console.log('🔄 Starting likeUser process:', { userId, targetId });

  try {
    const { data: existingInteraction, error: checkError } = await supabase
      .from('interactions')
      .select('id, type')
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .single();

    let interactionId;

    if (checkError && checkError.code === 'PGRST116') {
      console.log('📝 Creating new like interaction...');
      const { data: likeRow, error: likeError } = await supabase
        .from('interactions')
        .insert({ user_id: userId, target_id: targetId, type: 'like' })
        .select('id')
        .single();

      if (likeError || !likeRow) {
        console.error('❌ likeUser error:', likeError);
        return { matched: false };
      }
      interactionId = likeRow.id;
    } else if (checkError) {
      console.error('❌ Error checking existing interaction:', checkError);
      return { matched: false };
    } else {
      interactionId = existingInteraction.id;
      if (existingInteraction.type === 'like') {
        
      } else if (existingInteraction.type === 'friend') {
        console.log('👫➡️💕 Upgrading friend to like...');
        const { data: updated, error: updateError } = await supabase
          .from('interactions')
          .update({ type: 'like' })
          .eq('id', existingInteraction.id)
          .select('id')
          .single();
        if (updateError || !updated) {
          console.error('❌ Error upgrading to like:', updateError);
          return { matched: false };
        }
        interactionId = updated.id;
      } else if (existingInteraction.type === 'reject') {
        console.log('❌ User was rejected - cannot like');
        return { matched: false };
      }
    }

   
    const { data: reciprocalInteraction, error: recErr } = await supabase
      .from('interactions')
      .select('id, type')
      .eq('user_id', targetId)
      .eq('target_id', userId)
      .eq('type', 'like')
      .single();

    if (recErr && recErr.code !== 'PGRST116') {
      console.error('❌ Reciprocal interaction check error:', recErr);
      return { matched: false };
    }

    if (reciprocalInteraction) {
    
      return await createMatch(userId, targetId, interactionId, reciprocalInteraction.id);
    } else {
     
      const { error: likeNotifErr } = await supabase
        .from('match_notifications')
        .insert({
          user_id: targetId,
          actor_id: userId,
          type: 'like',
          interaction_id: interactionId,
          read: false,
          metadata: {},
        });

      if (likeNotifErr) {
        console.error('❌ Error inserting like into match_notifications:', likeNotifErr);
      }
      return { matched: false, interaction_id: interactionId };
    }
  } catch (error) {
    console.error('❌ Error in likeUser:', error);
    return { matched: false };
  }
};

const createMatch = async (userId, targetId, userInteractionId, targetInteractionId) => {
  const [u1, u2] = [userId, targetId].sort();

  try {
   
    console.log('💬 Creating match chat...');
    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .upsert(
        { user1_id: u1, user2_id: u2 },
        { onConflict: 'user1_id,user2_id' }
      )
      .select('id')
      .single();

    if (chatErr || !chat) {
      console.error('❌ Chat creation error:', chatErr);
      return { matched: false };
    }

    const { error: matchErr } = await supabase
      .from('matches')
      .upsert(
        { user1: u1, user2: u2 },
        { onConflict: 'user1,user2' }
      );

    if (matchErr) {
      console.error('❌ Match creation error:', matchErr);
    }

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
          match_type: 'romantic',
          user_interaction: userInteractionId,
        },
      });

    if (matchNotifErr) {
      console.error('❌ Match notification error:', matchNotifErr);
    }

    return { matched: true, chatId: chat.id, interaction_id: targetInteractionId };
  } catch (error) {
    console.error('❌ Error in createMatch:', error);
    return { matched: false };
  }
};

export const friendUser = async (userId, targetId) => {
  console.log('👫 Starting friendUser process:', { userId, targetId });

  try {
    const { data: existingInteraction, error: checkError } = await supabase
      .from('interactions')
      .select('id, type')
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .single();

    let interactionId;

    if (checkError && checkError.code === 'PGRST116') {
      const { data: friendRow, error: friendError } = await supabase
        .from('interactions')
        .insert({ user_id: userId, target_id: targetId, type: 'friend' })
        .select('id')
        .single();

      if (friendError || !friendRow) {
        console.error('❌ friendUser error:', friendError);
        return { matched: false };
      }
      interactionId = friendRow.id;
    } else if (checkError) {
      console.error('❌ Error checking existing interaction:', checkError);
      return { matched: false };
    } else {
      interactionId = existingInteraction.id;
      if (existingInteraction.type === 'friend') {
        return { matched: false, interaction_id: interactionId };
      } else if (existingInteraction.type === 'like') {
        return { matched: false, interaction_id: interactionId };
      } else if (existingInteraction.type === 'reject') {
        return { matched: false };
      }
    }

    const { data: reciprocalInteraction, error: recErr } = await supabase
      .from('interactions')
      .select('id, type')
      .eq('user_id', targetId)
      .eq('target_id', userId)
      .in('type', ['friend', 'like'])
      .single();

    if (recErr && recErr.code !== 'PGRST116') {
      console.error('❌ Reciprocal interaction check error:', recErr);
      return { matched: false };
    }

    if (reciprocalInteraction) {
      return await createFriendshipChat(userId, targetId, interactionId, reciprocalInteraction.id);
    } else {
      const { error: friendNotifErr } = await supabase
        .from('match_notifications')
        .insert({
          user_id: targetId,
          actor_id: userId,
          type: 'friend',
          interaction_id: interactionId,
          read: false,
          metadata: {},
        });

      if (friendNotifErr) {
        console.error('❌ Error inserting friend request into match_notifications:', friendNotifErr);
      }
      return { matched: false, interaction_id: interactionId };
    }
  } catch (error) {
    console.error('❌ Error in friendUser:', error);
    return { matched: false };
  }
};


const createFriendshipChat = async (userId, targetId, userInteractionId, targetInteractionId) => {
  try {
    const [u1, u2] = [userId, targetId].sort();

    console.log('💬 Creating friendship chat...');
    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .upsert(
        { user1_id: u1, user2_id: u2 },
        { onConflict: 'user1_id,user2_id' }
      )
      .select('id')
      .single();

    if (chatErr || !chat) {
      console.error('❌ Chat creation error:', chatErr);
      return { matched: false };
    }

    const { error: friendshipNotifErr } = await supabase
      .from('match_notifications')
      .insert({
        user_id: targetId,
        actor_id: userId,
        type: 'friend',
        interaction_id: targetInteractionId,
        read: false,
        metadata: {
          chat_id: chat.id,
          user_interaction: userInteractionId,
        },
      });

    if (friendshipNotifErr) {
      console.error('❌ Friendship chat notification error:', friendshipNotifErr);
    }
    return { matched: true, chatId: chat.id, interaction_id: targetInteractionId };
  } catch (error) {
    console.error('❌ Error in createFriendshipChat:', error);
    return { matched: false };
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

    if (likeError || !likeRow) {
      console.error('❌ Error creating like back:', likeError);
      return { matched: false, error: likeError?.message };
    }
    const userInteractionId = likeRow.id;

    const [u1, u2] = [userId, targetId].sort();

    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .upsert(
        { user1_id: u1, user2_id: u2 },
        { onConflict: 'user1_id,user2_id' }
      )
      .select('id')
      .single();

    if (chatErr || !chat) {
      console.error('❌ Chat creation error:', chatErr);
      return { matched: false, error: chatErr?.message };
    }

    const { error: matchErr } = await supabase
      .from('matches')
      .upsert(
        { user1: u1, user2: u2 },
        { onConflict: 'user1,user2' }
      );
    if (matchErr) {
      console.error('❌ Match creation error:', matchErr);
    }

    const { error: matchNotifErr } = await supabase
      .from('match_notifications')
      .insert({
        user_id: targetId,
        actor_id: userId,
        type: 'match',
        interaction_id: likeRow.id,
        read: false,
        metadata: {
          chat_id: chat.id,
          match_type: 'romantic',
          user_interaction: userInteractionId,
        },
      });

    if (matchNotifErr) {
      console.error('❌ Error inserting match into match_notifications:', matchNotifErr);
    }
    return { matched: true, chatId: chat.id, interaction_id: likeRow.id };
  } catch (error) {
    console.error('❌ Error in likeUserBack:', error);
    return { matched: false, error: error.message };
  }
};


export const friendUserBack = async (userId, targetId) => {
  console.log('👫 Accepting friend back:', { userId, targetId });

  try {
    const { data: friendRow, error: friendError } = await supabase
      .from('interactions')
      .insert({ user_id: userId, target_id: targetId, type: 'friend' })
      .select('id')
      .single();

    if (friendError || !friendRow) {
      console.error('❌ Error creating friend back:', friendError);
      return { matched: false, error: friendError?.message };
    }
    const userInteractionId = friendRow.id;

    const [u1, u2] = [userId, targetId].sort();

    const { data: chat, error: chatErr } = await supabase
      .from('chats')
      .upsert(
        { user1_id: u1, user2_id: u2 },
        { onConflict: 'user1_id,user2_id' }
      )
      .select('id')
      .single();

    if (chatErr || !chat) {
      console.error('❌ Chat creation error:', chatErr);
      return { matched: false, error: chatErr?.message };
    }

    const { error: matchNotifErr } = await supabase
      .from('match_notifications')
      .insert({
        user_id: targetId,
        actor_id: userId,
        type: 'friend',
        interaction_id: friendRow.id,
        read: false,
        metadata: {
          chat_id: chat.id,
          user_interaction: userInteractionId,
        },
      });

    if (matchNotifErr) {
      console.error('❌ Error inserting friend match into match_notifications:', matchNotifErr);
    }
    return { matched: true, chatId: chat.id, interaction_id: friendRow.id };
  } catch (error) {
    console.error('❌ Error in friendUserBack:', error);
    return { matched: false, error: error.message };
  }
};


export const fetchLikesAndRequests = async (userId) => {
  try {

    const { data: likedYouRaw, error: likedError } = await supabase
      .from('interactions')
      .select(`
        id,
        type,
        created_at,
        user:users!interactions_user_id_fkey (
          id, name, image, birth_date
        )
      `)
      .eq('target_id', userId)
      .in('type', ['like', 'friend'])
      .order('created_at', { ascending: false });

    if (likedError) {
      console.error('❌ Error fetching liked you / friend requests:', likedError);
    }

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

    const matchesWithDetails = [];
    const matchedUserIds = new Set();

    if (matches) {
      for (const match of matches) {
        const otherUserId = match.user1 === userId ? match.user2 : match.user1;
        matchedUserIds.add(otherUserId);

        const { data: otherUser, error: userErr } = await supabase
          .from('users')
          .select('id, name, image, birth_date')
          .eq('id', otherUserId)
          .single();
        if (!userErr && otherUser) {
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
            created_at: match.created_at,
          });
        }
      }
    }

    const likedYou = (likedYouRaw || []).filter((entry) => {
      const fromUserId = entry.user.id;
      return !matchedUserIds.has(fromUserId);
    });

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
            created_at: chat.created_at,
          });
        }
      }
    }

    const result = {
      liked_you: likedYou || [],
      matches: matchesWithDetails || [],
      active_chats: chatsWithDetails || [],
    };

  

    return result;
  } catch (error) {
    console.error('❌ Error in fetchLikesAndRequests:', error);
    return {
      liked_you: [],
      matches: [],
      active_chats: [],
    };
  }
};


export const rejectUser = async (userId, targetId) => {
  console.log('❌ Rejecting user:', targetId);

  const { data, error } = await supabase
    .from('interactions')
    .upsert(
      { user_id: userId, target_id: targetId, type: 'reject' },
      { onConflict: 'user_id,target_id,type' }
    )
    .select('id')
    .single();

  if (error) {
    console.error('rejectUser error:', error);
    return { matched: false, error: error.message };
  }
  return { matched: false, interaction_id: data.id };
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
