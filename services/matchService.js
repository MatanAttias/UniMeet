// services/matchService.js - Enhanced Version

import { supabase } from '../lib/supabase';

/**
 * חישוב מרחק בין שתי נקודות גיאוגרפיות
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // רדיוס כדור הארץ בק"מ
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * חישוב התאמה על בסיס גיל
 */
const calculateAgeCompatibility = (userAge, targetAge, maxAgeDiff = 10) => {
  const ageDiff = Math.abs(userAge - targetAge);
  return Math.max(0, 1 - (ageDiff / maxAgeDiff));
};

/**
 * חישוב התאמה על בסיס תחביבים/תכונות משותפות
 */
const calculateCommonInterests = (userTraits, targetTraits) => {
  if (!userTraits?.length || !targetTraits?.length) return 0;
  
  const userSet = new Set(userTraits);
  const commonCount = targetTraits.filter(trait => userSet.has(trait)).length;
  
  return commonCount / Math.max(userTraits.length, targetTraits.length);
};

/**
 * אלגוריתם מאצ'ים משופר עם ציונים
 */
export const fetchSmartMatches = async (userId, maxDistance = 50) => {
  try {
    // שליפת פרטי המשתמש הנוכחי
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // שליפת כל המשתמשים פוטנציאליים (לא כולל עצמו)
    const { data: potentialMatches, error: matchError } = await supabase
      .from('users')
      .select('*')
      .neq('id', userId)
      .not('image', 'is', null); // רק משתמשים עם תמונה

    if (matchError) throw matchError;

    // שליפת אינטראקציות קיימות
    const { data: existingInteractions } = await supabase
      .from('interactions')
      .select('target_id, type')
      .eq('user_id', userId);

    const interactedUserIds = new Set(existingInteractions?.map(i => i.target_id) || []);

    // סינון והערכת התאמות
    const scoredMatches = potentialMatches
      .filter(user => {
        // סינון בסיסי
        if (interactedUserIds.has(user.id)) return false; // כבר אינטראקציה
        if (!matchesPreferences(currentUser, user)) return false; // העדפות מין
        
        return true;
      })
      .map(user => {
        let score = 0;
        const factors = [];

        // 1. מרחק גיאוגרפי (משקל: 25%)
        if (currentUser.location && user.location) {
          const distance = calculateDistance(
            currentUser.location.latitude,
            currentUser.location.longitude,
            user.location.latitude,
            user.location.longitude
          );
          
          if (distance <= maxDistance) {
            const distanceScore = Math.max(0, 1 - (distance / maxDistance));
            score += distanceScore * 0.25;
            factors.push({ type: 'distance', score: distanceScore, value: `${distance.toFixed(1)}km` });
          }
        }

        // 2. התאמת גיל (משקל: 20%)
        if (currentUser.birth_date && user.birth_date) {
          const userAge = calculateAge(currentUser.birth_date);
          const targetAge = calculateAge(user.birth_date);
          const ageScore = calculateAgeCompatibility(userAge, targetAge);
          score += ageScore * 0.20;
          factors.push({ type: 'age', score: ageScore, value: `${targetAge} years` });
        }

        // 3. תחביבים משותפים (משקל: 25%)
        const hobbiesScore = calculateCommonInterests(currentUser.hobbies, user.hobbies);
        score += hobbiesScore * 0.25;
        factors.push({ type: 'hobbies', score: hobbiesScore, value: `${Math.round(hobbiesScore * 100)}% match` });

        // 4. תכונות אישיות משותפות (משקל: 20%)
        const traitsScore = calculateCommonInterests(currentUser.traits, user.traits);
        score += traitsScore * 0.20;
        factors.push({ type: 'traits', score: traitsScore, value: `${Math.round(traitsScore * 100)}% match` });

        // 5. סוג חיבור מועדף (משקל: 10%)
        const connectionScore = currentUser.connectionTypes === user.connectionTypes ? 1 : 0.5;
        score += connectionScore * 0.10;
        factors.push({ type: 'connection', score: connectionScore, value: user.connectionTypes });

        return {
          ...user,
          matchScore: Math.round(score * 100), // ציון מ-0 עד 100
          matchFactors: factors
        };
      })
      .filter(user => user.matchScore > 30) // רק התאמות מעל 30%
      .sort((a, b) => b.matchScore - a.matchScore) // מיון לפי ציון
      .slice(0, 50); // לקחת 50 הטובים ביותר

    return scoredMatches;

  } catch (error) {
    console.error('Error fetching smart matches:', error);
    return [];
  }
};

