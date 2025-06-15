import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Modal, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MotiView } from 'moti';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../constants/helpers/common';
import { sendToChat } from '../../services/openai';
import { supabase } from '../../lib/supabase';
import { PARENT_TIPS_SYSTEM_PROMPT, createAgeAppropriateUserMessage } from '../../constants/prompts';
import { saveParentTip, unsaveParentTip, isParentTipSaved } from '../../services/PostService';

// רשימה מורחבת של מונחי מוגבלות לולידציה
const disabilityTerms = [
  // מונחים כלליים
  'מוגבלות', 'נכות', 'צרכים מיוחדים', 'התפתחותי', 'קוגניטיבי',
  
  // מוגבלויות שכליות וקוגניטיביות
  'שכלית התפתחותית', 'למידה', 'דיסלקסיה', 'ADHD', 'קשב וריכוז', 'זיכרון',
  
  // תסמונות נפוצות
  'דאון', 'אוטיזם', 'אספרגר', 'ספקטרום אוטיסטי',
  
  // מוגבלויות פיזיות
  'שיתוק מוחין', 'ספינה ביפידה', 'שרירי', 'תנועתי', 'ניידות',
  
  // מוגבלויות חושיות
  'עיוורון', 'לקות ראיה', 'חירשות', 'כבדות שמיעה', 'עיבוד חושי',
  
  // מוגבלויות נפשיות
  'דיכאון', 'חרדה', 'דו קוטבי', 'PTSD',
  
  // תקשורת
  'תקשורת', 'דיבור', 'שפה', 'גמגום',
  
  // מונחי תמיכה
  'תמיכה', 'נגישות', 'התאמות', 'ליווי', 'עצמאות', 'תפקוד יומיומי'
];

// פונקציה לולידציה קלינית
const validateClinicalContent = (tips) => {
  const validationErrors = [];

  tips.forEach((tip, index) => {
    // בדיקה - האם יש לפחות מונח אחד רלוונטי
    const hasDisabilityContext = disabilityTerms.some(term => 
      tip.content.includes(term) || tip.example.includes(term) || tip.practicalSteps.includes(term)
    );
    
    if (!hasDisabilityContext) {
      validationErrors.push(`טיפ ${index + 1}: חסר הקשר למוגבלות`);
    }

    // בדיקות בסיסיות נוספות
    if (!tip.scientificBasis || tip.scientificBasis.length < 20) {
      validationErrors.push(`טיפ ${index + 1}: חסר בסיס מדעי`);
    }

    if (!tip.example || tip.example.length < 30) {
      validationErrors.push(`טיפ ${index + 1}: חסרה דוגמה מפורטת`);
    }

    const steps = tip.practicalSteps.split('\n').filter(step => step.trim());
    if (steps.length !== 4) {
      validationErrors.push(`טיפ ${index + 1}: חסרים שלבים מעשיים`);
    }
  });

  return validationErrors;
};


// קטגוריות טיפים
const TIP_CATEGORIES = [
  { id: 'communication', title: 'תקשורת', icon: 'message-text-outline', color: '#6B73FF', description: 'כיצד לתקשר עם הילד בצורה יעילה' },
  { id: 'daily_routine', title: 'שגרה יומיומית', icon: 'clock-outline', color: '#9C88FF', description: 'יצירת שגרות בריאות ויציבות' },
  { id: 'sensory', title: 'ויסות חושי', icon: 'brain', color: '#FF8A9B', description: 'כלים לוויסות חושי והרגעה' },
  { id: 'social', title: 'מיומנויות חברתיות', icon: 'account-group', color: '#32D1C3', description: 'פיתוח קשרים חברתיים' },
  { id: 'education', title: 'חינוך ולמידה', icon: 'book-open-variant', color: '#FFB443', description: 'אסטרטגיות למידה מותאמות' },
  { id: 'self_care', title: 'טיפול עצמי להורים', icon: 'heart', color: '#FF6B9D', description: 'שמירה על הבריאות הנפשית שלכם' },
];

// פונקציות עזר
const parseJsonField = (value) => {
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch { return [value]; }
  }
  if (Array.isArray(value)) {
    return value.length > 0 && typeof value[0] === 'object' && value[0].hasOwnProperty('provider') ? [] : value;
  }
  return typeof value === 'object' && value !== null ? Object.values(value) : [];
};

const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};


