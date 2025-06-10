import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, TextInput, Alert, 
  ActivityIndicator, RefreshControl,
} from 'react-native';
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

// פונקציה לניקוי וניתוח JSON משופרת
const parseAIResponse = (rawResponse) => {
  console.log('Raw AI response:', rawResponse);
  
  // ניקוי בסיסי
  let cleaned = rawResponse.trim();
  
  // הסרת BOM ותווים בעייתיים
  cleaned = cleaned.replace(/^\uFEFF/, '');
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  // מציאת JSON
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No valid JSON found in AI response');
  }
  
  const jsonString = cleaned.substring(jsonStart, jsonEnd + 1);
  console.log('Extracted JSON string:', jsonString);
  
  // ניסיון parsing ראשון
  try {
    const parsed = JSON.parse(jsonString);
    
    // בדיקת תקינות המבנה
    if (!parsed.tips || !Array.isArray(parsed.tips)) {
      throw new Error('Invalid tips structure - no tips array');
    }
    
    if (parsed.tips.length === 0) {
      throw new Error('Empty tips array received');
    }
    
    return parsed;
  } catch (parseError) {
    console.error('First JSON parse failed:', parseError);
    console.error('Problematic JSON:', jsonString);
    
    // ניסיון תיקון וניתוח שני
    try {
      const fixedJson = jsonString
        .replace(/,(\s*[}\]])/g, '$1')  // הסרת פסיקים עודפים
        .replace(/\n/g, ' ')            // החלפת שורות חדשות ברווחים
        .replace(/\s+/g, ' ')           // הפחתת רווחים מרובים
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":'); // הוספת גרשיים למפתחות חסרים
      
      console.log('Attempting to parse fixed JSON:', fixedJson);
      const parsed = JSON.parse(fixedJson);
      
      if (!parsed.tips || !Array.isArray(parsed.tips)) {
        throw new Error('Fixed JSON still has invalid structure');
      }
      
      return parsed;
    } catch (secondError) {
      console.error('Second parse attempt failed:', secondError);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }
  }
};

