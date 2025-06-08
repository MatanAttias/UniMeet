import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MotiView } from 'moti';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../constants/helpers/common';
import Icon from '../../assets/icons';

// קטגוריות טיפים להורים
const TIP_CATEGORIES = [
  {
    id: 'communication',
    title: 'תקשורת',
    icon: 'message-text-outline',
    color: '#6B73FF',
    description: 'כיצד לתקשר עם הילד בצורה יעילה',
  },
  {
    id: 'daily_routine',
    title: 'שגרה יומיומית',
    icon: 'clock-outline',
    color: '#9C88FF',
    description: 'יצירת שגרות בריאות ויציבות',
  },
  {
    id: 'sensory',
    title: 'ויסות חושי',
    icon: 'brain',
    color: '#FF8A9B',
    description: 'כלים לוויסות חושי והרגעה',
  },
  {
    id: 'social',
    title: 'מיומנויות חברתיות',
    icon: 'account-group',
    color: '#32D1C3',
    description: 'פיתוח קשרים חברתיים',
  },
  {
    id: 'education',
    title: 'חינוך ולמידה',
    icon: 'book-open-variant',
    color: '#FFB443',
    description: 'אסטרטגיות למידה מותאמות',
  },
  {
    id: 'self_care',
    title: 'טיפול עצמי להורים',
    icon: 'heart',
    color: '#FF6B9D',
    description: 'שמירה על הבריאות הנפשית שלכם',
  },
];

// טיפים לדוגמה (בהמשך נחליף בנתונים מהשרת)
const SAMPLE_TIPS = [
  {
    id: 1,
    category: 'communication',
    title: 'שימוש בחזרות חיוביות',
    summary: 'כיצד להשתמש בחזרות כדי לחזק התנהגויות רצויות',
    content: 'חזרות חיוביות הן אחד הכלים החשובים ביותר...',
    author: 'ד"ר מירי כהן',
    readTime: '3 דקות',
    likes: 45,
    isBookmarked: false,
    createdAt: new Date(),
  },
  {
    id: 2,
    category: 'sensory',
    title: 'יצירת פינת הרגעה בבית',
    summary: 'עיצוב מרחב בטוח ומרגיע לילד',
    content: 'פינת הרגעה היא מקום שבו הילד יכול להירגע...',
    author: 'טליה רוזן',
    readTime: '5 דקות',
    likes: 62,
    isBookmarked: true,
    createdAt: new Date(),
  },
  {
    id: 3,
    category: 'daily_routine',
    title: 'בניית שגרת בוקר מוצלחת',
    summary: 'טיפים ליצירת בוקר רגוע ומאורגן',
    content: 'שגרת בוקר טובה מתחילה בערב הקודם...',
    author: 'רונית אבשלום',
    readTime: '4 דקות',
    likes: 38,
    isBookmarked: false,
    createdAt: new Date(),
  },
];