const ParentTips = () => {
  const { user, setUserData, parentTipsCache, updateParentTipsCache, isTipsCacheLoaded } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [userProfileHash, setUserProfileHash] = useState('');
  const [selectedTip, setSelectedTip] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isTipSaved, setIsTipSaved] = useState(false);
  const [checkingTipStatus, setCheckingTipStatus] = useState(false);


  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 שעות

  useEffect(() => {
  console.log('🔍 Debug - ParentTips state:');
  console.log('- isTipsCacheLoaded:', isTipsCacheLoaded);
  console.log('- parentTipsCache.tips.length:', parentTipsCache.tips.length);
  console.log('- parentTipsCache.lastFetchTime:', parentTipsCache.lastFetchTime);
  console.log('- tips.length (local state):', tips.length);
  console.log('- user data loaded:', !!user?.identities);
}, [isTipsCacheLoaded, parentTipsCache, tips.length, user?.identities]);


  // הוספת debug console.log
  useEffect(() => {
    console.log('🔍 Current tips state:', tips);
    console.log('🔍 Selected category:', selectedCategory);
    console.log('🔍 Filtered tips count:', filteredTips.length);
  }, [tips, selectedCategory]);

  // שליפת נתונים מלאים מהטבלה
  useEffect(() => {
    const fetchCompleteUserData = async () => {
      if (!user?.id) return;
      console.log('🔍 Fetching complete user data...');
      const { data, error } = await supabase
        .from('users')
        .select('identities, supportNeeds, birth_date, gender')
        .eq('id', user.id)
        .single();
      if (data && !error) {
        console.log('✅ Complete user data fetched:', data);
        setUserData({ ...user, ...data });
      } else {
        console.error('❌ Error fetching user data:', error);
      }
    };
    fetchCompleteUserData();
  }, [user?.id]);


  const generateProfileHash = () => {
    const profile = {
      identities: parseJsonField(user?.identities),
      supportNeeds: parseJsonField(user?.supportNeeds),
      age: calculateAge(user?.birth_date),
      gender: user?.gender,
    };
    return JSON.stringify(profile);
  };

  const checkAndFetchTips = () => {
  const now = Date.now();
  const currentProfileHash = generateProfileHash();
  
  // בדוק קאש עם validation מלא
  const { tips: cachedTips, lastFetchTime: cachedTime, profileHash } = parentTipsCache;
  const isCacheFresh = cachedTime && (now - cachedTime) <= CACHE_DURATION;
  const isSameProfile = profileHash === currentProfileHash;
  
  // רק אם הקאש טרי **וגם** הפרופיל זהה
  if (cachedTips.length > 0 && isCacheFresh && isSameProfile) {
    console.log('⚡ Using cached tips - profile and time match perfectly');
    setTips(cachedTips);
    setLastFetchTime(cachedTime);
    setUserProfileHash(profileHash);
    return;
  }

  // 🛡️ מניעת קריאות כפולות
  if (isFetching) {
    console.log('⏳ Already fetching tips, skipping duplicate request');
    return;
  }
  
  // אחרת - טען טיפים חדשים
  if (!isSameProfile) {
    console.log('🔄 Profile changed, fetching new tips');
  } else {
    console.log('🔄 Cache expired, fetching fresh tips');
  }
  
  setUserProfileHash(currentProfileHash);
  fetchTipsFromAI();
};



useEffect(() => {
  if (!isTipsCacheLoaded) return;

  // בדיקה זהירה של קאש עם פרופיל
  const { tips: cachedTips, lastFetchTime: cachedTime, profileHash } = parentTipsCache;
  const now = Date.now();
  const isFresh = cachedTime && (now - cachedTime) <= CACHE_DURATION;
  
  
  // פתרון: אם יש קאש טרי, בדוק אם הפרופיל הבסיסי תואם
  const basicUserId = user?.id;
  const cachedUserId = profileHash ? JSON.parse(profileHash)?.userId : null;
  
  if (cachedTips.length > 0 && isFresh) {
    // אם יש קאש טרי, בדוק לפחות שזה אותו משתמש
    if (basicUserId && cachedUserId && basicUserId === cachedUserId) {
      console.log('⚡ Loading cached tips - same user, fresh cache');
      setTips(cachedTips);
      setLastFetchTime(cachedTime);
      setUserProfileHash(profileHash);
      return;
    } else if (!basicUserId) {
      // משתמש עדיין נטען - חכה קצת
      console.log('⏳ User still loading, waiting...');
      return;
    } else {
      console.log('👤 Different user detected, will fetch new tips');
    }
  }

  // אם אין קאש טרי או משתמש שונה - המתן לנתוני משתמש מלאים
  const identities = parseJsonField(user?.identities);
  const supportNeeds = parseJsonField(user?.supportNeeds);
  
  if (identities.length > 0 || supportNeeds.length > 0) {
    console.log('✅ Clinical data available, fetching tips...');
    checkAndFetchTips();
  } else if (user?.id) {
    const timer = setTimeout(() => {
      console.log('⚠️ No clinical data after wait, fetching general tips...');
      checkAndFetchTips();
    }, 1500);
    return () => clearTimeout(timer);
  }
}, [isTipsCacheLoaded, parentTipsCache, user?.id, user?.identities, user?.supportNeeds]);