const ParentTips = () => {
  const { user, setUserData } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [userProfileHash, setUserProfileHash] = useState('');

  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 שעות

  // הוספת debug console.log
  useEffect(() => {
    console.log('🔍 Current tips state:', tips);
    console.log('🔍 Selected category:', selectedCategory);
    console.log('🔍 Search query:', searchQuery);
    console.log('🔍 Filtered tips count:', filteredTips.length);
  }, [tips, selectedCategory, searchQuery]);

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

  // בדיקה והבאת טיפים לאחר קבלת נתונים
  useEffect(() => {
    const identities = parseJsonField(user?.identities);
    const supportNeeds = parseJsonField(user?.supportNeeds);
    console.log('🔍 Checking user data:', { identities, supportNeeds });
    if (identities.length > 0 || supportNeeds.length > 0) {
      console.log('✅ Clinical data available, fetching tips...');
      checkAndFetchTips();
    } else {
      const timer = setTimeout(() => {
        console.log('⚠️ No clinical data, fetching general tips...');
        checkAndFetchTips();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user?.identities, user?.supportNeeds]);

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
    const currentProfileHash = generateProfileHash();
    const now = Date.now();
    const shouldFetch =
      tips.length === 0 ||
      currentProfileHash !== userProfileHash ||
      !lastFetchTime ||
      (now - lastFetchTime) > CACHE_DURATION;
    if (shouldFetch) {
      console.log('🔄 Fetching new tips from AI');
      setUserProfileHash(currentProfileHash);
      fetchTipsFromAI();
    } else {
      console.log('✅ Using cached tips');
    }
  };

  const fetchTipsFromAI = async () => {
  try {
    setLoading(true);
    
    // בניית פרופיל המשתמש עם בדיקות
    const userProfile = {
      identities: parseJsonField(user?.identities) || [],
      supportNeeds: parseJsonField(user?.supportNeeds) || [],
      age: calculateAge(user?.birth_date) || 'לא ידוע',
      gender: user?.gender || 'לא צוין',
    };
    
    console.log('User profile for tips:', userProfile);

    // בדיקה שה-prompt קיים
    if (!ENHANCED_TIPS_SYSTEM_PROMPT) {
      console.error('ENHANCED_TIPS_SYSTEM_PROMPT is missing!');
      throw new Error('System prompt is missing');
    }

    // שימוש בפונקציה החדשה ליצירת הודעת משתמש מותאמת גיל
    const userMessage = createAgeAppropriateUserMessage(userProfile);
    
    // הכנת ההודעות
    const messages = [
      {
        role: 'system',
        content: ENHANCED_TIPS_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    console.log('Sending messages to OpenAI:', messages);

    // קריאה ל-API
    const aiResponse = await sendToChat(messages);
    
    console.log('AI Response received:', aiResponse);
    
    // בדיקה שיש תוכן בתגובה
    if (!aiResponse || !aiResponse.content) {
      throw new Error('AI returned empty response');
    }

    // ניתוח התגובה עם טיפול משופר בשגיאות
    const parsed = parseAIResponse(aiResponse.content);
    
    console.log('✅ Parsed AI response:', parsed);
    
    // עיבוד הטיפים
    const formattedTips = parsed.tips.map((tip, index) => ({
      id: tip.id || (index + 1).toString(),
      category: tip.category,
      title: tip.title,
      summary: tip.summary,
      content: tip.content,
      practicalSteps: tip.practicalSteps || '',
      example: tip.example || '',
      commonMistakes: tip.commonMistakes || '',
      scientificBasis: tip.scientificBasis || '',
      author: tip.author,
      source: tip.source,
      readTime: typeof tip.readTime === 'number' ? `${tip.readTime} דקות` : '5 דקות',
      likes: tip.likes || Math.floor(Math.random() * 30) + 10,
      isBookmarked: false,
      createdAt: new Date().toISOString(),
    }));

    // וידוא שיש 6 טיפים
    if (formattedTips.length < 6) {
      console.warn(`Received only ${formattedTips.length} tips instead of 6`);
      const fallbackTips = generateFallbackTips(userProfile.identities, userProfile.supportNeeds);
      const missingCount = 6 - formattedTips.length;
      const additionalTips = fallbackTips.slice(formattedTips.length, formattedTips.length + missingCount);
      formattedTips.push(...additionalTips);
    }

    setTips(formattedTips);
    setLastFetchTime(Date.now());
    console.log('✅ Tips fetched successfully:', formattedTips.length);
    
  } catch (err) {
    console.error('Error fetching tips:', err);
    console.error('Error details:', err.message);
    console.error('Stack trace:', err.stack);
    
    // במקרה של שגיאה, נטען טיפים מקומיים
    const fallbackTips = generateFallbackTips(
      parseJsonField(user?.identities) || [], 
      parseJsonField(user?.supportNeeds) || []
    );
    
    console.log('🔄 Using fallback tips:', fallbackTips);
    setTips(fallbackTips);
    setLastFetchTime(Date.now());
    
    // הודעת שגיאה ידידותית יותר
    Alert.alert(
      'שגיאה בטעינת טיפים', 
      'נטענו טיפים כלליים. נסה לרענן מאוחר יותר.',
      [{ text: 'אישור', style: 'default' }]
    );
  } finally {
    setLoading(false);
  }
};

// שיפור של parseAIResponse עם טיפול טוב יותר בשגיאות
const parseAIResponse = (rawResponse) => {
  console.log('Raw AI response:', rawResponse);
  
  if (!rawResponse || typeof rawResponse !== 'string') {
    throw new Error('Invalid response: expected string, got ' + typeof rawResponse);
  }
  
  // ניקוי בסיסי
  let cleaned = rawResponse.trim();
  
  // הסרת BOM ותווים בעייתיים
  cleaned = cleaned.replace(/^\uFEFF/, '');
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  // מציאת JSON - חיפוש גמיש יותר
  let jsonStart = cleaned.indexOf('{');
  let jsonEnd = cleaned.lastIndexOf('}');
  
  // אם לא מצאנו, ננסה לחפש array
  if (jsonStart === -1) {
    jsonStart = cleaned.indexOf('[');
    jsonEnd = cleaned.lastIndexOf(']');
  }
  
  if (jsonStart === -1 || jsonEnd === -1) {
    // ננסה לבדוק אם כל התוכן הוא JSON
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return { tips: parsed };
      }
      return parsed;
    } catch {
      throw new Error('No valid JSON found in AI response');
    }
  }
  
  const jsonString = cleaned.substring(jsonStart, jsonEnd + 1);
  console.log('Extracted JSON string:', jsonString.substring(0, 200) + '...');
  
  try {
    const parsed = JSON.parse(jsonString);
    
    // טיפול במקרה שה-JSON הוא array ישיר
    if (Array.isArray(parsed)) {
      return { tips: parsed };
    }
    
    // בדיקת תקינות המבנה
    if (!parsed.tips || !Array.isArray(parsed.tips)) {
      throw new Error('Invalid tips structure - no tips array');
    }
    
    if (parsed.tips.length === 0) {
      throw new Error('Empty tips array received');
    }
    
    return parsed;
  } catch (parseError) {
    console.error('JSON parse failed:', parseError);
    
    // ניסיון תיקון אוטומטי
    try {
      // תיקונים שונים
      let fixedJson = jsonString
        .replace(/,(\s*[}\]])/g, '$1')  // הסרת פסיקים עודפים
        .replace(/\n/g, ' ')            // החלפת שורות חדשות
        .replace(/\t/g, ' ')            // החלפת טאבים
        .replace(/\s+/g, ' ')           // הפחתת רווחים מרובים
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // הוספת גרשיים למפתחות
        .replace(/:\s*'([^']*)'/g, ': "$1"')     // החלפת גרשיים בודדים לכפולים
        .replace(/\\'/g, "'");          // תיקון גרשיים בתוך טקסט
      
      console.log('Attempting to parse fixed JSON...');
      const parsed = JSON.parse(fixedJson);
      
      if (Array.isArray(parsed)) {
        return { tips: parsed };
      }
      
      if (!parsed.tips || !Array.isArray(parsed.tips)) {
        throw new Error('Fixed JSON still has invalid structure');
      }
      
      return parsed;
    } catch (secondError) {
      console.error('Second parse attempt failed:', secondError);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }
  }
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

  // מעבירים את החישוב ל-useMemo או משתנה
  const filteredTips = tips.filter((tip) => {
    if (!tip) return false;
    
    const matchesCategory = selectedCategory === 'all' || tip.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      (tip.title && tip.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tip.summary && tip.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
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

  const TipCard = ({ tip }) => {
  if (!tip) return null;
  
  const category = TIP_CATEGORIES.find(c => c.id === tip.category);
  
  return (
    <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }}>
      <Pressable 
        style={styles.tipCard} 
        onPress={() => {
          // הצגת כל המידע של הטיפ
          Alert.alert(
            tip.title,
            `${tip.content}\n\n` +
            (tip.practicalSteps ? `צעדים מעשיים:\n${tip.practicalSteps}\n\n` : '') +
            (tip.example ? `דוגמה:\n${tip.example}\n\n` : '') +
            (tip.commonMistakes ? `טעויות נפוצות:\n${tip.commonMistakes}\n\n` : '') +
            (tip.scientificBasis ? `בסיס מדעי:\n${tip.scientificBasis}\n\n` : '') +
            `מחבר: ${tip.author}\nמקור: ${tip.source}`,
            [{ text: 'סגור', style: 'default' }],
            { cancelable: true }
          );
        }}
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
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>חזור</Text>
          </Pressable>
          <Text style={styles.title}>טיפים מקצועיים</Text>
          <View style={{ width: wp(15) }} />
        </View>

        {/* User Info */}
        {user && (
          <View style={styles.userCard}>
            <Text style={styles.userTitle}>טיפים עבור: {user.name}</Text>
            <Text style={styles.userInfo}>
              {parseJsonField(user.identities).length > 0 ? 
                `זהויות: ${parseJsonField(user.identities).join(', ')}` : 
                'זהויות: לא צוינו'}
            </Text>
            <Text style={styles.userInfo}>
              {parseJsonField(user.supportNeeds).length > 0 ? 
                `צרכי תמיכה: ${parseJsonField(user.supportNeeds).slice(0, 2).join(', ')}${parseJsonField(user.supportNeeds).length > 2 ? '...' : ''}` : 
                'צרכי תמיכה: לא צוינו'}
            </Text>
            <Pressable style={styles.editButton} onPress={() => router.push('/editProfile')}>
              <MaterialCommunityIcons name="pencil" size={16} color={theme.colors.primary} />
              <Text style={styles.editText}>עדכן פרופיל</Text>
            </Pressable>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="חפש טיפים..."
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            setLastFetchTime(null);
            fetchTipsFromAI().finally(() => setRefreshing(false));
          }} />}
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

          {/* Debug Info - רק בזמן פיתוח */}
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>Debug: טיפים כולל {tips.length}, מוצגים {filteredTips.length}</Text>
            <Text style={styles.debugText}>קטגוריה נבחרה: {selectedCategory}</Text>
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
                <Text style={styles.refreshText}>רענן</Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>טוען טיפים...</Text>
              </View>
            ) : filteredTips.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="lightbulb-outline" size={64} color={theme.colors.textLight} />
                <Text style={styles.emptyTitle}>אין טיפים להצגה</Text>
                <Text style={styles.emptySubtitle}>נסה לרענן או לבחור קטגוריה אחרת</Text>
              </View>
            ) : (
              <View style={styles.tipsContainer}>
                {filteredTips.map(tip => <TipCard key={tip.id} tip={tip} />)}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
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
  
  searchContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, paddingHorizontal: wp(4), paddingVertical: hp(1.5), marginBottom: hp(3), borderWidth: 1, borderColor: theme.colors.border },
  searchInput: { flex: 1, fontSize: hp(2), color: theme.colors.textPrimary, textAlign: 'right', marginRight: wp(2) },
  
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
  
  debugContainer: {
    backgroundColor: theme.colors.card,
    padding: wp(3),
    marginBottom: hp(2),
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  debugText: {
    fontSize: hp(1.4),
    color: '#FFA500',
    textAlign: 'right',
    marginBottom: hp(0.5),
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
});