const ParentTips = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tips, setTips] = useState(SAMPLE_TIPS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // פילטור טיפים לפי קטגוריה וחיפוש
  const filteredTips = tips.filter(tip => {
    const matchesCategory = selectedCategory === 'all' || tip.category === selectedCategory;
    const matchesSearch = tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tip.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const goBack = () => router.back();

  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleTipPress = (tip) => {
    router.push({
      pathname: '/parentTips/tipDetail',
      params: { tipId: tip.id },
    });
  };

  const handleBookmarkToggle = (tipId) => {
    setTips(prevTips =>
      prevTips.map(tip =>
        tip.id === tipId ? { ...tip, isBookmarked: !tip.isBookmarked } : tip
      )
    );
  };

  const CategoryCard = ({ category, isSelected, onPress }) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 300 }}
    >
      <Pressable
        style={[
          styles.categoryCard,
          isSelected && styles.categoryCardSelected,
          { borderColor: category.color }
        ]}
        onPress={() => onPress(category.id)}
      >
        <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '20' }]}>
          <MaterialCommunityIcons
            name={category.icon}
            size={28}
            color={category.color}
          />
        </View>
        <Text style={[styles.categoryTitle, isSelected && styles.categoryTitleSelected]}>
          {category.title}
        </Text>
        <Text style={styles.categoryDescription}>
          {category.description}
        </Text>
      </Pressable>
    </MotiView>
  );

  const TipCard = ({ tip }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
    >
      <Pressable style={styles.tipCard} onPress={() => handleTipPress(tip)}>
        <View style={styles.tipHeader}>
          <View style={styles.tipCategory}>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: TIP_CATEGORIES.find(c => c.id === tip.category)?.color + '20' }
            ]}>
              <Text style={[
                styles.categoryBadgeText,
                { color: TIP_CATEGORIES.find(c => c.id === tip.category)?.color }
              ]}>
                {TIP_CATEGORIES.find(c => c.id === tip.category)?.title}
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.bookmarkButton}
            onPress={() => handleBookmarkToggle(tip.id)}
          >
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

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={goBack}>
            <Text style={styles.backText}>חזור</Text>
          </Pressable>
          <Text style={styles.title}>טיפים להורים</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={theme.colors.textLight}
            style={styles.searchIcon}
          />
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
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            // כאן נוסיף רענון נתונים מהשרת
            setTimeout(() => setRefreshing(false), 1000);
          }}
        >
          {/* Categories Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>קטגוריות</Text>
            
            {/* All Categories Button */}
            <Pressable
              style={[
                styles.allCategoriesButton,
                selectedCategory === 'all' && styles.allCategoriesButtonSelected
              ]}
              onPress={() => handleCategoryPress('all')}
            >
              <MaterialCommunityIcons
                name="view-grid"
                size={20}
                color={selectedCategory === 'all' ? theme.colors.white : theme.colors.primary}
              />
              <Text style={[
                styles.allCategoriesText,
                selectedCategory === 'all' && styles.allCategoriesTextSelected
              ]}>
                כל הקטגוריות
              </Text>
            </Pressable>

            {/* Categories Grid */}
            <View style={styles.categoriesGrid}>
              {TIP_CATEGORIES.map(category => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory === category.id}
                  onPress={handleCategoryPress}
                />
              ))}
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.section}>
            <View style={styles.tipsHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'all' 
                  ? `כל הטיפים (${filteredTips.length})`
                  : `${TIP_CATEGORIES.find(c => c.id === selectedCategory)?.title} (${filteredTips.length})`
                }
              </Text>
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearch}>נקה חיפוש</Text>
                </Pressable>
              ) : null}
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>טוען טיפים...</Text>
              </View>
            ) : filteredTips.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="lightbulb-outline"
                  size={64}
                  color={theme.colors.textLight}
                />
                <Text style={styles.emptyTitle}>אין טיפים להצגה</Text>
                <Text style={styles.emptyText}>
                  {searchQuery 
                    ? 'נסה לחפש במילים אחרות'
                    : 'נסה לבחור קטגוריה אחרת'
                  }
                </Text>
              </View>
            ) : (
              <View style={styles.tipsContainer}>
                {filteredTips.map(tip => (
                  <TipCard key={tip.id} tip={tip} />
                ))}
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
  container: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: hp(3),
    paddingBottom: hp(2),
  },
  backButton: {
    backgroundColor: theme.colors.card,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
  },
  title: {
    fontSize: hp(3.2),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: wp(15),
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    marginBottom: hp(3),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginLeft: wp(2),
  },
  searchInput: {
    flex: 1,
    fontSize: hp(2),
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  section: {
    marginBottom: hp(4),
  },
  sectionTitle: {
    fontSize: hp(2.4),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textPrimary,
    textAlign: 'right',
    marginBottom: hp(2),
  },
  allCategoriesButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderRadius: theme.radius.lg,
    marginBottom: hp(2),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  allCategoriesButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  allCategoriesText: {
    fontSize: hp(2),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.primary,
    marginRight: wp(2),
  },
  allCategoriesTextSelected: {
    color: theme.colors.white,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
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
    elevation: 3,
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
    alignSelf: 'flex-end',
  },
  categoryTitle: {
    fontSize: hp(2),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textPrimary,
    textAlign: 'right',
    marginBottom: hp(0.5),
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
  tipsHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  clearSearch: {
    fontSize: hp(1.8),
    color: theme.colors.primary,
    fontWeight: theme.fonts.semibold,
  },
  tipsContainer: {
    gap: hp(2),
  },
  tipCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: wp(4),
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tipHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.5),
  },
  categoryBadge: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.md,
  },
  categoryBadgeText: {
    fontSize: hp(1.4),
    fontWeight: theme.fonts.semibold,
  },
  bookmarkButton: {
    padding: hp(0.5),
  },
  tipTitle: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textPrimary,
    textAlign: 'right',
    marginBottom: hp(1),
    lineHeight: hp(2.8),
  },
  tipSummary: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    textAlign: 'right',
    lineHeight: hp(2.4),
    marginBottom: hp(2),
  },
  tipFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tipMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: wp(1),
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
  tipLikes: {
    fontSize: hp(1.6),
    color: theme.colors.textLight,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: hp(4),
  },
  loadingText: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    marginTop: hp(1),
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: hp(6),
  },
  emptyTitle: {
    fontSize: hp(2.2),
    fontWeight: theme.fonts.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  emptyText: {
    fontSize: hp(1.8),
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});