const fetchTipsFromAI = async () => {
  // בדיקה אם כבר טוענים
  if (isFetching) {
    console.log('⏳ Fetch already in progress, skipping');
    return;
  }

  try {
    setLoading(true);
    setIsFetching(true); // 🔒 נעל fetch

    // בניית פרופיל המשתמש עם בדיקות
    const userProfile = {
      identities: parseJsonField(user?.identities) || [],
      supportNeeds: parseJsonField(user?.supportNeeds) || [],
      age: calculateAge(user?.birth_date) || 'לא ידוע',
      gender: user?.gender || 'לא צוין',
    };

    // חשב hash של הפרופיל כדי לשמור בקאש
    const currentProfileHash = generateProfileHash();

    console.log('User profile for tips:', userProfile);

    // בדיקה שה-prompt קיים
    if (!PARENT_TIPS_SYSTEM_PROMPT) {
      console.error('PARENT_TIPS_SYSTEM_PROMPT is missing!');
      throw new Error('System prompt is missing');
    }

    // שימוש בפונקציה החדשה ליצירת הודעת משתמש מותאמת גיל
    const userMessage = createAgeAppropriateUserMessage(userProfile);

    // הכנת ההודעות
    const messages = [
      { role: 'system', content: PARENT_TIPS_SYSTEM_PROMPT },
      { role: 'user',   content: userMessage }
    ];

    console.log('Sending messages to OpenAI:', messages);

    // קריאה ל-API
    const aiResponse = await sendToChat(messages, {
      model: 'gpt-4o-mini',
      max_tokens: 5500,
      temperature: 0.1,
      json_mode: true
    });

    console.log('AI Response received:', aiResponse);

    if (!aiResponse?.content) {
      throw new Error('AI returned empty response');
    }

    // ניתוח התשובה
    const parsed = parseAIResponse(aiResponse.content);
    console.log('✅ Parsed AI response:', parsed);

    // עיבוד הטיפים
    const formattedTips = parsed.tips.map((tip, index) => ({
      id:                tip.id || (index + 1).toString(),
      category:          tip.category,
      title:             tip.title,
      summary:           tip.summary,
      content:           tip.content,
      practicalSteps:    tip.practicalSteps || '',
      example:           tip.example       || '',
      commonMistakes:    tip.commonMistakes|| '',
      scientificBasis:   tip.scientificBasis|| '',
      author:            tip.author,
      source:            tip.source,
      readTime:          typeof tip.readTime === 'number'
                           ? `${tip.readTime} דקות`
                           : '5 דקות',
      likes:             tip.likes || Math.floor(Math.random() * 30) + 10,
      isBookmarked:      false,
      createdAt:         new Date().toISOString(),
    }));

    // וידוא שיש 6 טיפים
    if (formattedTips.length < 6) {
      console.warn(`Received only ${formattedTips.length} tips instead of 6`);
      const fallbackTips = generateFallbackTips(
        userProfile.identities,
        userProfile.supportNeeds
      );
      formattedTips.push(
        ...fallbackTips.slice(formattedTips.length, 6)
      );
    }

    // עדכון ה-state המקומי
    const now = Date.now();
    setTips(formattedTips);
    setLastFetchTime(now);
    setUserProfileHash(currentProfileHash);

    // **שמירה ב־AuthContext וב־AsyncStorage**
    updateParentTipsCache({
      tips:           formattedTips,
      lastFetchTime:  now,
      profileHash:    currentProfileHash
    });

    console.log('✅ Tips fetched and cached successfully:', formattedTips.length);

  } catch (err) {
    console.error('Error fetching tips:', err);
    console.error('Error details:', err.message);

    // טעינת טיפים מקומיים במקרה של שגיאה
    const fallbackTips = generateFallbackTips(
      parseJsonField(user?.identities) || [],
      parseJsonField(user?.supportNeeds) || []
    );
    const now = Date.now();
    setTips(fallbackTips);
    setLastFetchTime(now);
    updateParentTipsCache({
      tips:           fallbackTips,
      lastFetchTime:  now,
      profileHash:    generateProfileHash()
    });

    Alert.alert(
      'שגיאה בטעינת טיפים',
      'נטענו טיפים כלליים. נסה לרענן מאוחר יותר.',
      [{ text: 'אישור', style: 'default' }]
    );
  } finally {
    setLoading(false);
    setIsFetching(false); // 🔓 שחרר fetch
  }
};

const parseAIResponse = (rawResponse) => {
  console.log('🏥 Parsing clinical response...');

  // 1. וידוא טיפוס
  if (typeof rawResponse !== 'string') {
    console.error('Unexpected type for AI response:', typeof rawResponse);
    return { tips: [] };
  }

  let cleaned = rawResponse.trim();

  // 2. הסרת markdown code blocks
  cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  // 3. ניקוי בסיסי: BOM, תווי בקרה
  cleaned = cleaned
    .replace(/^\uFEFF/, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // 4. חיפוש גבולות JSON
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    console.error('לא נמצאו גבולות JSON תקינים בתשובת ה-AI');
    return { tips: [] };
  }

  let jsonString = cleaned.slice(firstBrace, lastBrace + 1);

  // 5. תיקונים זהירים בלבד
  jsonString = jsonString
    .replace(/,(\s*[}\]])/g, '$1')  // הסרת פסיקים עודפים לפני סגירה
    .replace(/([}\]])(\s*)([{[])/g, '$1,$2$3');  // הוספת פסיקים בין אובייקטים

  // 6. בדיקת איזון סוגריים
  const openBraces = (jsonString.match(/{/g) || []).length;
  const closeBraces = (jsonString.match(/}/g) || []).length;
  const openBrackets = (jsonString.match(/\[/g) || []).length;
  const closeBrackets = (jsonString.match(/]/g) || []).length;

  // תיקון איזון אם נחוץ
  if (closeBraces < openBraces) {
    jsonString += '}'.repeat(openBraces - closeBraces);
  }
  if (closeBrackets < openBrackets) {
    jsonString += ']'.repeat(openBrackets - closeBrackets);
  }

  console.log('Cleaned JSON string (first 300 chars):', jsonString.substring(0, 300) + '...');

  // 7. ניסיון parsing
  try {
    const parsed = JSON.parse(jsonString);
    
    // בדיקת מבנה
    if (Array.isArray(parsed)) {
      const result = { tips: parsed };
      return validateAndReturn(result);
    }
    if (parsed && parsed.tips && Array.isArray(parsed.tips)) {
      return validateAndReturn(parsed);
    }
    
    console.error('Parsed JSON אבל חסר מערך tips');
    return { tips: [] };
    
  } catch (parseError) {
    console.error('שגיאת JSON.parse:', parseError.message);
    return { tips: [] };
  }
};