/**
 * בדיקה אם המשתמש מתאים להעדפות המין
 */
const matchesPreferences = (currentUser, targetUser) => {
  // בדיקה הדדית של העדפות
  const currentUserLikesTarget = 
    !currentUser.preferredMatch || 
    currentUser.preferredMatch === 'כולם' ||
    (currentUser.preferredMatch === 'גברים' && targetUser.gender === 'זכר') ||
    (currentUser.preferredMatch === 'נשים' && targetUser.gender === 'נקבה');

  const targetLikesCurrentUser = 
    !targetUser.preferredMatch || 
    targetUser.preferredMatch === 'כולם' ||
    (targetUser.preferredMatch === 'גברים' && currentUser.gender === 'זכר') ||
    (targetUser.preferredMatch === 'נשים' && currentUser.gender === 'נקבה');

  return currentUserLikesTarget && targetLikesCurrentUser;
};

/**
 * חישוב גיל מתאריך לידה
 */
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * שמירת אינטראקציה ובדיקת match הדדי
 */
export const processInteraction = async (userId, targetId, type) => {
  try {
    // שמירת האינטראקציה
    const { error: interactionError } = await supabase
      .from('interactions')
      .upsert(
        { user_id: userId, target_id: targetId, type },
        { onConflict: ['user_id', 'target_id'] }
      );

    if (interactionError) throw interactionError;

    // אם זה לייק - בדיקת match הדדי
    if (type === 'like') {
      const { data: reciprocalLike } = await supabase
        .from('interactions')
        .select('*')
        .eq('user_id', targetId)
        .eq('target_id', userId)
        .eq('type', 'like')
        .limit(1);

      if (reciprocalLike?.length > 0) {
        // יצירת צ'אט חדש
        const [user1, user2] = [userId, targetId].sort();
        const { data: chat, error: chatError } = await supabase
          .from('chats')
          .upsert(
            { user1_id: user1, user2_id: user2 },
            { onConflict: ['user1_id', 'user2_id'] }
          )
          .select('id')
          .single();

        if (!chatError && chat?.id) {
          // שמירת רשומה לטבלת matches
          await supabase
            .from('matches')
            .insert([
              { user1_id: user1, user2_id: user2, chat_id: chat.id }
            ]);

          // שמירת התראה ל-match_notifications לשני הצדדים
          await supabase
            .from('match_notifications')
            .insert([
              { user_id: userId, matched_with_id: targetId },
              { user_id: targetId, matched_with_id: userId }
            ]);

          return {
            success: true,
            matched: true,
            chatId: chat.id,
            message: 'It\'s a match! 🎉'
          };
        }
      }
    }

    return {
      success: true,
      matched: false,
      message: type === 'like' ? 'Like sent!' : 'Passed'
    };

  } catch (error) {
    console.error('Error processing interaction:', error);
    return { success: false, error: error.message };
  }
};


// Backward compatibility
export const fetchAttributeMatches = fetchSmartMatches;
export const likeUser = (userId, targetId) => processInteraction(userId, targetId, 'like');
export const friendUser = (userId, targetId) => processInteraction(userId, targetId, 'friend');
export const rejectUser = (userId, targetId) => processInteraction(userId, targetId, 'reject');