import React from 'react';
import { Modal, View, Text, Pressable, FlatList, StyleSheet, Animated } from 'react-native';

const prompts = [
    "מקום שאני חולם לבקר בו...",
    "השאיפות הקרייריסטיות שלי הן...",
    "מיומנות שאני רוצה ללמוד השנה היא...",
    "החלום הכי גדול שלי בחיים הוא...",
    "מטרה שאני עובד עליה עכשיו היא...",
    "הרפתקה שאני רוצה לחוות היא...",
    "פרויקט יצירתי שאני רוצה להתחיל הוא...",
    "הרגל שאני רוצה לפתח הוא...",
    "משהו שאני חוסך בשבילו הוא...",
    "אם הייתי קם בעולם שבו הייתי מפורסם, הייתי מפורסם בגלל...",
    "אני רוצה ללמוד יותר על...",
];

export default function PromptModal({ visible, onClose, onSelectPrompt }) {
  const fadeAnim = new Animated.Value(0); 

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>בחרו פרומפט</Text>
          <FlatList
            data={prompts}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelectPrompt(item)}
                style={styles.promptCard}
              >
                <Text style={styles.promptText}>{item}</Text>
              </Pressable>
            )}
          />
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>סגור</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'right',
  },
  promptCard: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#444',
  },
  promptText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'right',
  },
  closeButton: {
    marginTop: 20,
    alignSelf: 'flex-end',
  },
  closeText: {
    fontSize: 18,
    color: '#9b59b6', 
    fontWeight: 'bold',
  },
});