// פונקציה עזר לולידציה
const validateAndReturn = (parsed) => {
  if (parsed.tips && parsed.tips.length > 0) {
    const validationErrors = validateClinicalContent(parsed.tips);
    
    if (validationErrors.length > 0) {
      console.warn('⚠️ Clinical validation issues:', validationErrors);
      
      // אם יש יותר מ-3 שגיאות, דחה את התגובה
      if (validationErrors.length > 3) {
        console.error('❌ Too many validation errors, using fallback');
        return { tips: [] };
      }
    } else {
      console.log('✅ Clinical validation passed');
    }
  }
  
  return parsed;
};



  const generateFallbackTips = (identities, supportNeeds) => {
    const hasConditions = identities.length > 0;
    const conditions = identities.join(', ');
    return [
      {
        id: '1', category: 'communication',
        title: hasConditions ? `תקשורת מותאמת ל${conditions}` : 'תקשורת יעילה',
        summary: hasConditions ? `עקרונות תקשורת ספציפיים ל${conditions}` : 'טכניקות תקשורת מבוססות מחקר',
        content: hasConditions ?
          `ילדים עם ${conditions} זקוקים לתקשורת מותאמת. השתמשו בהוראות קצרות, תנו זמן עיבוד, והשתמשו בעזרים חזותיים.` :
          'השתמשו בתקשורת חיובית, קשר עין והאזנה פעילה.',
        author: 'ד"ר רחל כהן - מומחית התפתחות', 
        source: 'מחקר תקשורת 2023',
        readTime: '4 דקות',
        likes: 24, isBookmarked: false, createdAt: new Date().toISOString()
      },
      {
        id: '2', category: 'sensory',
        title: hasConditions ? `ויסות חושי ב${conditions}` : 'סביבה חושית תומכת',
        summary: hasConditions ? `אסטרטגיות ויסות חושי ל${conditions}` : 'יצירת סביבה חושית מותאמת',
        content: hasConditions ?
          `רגישויות חושיות נפוצות ב${conditions}. צרו מרחבים שקטים והשתמשו בכלים מרגיעים.` :
          'זהו העדפות חושיות וצרו סביבה מותאמת עם תאורה רכה ומוזיקה רגועה.',
        author: 'ד"ר מיכל לוי - ריפוי בעיסוק', 
        source: 'מחקר חושי 2023',
        readTime: '5 דקות',
        likes: 31, isBookmarked: true, createdAt: new Date().toISOString()
      },
      {
        id: '3', category: 'daily_routine',
        title: 'שגרה יומיומית מובנית',
        summary: 'יצירת ייצוב דרך שגרות קבועות',
        content: 'שגרה קבועה מספקת ביטחון. השתמשו בלוחות זמנים חזותיים ושמרו על עקביות.',
        author: 'ד"ר יוסי אברהם - פסיכולוג', 
        source: 'מחקר שגרה 2023',
        readTime: '6 דקות',
        likes: 28, isBookmarked: false, createdAt: new Date().toISOString()
      },
      {
        id: '4', category: 'social',
        title: hasConditions ? `מיומנויות חברתיות ב${conditions}` : 'פיתוח קשרים חברתיים',
        summary: hasConditions ? `אסטרטגיות חברתיות ל${conditions}` : 'בניית יכולות חברתיות',
        content: hasConditions ?
          `ילדים עם ${conditions} זקוקים לתרגול מובנה של מיומנויות חברתיות. השתמשו במשחקי תפקידים ומצבים מבוקרים.` :
          'עודדו אינטראקציות חיוביות ולמדו כללים חברתיים בסביבה תומכת.',
        author: 'ד"ר נעמי ברק - טיפול התנהגותי', 
        source: 'מחקר חברתי 2023',
        readTime: '5 דקות',
        likes: 22, isBookmarked: false, createdAt: new Date().toISOString()
      },
      {
        id: '5', category: 'education',
        title: hasConditions ? `למידה מותאמת ל${conditions}` : 'אסטרטגיות למידה יעילות',
        summary: hasConditions ? `שיטות הוראה ל${conditions}` : 'טכניקות למידה מבוססות מחקר',
        content: hasConditions ?
          `ילדים עם ${conditions} זקוקים לשיטות הוראה מותאמות. פרקו משימות לחלקים קטנים והשתמשו בחיזוקים חיוביים.` :
          'השתמשו בלמידה רב-חושית, חזרה ותגמול חיובי לשיפור הישגי הלמידה.',
        author: 'פרופ׳ אלון גולן - חינוך מיוחד', 
        source: 'מחקר חינוך 2023',
        readTime: '6 דקות',
        likes: 26, isBookmarked: false, createdAt: new Date().toISOString()
      },
      {
        id: '6', category: 'self_care',
        title: hasConditions ? `תמיכה הורית ל${conditions}` : 'טיפול עצמי הורי',
        summary: hasConditions ? 'משאבים להורים לילדים עם צרכים מיוחדים' : 'שמירה על בריאות נפשית',
        content: hasConditions ?
          `הורות ל${conditions} מאתגרת. חפשו תמיכה מקצועית, הצטרפו לקבוצות הורים ואל תשכחו לטפל בעצמכם.` :
          'טיפול עצמי חיוני להורות יעילה. הקדישו זמן לעצמכם, בקשו עזרה ושמרו על קשרים חברתיים.',
        author: 'ד"ר שרה גולן - פסיכולוגיה הורית', 
        source: 'מחקר הורות 2023',
        readTime: '5 דקות',
        likes: 33, isBookmarked: false, createdAt: new Date().toISOString()
      }
    ];
  };

  // חישוב הטיפים המסוננים לפי קטגוריה בלבד
  const filteredTips = tips.filter((tip) => {
    if (!tip) return false;
    return selectedCategory === 'all' || tip.category === selectedCategory;
  });

  const CategoryCard = ({ category, isSelected, onPress }) => (
    <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 300 }}>
      <Pressable
        style={[
          styles.categoryCard, 
          isSelected && styles.categoryCardSelected, 
          { borderColor: category.color }
        ]}
        onPress={() => onPress(category.id)}
      >
        <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}>
          <MaterialCommunityIcons name={category.icon} size={28} color={category.color} />
        </View>
        <Text style={[styles.categoryTitle, isSelected && styles.categoryTitleSelected]}>
          {category.title}
        </Text>
        <Text style={styles.categoryDescription}>{category.description}</Text>
      </Pressable>
    </MotiView>
  );

  const handleSaveTip = async (tip) => {
    try {
      const res = await saveParentTip(user.id, tip);
      if (res.success) {
        Alert.alert('✅ נשמר!', 'הטיפ נשמר בהצלחה ותוכל למצוא אותו בדף "שמורים"');
      } else {
        Alert.alert('שגיאה', 'לא הצלחנו לשמור את הטיפ');
      }
    } catch (error) {
      console.error('Save tip error:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בשמירת הטיפ');
    }
  };

  const TipCard = ({ tip, onSelect }) => {
  if (!tip) return null;

  const category = TIP_CATEGORIES.find(c => c.id === tip.category);

  return (
    <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }}>
      <Pressable 
        style={styles.tipCard} 
        onPress={() => onSelect(tip)}
      >
        <View style={styles.tipHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: (category?.color || '#6B73FF') + '20' }]}>
            <Text style={[styles.categoryBadgeText, { color: category?.color || '#6B73FF' }]}>
              {category?.title || 'כללי'}
            </Text>
          </View>
          <Pressable onPress={() => setTips(prev => prev.map(t => t.id === tip.id ? { ...t, isBookmarked: !t.isBookmarked } : t))}>
            <MaterialCommunityIcons
              name={tip.isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24} 
              color={tip.isBookmarked ? theme.colors.primary : theme.colors.textLight}
            />
          </Pressable>
        </View>
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tipSummary}>{tip.summary}</Text>
        <View style={styles.tipFooter}>
          <View style={styles.tipMeta}>
            <MaterialCommunityIcons name="account" size={16} color={theme.colors.textLight} />
            <Text style={styles.tipAuthor}>{tip.author}</Text>
            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.textLight} />
            <Text style={styles.tipReadTime}>{tip.readTime}</Text>
          </View>
          <View style={styles.tipActions}>
            <MaterialCommunityIcons name="heart-outline" size={18} color={theme.colors.textLight} />
            <Text style={styles.tipLikes}>{tip.likes}</Text>
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
};


  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.push('/home')}>
            <Text style={styles.backText}>חזור</Text>
          </Pressable>
          <Text style={styles.title}>הטיפים שלנו להיום 💝</Text>
          <View style={{ width: wp(15) }} />
        </View>

        {/* User Info */}
        <View style={styles.userCard}>
          <Text style={styles.userTitle}>🌟 מדריך אישי עבור: {user.name}</Text>
          <Text style={styles.userInfo}>
            {parseJsonField(user.identities).length > 0 ? 
              `✨ המאפיינים שלי: ${parseJsonField(user.identities).join(', ')}` : 
              '✨ המאפיינים שלי: טרם עודכנו'}
          </Text>
          <Text style={styles.userInfo}>
            {parseJsonField(user.supportNeeds).length > 0 ? 
              `🤝 איך אני אוהב לקבל תמיכה: ${parseJsonField(user.supportNeeds).slice(0, 2).join(', ')}${parseJsonField(user.supportNeeds).length > 2 ? '...' : ''}` : 
              '🤝 איך אני אוהב לקבל תמיכה: טרם עודכן'}
          </Text>
          <Pressable style={styles.editButton} onPress={() => router.push('/editProfile')}>
            <MaterialCommunityIcons name="heart-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.editText}>עדכן את הפרופיל שלי</Text>
          </Pressable>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl 
            refreshing={refreshing} 
            onRefresh={async () => {
              setRefreshing(true);
              console.log('🔄 Manual refresh triggered');
              
              // נקה state מקומי כדי לאלץ טעינה מחדש
              setTips([]);
              setLastFetchTime(null);
              
              // בדוק קאש או טען מחדש
              await new Promise(resolve => {
                checkAndFetchTips();
                setTimeout(resolve, 500);
              });
              
              setRefreshing(false);
            }} 
          />}
        >
          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>קטגוריות</Text>
            <Pressable
              style={[styles.allButton, selectedCategory === 'all' && styles.allButtonSelected]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[styles.allButtonText, selectedCategory === 'all' && styles.allButtonTextSelected]}>
                כל הקטגוריות
              </Text>
            </Pressable>
            <View style={styles.categoriesGrid}>
              {TIP_CATEGORIES.map(category => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory === category.id}
                  onPress={setSelectedCategory}
                />
              ))}
            </View>
          </View>

          {/* Tips */}
          <View style={styles.section}>
            <View style={styles.tipsHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'all' ? `כל הטיפים (${filteredTips.length})` : 
                 `${TIP_CATEGORIES.find(c => c.id === selectedCategory)?.title} (${filteredTips.length})`}
              </Text>
              <Pressable 
                style={styles.refreshButton} 
                onPress={() => { setLastFetchTime(null); fetchTipsFromAI(); }}
                disabled={loading}
              >
                <MaterialCommunityIcons name="refresh" size={20} color={theme.colors.primary} />
                <Text style={styles.refreshText}>הבא טיפים חדשים</Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>✨ מכין עבורך טיפים אישיים...</Text>
              </View>
            ) : filteredTips.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="lightbulb-outline" size={64} color={theme.colors.textLight} />
                <Text style={styles.emptyTitle}>🌟 הכל מוכן לטיפים חדשים</Text>
                <Text style={styles.emptySubtitle}>נסה לרענן או לבחור קטגוריה אחרת</Text>
              </View>
            ) : (
              <View style={styles.tipsContainer}>
                {filteredTips.map(tip => (
                  <TipCard 
                    key={tip.id} 
                    tip={tip} 
                    onSelect={(selected) => {
                      setSelectedTip(selected);
                      setModalVisible(true);
                    }} 
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
      
      <Modal
        transparent
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header עם גרדיאנט */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.categoryIconLarge}>
                  <MaterialCommunityIcons 
                    name={TIP_CATEGORIES.find(c => c.id === selectedTip?.category)?.icon || 'lightbulb'} 
                    size={32} 
                    color="white" 
                  />
                </View>
                <Text style={styles.modalTitle}>{selectedTip?.title}</Text>
                <Pressable
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                >
                  <MaterialCommunityIcons name="close" size={24} color="white" />
                </Pressable>
              </View>
            </View>

            {/* תוכן הטיפ בתוך ScrollView */}
            <ScrollView 
              style={styles.modalContentScrollView} 
              contentContainerStyle={styles.modalContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* סיכום */}
              {selectedTip?.summary && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSummary}>{selectedTip.summary}</Text>
                </View>
              )}

              {/* תוכן עיקרי */}
              {selectedTip?.content && (
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="text" size={20} color={theme.colors.primary} />
                    <Text style={styles.modalSectionTitle}>💡 הרעיון המרכזי</Text>
                  </View>
                  <Text style={styles.modalText}>{selectedTip.content}</Text>
                </View>
              )}

              {/* צעדים מעשיים */}
              {selectedTip?.practicalSteps && (
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="format-list-numbered" size={20} color={theme.colors.primary} />
                    <Text style={styles.modalSectionTitle}>🎯 צעדים מעשיים</Text>
                  </View>
                  <View style={styles.stepsContainer}>
                    {selectedTip.practicalSteps.split('\n').filter(step => step.trim()).map((step, index) => (
                      <View key={index} style={styles.stepItem}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step.replace(/^שלב \d+:\s*/, '')}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* דוגמה */}
              {selectedTip?.example && (
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="lightbulb-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.modalSectionTitle}>💬 דוגמה מהחיים</Text>
                  </View>
                  <View style={styles.exampleContainer}>
                    <Text style={styles.modalScientificText}>{selectedTip.example}</Text>
                  </View>
                </View>
              )}

              {/* טעויות נפוצות */}
              {selectedTip?.commonMistakes && (
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FF6B6B" />
                    <Text style={styles.modalSectionTitle}>⚠️ כדאי להימנע מ...</Text>
                  </View>
                  <View style={styles.mistakesContainer}>
                    <Text style={styles.modalScientificText}>{selectedTip.commonMistakes}</Text>
                  </View>
                </View>
              )}

              {/* בסיס מדעי */}
              {selectedTip?.scientificBasis && (
                <View style={styles.modalSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="school" size={20} color={theme.colors.primary} />
                    <Text style={styles.modalSectionTitle}>🔬 למה זה עובד?</Text>
                  </View>
                  <Text style={styles.modalScientificText}>{selectedTip.scientificBasis}</Text>
                </View>
              )}

              {/* פוטר עם פרטי המחבר */}
              <View style={styles.modalFooter}>
                <View style={styles.authorSection}>
                  <MaterialCommunityIcons name="account-tie" size={20} color={theme.colors.textLight} />
                  <Text style={styles.modalFooterText}>{selectedTip?.author}</Text>
                </View>
                <View style={styles.sourceSection}>
                  <MaterialCommunityIcons name="book-open" size={16} color={theme.colors.textLight} />
                  <Text style={styles.modalSourceText}>{selectedTip?.source}</Text>
                </View>
              </View>
            </ScrollView>

            {/* כפתורי פעולה */}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.actionButton, styles.bookmarkButton]}
                onPress={() => {
                  handleSaveTip(selectedTip);
                  setModalVisible(false);
                }}
              >
                <MaterialCommunityIcons 
                  name="bookmark-plus" 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.actionButtonText}>שמור טיפ</Text>
              </Pressable>
              
              <Pressable
                style={[styles.actionButton, styles.closeActionButton]}
                onPress={() => setModalVisible(false)}
              >
                <MaterialCommunityIcons name="check" size={20} color="white" />
                <Text style={styles.actionButtonText}>הבנתי</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </ScreenWrapper>
  );
};

