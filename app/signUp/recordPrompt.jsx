import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext'; // עדכן את הנתיב לפי מיקום הקובץ האמיתי
import { uploadAudioFile } from '../../services/audioServices';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../constants/helpers/common';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function RecordPrompt() {
  const {
    fullName,
    email,
    password,
    birth_date,
    gender,
    connectionTypes,
    image,
    wantsNotifications = 'false',
    location = 'false',
    preferredMatch,
    traits,
    showTraits = 'false',
    hobbies,
    showHobbies = 'false',
    identities,
    showIdentities = 'false',
    supportNeeds,
    showSupportNeeds = 'false',
    introduction,
    prompt,
  } = useLocalSearchParams();
  const decodedPrompt = decodeURIComponent(prompt || '');

  const router = useRouter();

  const [recording, setRecording] = useState(null);
  const [recordedUri, setRecordedUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    (async () => {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('אין הרשאה', 'יש לאפשר הרשאה למיקרופון כדי להקליט');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    })();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    
    if (isRecording) return;

    try {
      console.log('Starting recording...');
      setIsRecording(true);

      const permission = await Audio.getPermissionsAsync();
      if (!permission.granted) {
        console.warn('Permission to record audio not granted');
        setIsRecording(false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri);
      setRecording(null);
      console.log('Recording stopped, saved at:', uri);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const playRecording = async () => {
    if (!recordedUri) return;

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: recordedUri });
      setSound(sound);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });

      await sound.playAsync();
    } catch (err) {
      console.error('Failed to play recording', err);
    }
  };

  const { setUserData } = useAuth(); // הוסף את זה בתוך הקומפוננטה

  const saveAndContinue = async () => {
    
    if (!recordedUri) return;
  
    try {
      const result = await uploadAudioFile(recordedUri);
  
      if (result.success) {
        const publicUrl = result.data;
  
        // 👇 כאן אתה שומר את הקישור של האודיו לזיכרון (Context)
        setUserData({ audioUrl: publicUrl });
  
        // ממשיכים לדף הבא
        router.push({
          pathname: '/signUp/status',
          params: {
            fullName,
            email,
            password,
            birth_date,
            gender,
            connectionTypes,
            image,
            wantsNotifications,
            location,
            preferredMatch,
            traits,
            showTraits,
            hobbies,
            showHobbies,
            identities,
            showIdentities,
            supportNeeds,
            showSupportNeeds,
            introduction,
            audio: publicUrl, // 👈 גם כאן תעביר את הקישור האמיתי
            prompt,
          },
        });
      } else {
        Alert.alert('שגיאה', 'לא הצלחנו להעלות את ההקלטה');
      }
    } catch (err) {
      console.error('Failed to upload audio', err);
      Alert.alert('שגיאה', 'לא הצלחנו להעלות את ההקלטה');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>חזור</Text>
          </Pressable>
          <Text style={styles.title}>הקלטה עבור: {prompt}</Text>
        </View>

        <Text style={styles.description}>
          הקליטו תשובה קולית לשאלה שבחרתם. ניתן לשמוע לפני שמירה ולהמשיך.
        </Text>

        <Animated.View entering={FadeInDown.duration(500)}>
          {isRecording ? (
            <Pressable onPress={stopRecording} style={[styles.button, styles.stopButton]}>
              <Text style={styles.buttonText}>עצור הקלטה</Text>
            </Pressable>
          ) : (
            <Pressable onPress={startRecording} style={[styles.button, styles.recordButton]}>
              <Text style={styles.buttonText}>התחל הקלטה</Text>
            </Pressable>
          )}
        </Animated.View>

        {recordedUri && (
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Pressable
              onPress={playRecording}
              style={[styles.button, styles.playButton, isPlaying && { opacity: 0.6 }]}
              disabled={isPlaying}
            >
              <Text style={styles.buttonText}>{isPlaying ? 'משמיע...' : 'השמע הקלטה'}</Text>
            </Pressable>

            <Pressable onPress={saveAndContinue} style={[styles.button, styles.saveButton]}>
              <Text style={styles.buttonText}>שמור והמשך</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: hp(7),
    paddingHorizontal: wp(6),
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(7),
    alignSelf: 'stretch',
  },
  title: {
    fontSize: hp(3),
    fontWeight: theme.fonts.bold,
    color: theme.colors.text,
    marginLeft: wp(20),
    textAlign: 'right',
    marginRight: wp(-10),
    alignSelf: 'stretch',
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(-30),
  },
  backText: {
    color: '#fff',
    fontSize: hp(2),
  },
  description: {
    fontSize: hp(2),
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: hp(-3),
    alignSelf: 'stretch',
    marginLeft: wp(10),
    marginRight: wp(5),
    marginBottom: wp(30),
  },
  button: {
    paddingVertical: hp(2),
    paddingHorizontal: wp(8),
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    marginVertical: hp(1.2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  recordButton: {
    backgroundColor: '#9b59b6',
  },
  stopButton: {
    backgroundColor: '#8e44ad',
  },
  playButton: {
    backgroundColor: '#7d3c98',
  },
  saveButton: {
    backgroundColor: '#6c3483',
  },
  buttonText: {
    color: '#fff',
    fontSize: hp(2.2),
    fontWeight: 'bold',
  },
});