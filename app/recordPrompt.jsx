import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '../constants/theme';
import { hp, wp } from '../constants/helpers/common';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function RecordPrompt() {
  const { prompt } = useLocalSearchParams();
  const router = useRouter();

  const [recording, setRecording] = useState(null);
  const [recordedUri, setRecordedUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
    })();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri);
      setRecording(null);
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

  const saveAndContinue = () => {
    router.push({
      pathname: '/prompts',
      params: { prompt, audio: recordedUri },
    });
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
    backgroundColor: '#9b59b6', // סגול בהיר
  },
  stopButton: {
    backgroundColor: '#8e44ad', // סגול בינוני
  },
  playButton: {
    backgroundColor: '#7d3c98', // סגול כהה
  },
  saveButton: {
    backgroundColor: '#6c3483', // סגול כהה יותר
  },
  buttonText: {
    color: '#fff',
    fontSize: hp(2.2),
    fontWeight: 'bold',
  },
});