export default ParentTips;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: wp(4) },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingTop: hp(3), paddingBottom: hp(2) },
  backButton: { backgroundColor: theme.colors.card, paddingVertical: hp(1), paddingHorizontal: wp(3), borderRadius: theme.radius.md },
  backText: { color: theme.colors.primary, fontSize: hp(2), fontWeight: theme.fonts.semibold },
  title: { fontSize: hp(3.2), fontWeight: theme.fonts.bold, color: theme.colors.textPrimary, textAlign: 'center' },
  
  userCard: { backgroundColor: theme.colors.primary + '15', borderRadius: theme.radius.lg, padding: wp(4), marginBottom: hp(2), borderWidth: 1, borderColor: theme.colors.primary + '30' },
  userTitle: { fontSize: hp(2.2), fontWeight: theme.fonts.bold, color: theme.colors.primary, textAlign: 'right', marginBottom: hp(0.5) },
  userInfo: { fontSize: hp(1.8), color: theme.colors.textSecondary, textAlign: 'right', marginBottom: hp(0.3) },
  editButton: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: theme.colors.card, paddingHorizontal: wp(3), paddingVertical: hp(1), borderRadius: theme.radius.md, marginTop: hp(1), borderWidth: 1, borderColor: theme.colors.primary + '30', gap: wp(1), alignSelf: 'flex-end' },
  editText: { fontSize: hp(1.6), color: theme.colors.primary, fontWeight: theme.fonts.semibold },
  
  section: { marginBottom: hp(4) },
  sectionTitle: { fontSize: hp(2.4), fontWeight: theme.fonts.bold, color: theme.colors.textPrimary, textAlign: 'right', marginBottom: hp(2) },
  
  allButton: { backgroundColor: theme.colors.card, paddingHorizontal: wp(4), paddingVertical: hp(1.5), borderRadius: theme.radius.lg, marginBottom: hp(2), borderWidth: 2, borderColor: 'transparent' },
  allButtonSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  allButtonText: { fontSize: hp(2), fontWeight: theme.fonts.semibold, color: theme.colors.primary, textAlign: 'center' },
  allButtonTextSelected: { color: theme.colors.white },
  
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: { 
    width: wp(42), 
    backgroundColor: theme.colors.card, 
    borderRadius: theme.radius.xl, 
    padding: wp(4), 
    marginBottom: hp(2), 
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  categoryCardSelected: {
    borderWidth: 2,
    backgroundColor: theme.colors.background,
  },
  categoryIconContainer: { 
    width: hp(5), 
    height: hp(5), 
    borderRadius: hp(2.5), 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: hp(1), 
    alignSelf: 'flex-end' 
  },
  categoryTitle: { 
    fontSize: hp(2), 
    fontWeight: theme.fonts.bold, 
    color: theme.colors.textPrimary, 
    textAlign: 'right', 
    marginBottom: hp(0.5) 
  },
  categoryTitleSelected: {
    color: theme.colors.primary,
  },
  categoryDescription: {
    fontSize: hp(1.6),
    color: theme.colors.textSecondary,
    textAlign: 'right',
    lineHeight: hp(2.2),
  },
  
  tipsHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: hp(2) },
  refreshButton: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: theme.colors.card, paddingHorizontal: wp(3), paddingVertical: hp(1), borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.primary + '30', gap: wp(1) },
  refreshText: { fontSize: hp(1.6), color: theme.colors.primary, fontWeight: theme.fonts.semibold },
  
  tipsContainer: { gap: hp(2) },
  tipCard: { backgroundColor: theme.colors.card, borderRadius: theme.radius.xl, padding: wp(4), borderWidth: 1, borderColor: theme.colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  tipHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: hp(1.5) },
  categoryBadge: { paddingHorizontal: wp(3), paddingVertical: hp(0.5), borderRadius: theme.radius.md },
  categoryBadgeText: { fontSize: hp(1.4), fontWeight: theme.fonts.semibold },
  tipTitle: { fontSize: hp(2.2), fontWeight: theme.fonts.bold, color: theme.colors.textPrimary, textAlign: 'right', marginBottom: hp(1) },
  tipSummary: { fontSize: hp(1.8), color: theme.colors.textSecondary, textAlign: 'right', lineHeight: hp(2.4), marginBottom: hp(2) },
  tipFooter: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  tipMeta: { 
    flexDirection: 'row-reverse', 
    alignItems: 'center', 
    gap: wp(1) 
  },
  tipAuthor: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
    marginLeft: wp(3),
  },
  tipReadTime: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  tipActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: wp(1),
  },
  tipLikes: { fontSize: hp(1.6), color: theme.colors.textLight },
  
  loadingContainer: { alignItems: 'center', paddingVertical: hp(4) },
  loadingText: { fontSize: hp(1.8), color: theme.colors.textSecondary, marginTop: hp(1) },
  emptyContainer: { alignItems: 'center', paddingVertical: hp(6) },
  emptyTitle: { fontSize: hp(2.2), fontWeight: theme.fonts.bold, color: theme.colors.textPrimary, textAlign: 'center', marginTop: hp(2) },
  emptySubtitle: { fontSize: hp(1.8), color: theme.colors.textSecondary, textAlign: 'center', marginTop: hp(1) },

modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.6)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: wp(4),
},

modalContainer: {
  width: '100%',
  maxHeight: '85%',
  backgroundColor: theme.colors.card,
  borderRadius: theme.radius.xl,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.3,
  shadowRadius: 20,
  elevation: 20,
  flexDirection: 'column',
},

modalHeader: {
  backgroundColor: theme.colors.primary,
  paddingVertical: hp(2),
  paddingHorizontal: wp(4),
},

modalHeaderContent: {
  flexDirection: 'row-reverse',
  alignItems: 'center',
  justifyContent: 'space-between',
},

categoryIconLarge: {
  width: hp(5),
  height: hp(5),
  borderRadius: hp(2.5),
  backgroundColor: 'rgba(255,255,255,0.2)',
  alignItems: 'center',
  justifyContent: 'center',
},

modalTitle: {
  flex: 1,
  fontSize: hp(2.4),
  fontWeight: theme.fonts.bold,
  color: theme.colors.textPrimary,
  textAlign: 'right',
  marginHorizontal: wp(3),
},

modalCloseButton: {
  width: hp(4),
  height: hp(4),
  borderRadius: hp(2),
  backgroundColor: 'rgba(255,255,255,0.2)',
  alignItems: 'center',
  justifyContent: 'center',
},

modalSection: {
  marginBottom: hp(2),
},

sectionHeader: {
  flexDirection: 'row-reverse',
  alignItems: 'center',
  marginBottom: hp(1),
  gap: wp(2),
},

modalSectionTitle: {
  fontSize: hp(2),
  fontWeight: theme.fonts.bold,
  color: theme.colors.textPrimary,
  textAlign: 'right',
},

modalSummary: {
  fontSize: hp(2),
  color: theme.colors.primary,
  textAlign: 'right',
  lineHeight: hp(2.6),
  fontWeight: theme.fonts.semibold,
  backgroundColor: theme.colors.primary + '10',
  padding: wp(3),
  borderRadius: theme.radius.md,
  borderRightWidth: 4,
  borderRightColor: theme.colors.primary,
},

modalText: {
  fontSize: hp(1.9),
  color: theme.colors.textPrimary,
  textAlign: 'right',
  lineHeight: hp(2.6),
},

stepsContainer: {
  gap: hp(1.5),
},

stepItem: {
  flexDirection: 'row-reverse',
  alignItems: 'flex-start',
  gap: wp(3),
},

stepNumber: {
  width: hp(3),
  height: hp(3),
  borderRadius: hp(1.5),
  backgroundColor: theme.colors.primary,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: hp(0.2),
},

stepNumberText: {
  fontSize: hp(1.4),
  fontWeight: theme.fonts.bold,
  color: theme.colors.white,
},

stepText: {
  flex: 1,
  fontSize: hp(1.8),
  color: theme.colors.textPrimary,
  textAlign: 'right',
  lineHeight: hp(2.4),
},

exampleContainer: {
  backgroundColor: '#F0F9FF',
  padding: wp(3),
  borderRadius: theme.radius.md,
  borderLeftWidth: 4,
  borderLeftColor: '#32D1C3',
},

mistakesContainer: {
  backgroundColor: '#FEF2F2',
  padding: wp(3),
  borderRadius: theme.radius.md,
  borderLeftWidth: 4,
  borderLeftColor: '#FF6B6B',
},

modalScientificText: {
  fontSize: hp(1.9),
  color: theme.colors.dark,
  textAlign: 'right',
  lineHeight: hp(2.4),
  fontStyle: 'italic',
  backgroundColor: '#F1F5F9',
  padding: wp(3),
  borderRadius: theme.radius.md,
},

modalFooter: {
  paddingTop: hp(2),
  borderTopWidth: 1,
  borderTopColor: theme.colors.border,
  marginTop: hp(2),
},

authorSection: {
  flexDirection: 'row-reverse',
  alignItems: 'center',
  gap: wp(2),
  marginBottom: hp(1),
},

sourceSection: {
  flexDirection: 'row-reverse',
  alignItems: 'center',
  gap: wp(2),
},

modalFooterText: {
  fontSize: hp(1.6),
  color: theme.colors.textPrimary,
  fontWeight: theme.fonts.medium,
},

modalSourceText: {
  fontSize: hp(1.5),
  color: theme.colors.textSecondary,
  fontStyle: 'italic',
},

modalActions: {
  flexDirection: 'row-reverse',
  justifyContent: 'space-between',
  paddingHorizontal: wp(4),
  paddingVertical: hp(2),
  borderTopWidth: 1,
  borderTopColor: theme.colors.border,
  backgroundColor: theme.colors.background,
  gap: wp(3),
  flexShrink: 0,
},

actionButton: {
  flex: 1,
  flexDirection: 'row-reverse',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: hp(1.5),
  borderRadius: theme.radius.lg,
  gap: wp(2),
},

bookmarkButton: {
  backgroundColor: '#FF6B9D',
},

closeActionButton: {
  backgroundColor: theme.colors.primary,
},

actionButtonText: {
  fontSize: hp(1.8),
  fontWeight: theme.fonts.semibold,
  color: theme.colors.white,
},

modalContentContainer: {
  padding: wp(4),
  paddingBottom: hp(1),
},
});