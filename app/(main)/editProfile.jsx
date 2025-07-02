import React, { useEffect, useState, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Switch,
  Platform,
  Animated,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import ScreenWrapper from '../../components/ScreenWrapper';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import Input from '../../components/input';
import Button from '../../components/Button';
import Icon from '../../assets/icons';
import { theme } from '../../constants/theme';
import { hp, wp } from '../../constants/helpers/common';
import { supabase } from '../../lib/supabase';
import { updateUser } from '../../services/userService';
import { uploadFile } from '../../services/imageService';
import { useAuth } from '../../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons,Entypo } from '@expo/vector-icons';
import { Modal, TouchableOpacity } from 'react-native';
import PromptModal from '../../components/PromptModal';
import { uploadAudioFile } from '../../services/audioServices';
import { Audio } from 'expo-av';

export default function EditProfile() {
  const { user: currentUser, setUserData } = useAuth();
  const router = useRouter();
  const [connectionTypes, setConnectionTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isTraitsModalVisible, setTraitsModalVisible] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    address: '',
    bio: '',
    image: '',
    birth_date: '',
    gender: '',
    connectionTypes: [],
    wantsNotifications: false,
    preferredMatch: '',
    traits: [],
    showTraits: false,
    hobbies: [],
    showHobbies: false,
    identities: [],
    showIdentities: false,
    supportNeeds: [],
    showSupportNeeds: false,
    introduction: '',
    audio: '',
    prompt: '',
    status: '',
  });
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [selectedGender, setSelectedGender] = useState(form.gender || '');
  
  const [isIdentitiesModalVisible, setIdentitiesModalVisible] = useState(false);
  const [searchIdentity, setSearchIdentity] = useState('');
  const [selectedIdentities, setSelectedIdentities] = useState(form.identities || []);
    
  


  useEffect(() => {
    if (!currentUser) return;
  
    const connectionTypesArray = typeof currentUser.connectionTypes === 'string'
      ? currentUser.connectionTypes.split(',').map(s => s.trim())
      : Array.isArray(currentUser.connectionTypes)
        ? currentUser.connectionTypes
        : [];
  
    const hobbiesArray = typeof currentUser.hobbies === 'string'
      ? currentUser.hobbies.split(',').map(s => s.trim())
      : Array.isArray(currentUser.hobbies)
        ? currentUser.hobbies
        : [];
  
    setForm({
      name: currentUser.name || '',
      phoneNumber: currentUser.phoneNumber || '',
      email: currentUser.email || '',
      address: currentUser.address || '',
      bio: currentUser.bio || '',
      image: currentUser.image || '',
      birth_date: currentUser.birth_date || '',
      gender: currentUser.gender || '',
      connectionTypes: connectionTypesArray,
      wantsNotifications: typeof currentUser.wantsNotifications === 'boolean' ? currentUser.wantsNotifications : false,
      preferredMatch: currentUser.preferredMatch || '',
      traits: Array.isArray(currentUser.traits) ? currentUser.traits : [],
      showTraits: typeof currentUser.showTraits === 'boolean' ? currentUser.showTraits : false,
      hobbies: hobbiesArray,
      showHobbies: typeof currentUser.showHobbies === 'boolean' ? currentUser.showHobbies : false,
      identities: Array.isArray(currentUser.identities) ? currentUser.identities : [],
      showIdentities: typeof currentUser.showIdentities === 'boolean' ? currentUser.showIdentities : false,
      supportNeeds: Array.isArray(currentUser.supportNeeds) ? currentUser.supportNeeds : [],
      showSupportNeeds: typeof currentUser.showSupportNeeds === 'boolean' ? currentUser.showSupportNeeds : false,
      introduction: currentUser.introduction || '',
      audio: currentUser.audio || '',
      prompt: currentUser.prompt || '',
      status: currentUser.status || '',
    });
    if (currentUser) {
      setSelectedIdentities(Array.isArray(currentUser.identities)
        ? currentUser.identities
        : currentUser.identities?.split(',').map(i => i.trim()) || []
      );
    }
    setConnectionTypes(connectionTypesArray);
    setSelectedHobbies(hobbiesArray);
  }, [currentUser]);

 
  const selectGender = (gender) => {
    setForm(f => ({ ...f, gender }));
    setGenderModalVisible(false);
  };
  const onPickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('שגיאה', 'נדרש אישור לגישה לגלריה');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (asset?.uri) {
        setForm(f => ({ ...f, image: asset.uri }));
      }
    } catch (e) {
      console.error('Image picker error:', e);
      Alert.alert('שגיאה', e.message || 'אירעה תקלה בעת בחירת תמונה');
    }
  };
  const [isHobbiesModalVisible, setHobbiesModalVisible] = useState(false);
  const [selectedHobbies, setSelectedHobbies] = useState(form.hobbies || []);
  const [searchHobby, setSearchHobby] = useState('');
  
  const HOBBIES = [
    'איפור',
    'אופניים',
    'אסטרונומיה',
    'אמנות',
    'בישול ואפייה',
    'בינג\' בנטפליקס',
    'גינון',
    'השקעות',
    'טניס',
    'טיולים',
    'יוגה ומדיטציה',
    'כדורגל',
    'כדורסל',
    'כתיבה',
    'לימוד שפות',
    'מוזיקה',
    'נגינה על כלי נגינה',
    'משחקי קלפים',
    'משחקי וידאו',
    'סדרה טובה',
    'ספורט',
    'עיצוב פנים',
    'פודקאסטים',
    'צילום',
    'ציור',
    'קריאת ספרים',
    'קוסמטיקה',
    'ריקוד',
    'ריצה',
    'שחמט',
    'שחייה',
    'שירה',
  ];

  const IDENTITY_TRAITS = [
    'אוטיזם',
    'אפילפסיה',
    'דיכאון',
    'דיסלקציה',
    'דיספרקסיה',
    'הפרעה דו-קוטבית',
    'OCD (הפרעה כפייתית-טורדנית)',
    'הפרעת חרדה',
    'ADHD (הפרעת קשב וריכוז)',
    'כאב כרוני',
    'לקות ראייה',
    'לקות שמיעה',
    'לקות תנועה',
    'מוגבלות שכלית התפתחותית',
    'תסמונת דאון',
    'תסמונת טורט',
    'תסמונת SLO – Smith Lemli Optiz',
  ];
  
  const SUPPORT_NEEDS = [
    'גישה לשפת סימנים',
    'גיבוי במלווה/מדריך',
    'גידור תנועה וסיוע בהליכה',
    'הגנה מרעשים חזקים',
    'הגנה מטריגרים רגשיים',
    'העדפה להודעות כתובות',
    'הסברים פשוטים וקצרים',
    'התמודדות עם כאב מתמשך',
    'זמן תגובה מותאם',
    'ליווי של מלווה/מדריך',
    'מרחבים שקטים ונינוחים',
    'עזרה בריכוז וקשב',
    'עזרי ויסות חושי',
    'הפסקות יזומות',
    'שמירה על סדר וארגון',
    'שמירה על שגרה קבועה',
    'תכנון חזותי של היום',
    'תמיכה בתקשורת אלטרנטיבית',
    'תמיכה רגשית וליווי',
  ];


const [isSupportNeedsModalVisible, setSupportNeedsModalVisible] = useState(false);
const [searchSupportNeed, setSearchSupportNeed] = useState('');
const [selectedSupportNeeds, setSelectedSupportNeeds] = useState(form.supportNeeds || []);


const filteredSupportNeeds = SUPPORT_NEEDS.filter(need =>
  need.toLowerCase().includes(searchSupportNeed.toLowerCase())
);
  const filteredHobbies = HOBBIES.filter((hobby) =>
    hobby.includes(searchHobby.trim())

  );
  
  useEffect(() => {
    setForm(f => ({ ...f, hobbies: selectedHobbies }));
  }, [selectedHobbies]);

  const animatePress2 = hobby => {
    Animated.sequence([
      Animated.timing(animationRefs.current[hobby], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animationRefs.current[hobby], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const toggleSupportNeed = (need) => {
    if (selectedSupportNeeds.includes(need)) {
      setSelectedSupportNeeds(prev => prev.filter(n => n !== need));
    } else if (selectedSupportNeeds.length < 5) {
      setSelectedSupportNeeds(prev => [...prev, need]);
    } else {
      Alert.alert('מקסימום צרכים', 'ניתן לבחור עד 5 צרכים בלבד');
    }
  };

  const toggleHobby = hobby => {
    setSelectedHobbies(prev => {
      if (prev.includes(hobby)) {
        return prev.filter(h => h !== hobby);
      } else if (prev.length < 5) {
        return [...prev, hobby];
      }
      return prev;
    });
  };

  const handleCommaSeparatedChange = (field, text) => {
    const arr = text
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    setForm(f => ({ ...f, [field]: arr }));
  }

  const filteredIdentities = IDENTITY_TRAITS.filter(identity =>
    identity.toLowerCase().includes(searchIdentity.toLowerCase())
  );

  useEffect(() => {
    const raw = currentUser?.connectionTypes;
  
      
  
    if (Array.isArray(raw)) {
      setConnectionTypes(raw);
      return;
    }
  
    if (typeof raw === 'string') {
      if (raw.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setConnectionTypes(parsed);
            return;
          }
        } catch (error) {
          console.warn('JSON parsing failed, falling back to comma-split');
        }
      }
  
      const values = raw.split(',').map(s => s.trim()).filter(Boolean);
      setConnectionTypes(values);
      return;
    }
  
    setConnectionTypes([]);
  }, [currentUser]);
  
  const preferredMatchOptions = ['נשים', 'גברים'];

  

  const onSubmit = async () => {
    setLoading(true);
    try {
      const connectionTypesString = form.connectionTypes
         .map(type => type.trim())         
        .filter(type => type !== '')      
        .join(',');                      

      let imageUrl = form.image;

      if (form.image && form.image.startsWith('file://')) {
        const uploadRes = await uploadFile('profiles', form.image, true);
        if (!uploadRes.success) throw new Error('העלאת התמונה נכשלה');
        imageUrl = uploadRes.data;

        const { error: imgErr } = await supabase
          .from('users')
          .update({ connectionTypes: form.connectionTypes.join(','),
            image: imageUrl })
          .eq('id', currentUser.id);
        if (imgErr) throw imgErr;
      }

      const { success, error } = await updateUser(currentUser.id, {
        ...form,
        connectionTypes: connectionTypesString, 
        image: imageUrl,
      });
      if (!success) throw new Error(error || 'עדכון המשתמש נכשל');

      setUserData(u => ({ ...u, ...form, image: imageUrl }));
      Alert.alert('הצלחה', 'הפרופיל עודכן בהצלחה');
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('שגיאה', e.message || 'שגיאה בעדכון הפרופיל');
    } finally {
      setLoading(false);
    }
  };
  
  const TRAITS = [
    'אופטימי/ת',
    'אכפתי/ת',
    'אמפתי/ת',
    'אסרטיבי/ת',
    'בעל/ת חוש הומור',
    'זקוק/ה לשגרה',
    'חברותי/ת',
    'יוזם/ת',
    'יציב/ה רגשית',
    'יצירתי/ת',
    'מחפש/ת עצמאות',
    'ממוקד/ת במשימה',
    'מעודד/ת',
    'משפחתי/ת',
    'מתלהב/ת מלמידה חדשה',
    'מתמודד/ת עם שינויים',
    'מתמצא/ת בטכנולוגיה',
    'סבלני/ת',
    'ספונטני/ת',
    'רגיש/ה חושית',
    'תומך/ת',
  ];
  
  
const [selectedTraits, setSelectedTraits] = useState(form.traits || []);
const [searchTerm, setSearchTerm] = useState('');




const animationRefs = useRef(
  [...TRAITS, ...HOBBIES].reduce((acc, item) => {
    acc[item] = new Animated.Value(1);
    return acc;
  }, {})
);

const toggleIdentity = (identity) => {
  if (selectedIdentities.includes(identity)) {
    setSelectedIdentities(selectedIdentities.filter(i => i !== identity));
  } else if (selectedIdentities.length < 5) {
    setSelectedIdentities([...selectedIdentities, identity]);
  } else {
    Alert.alert('מקסימום זהויות', 'ניתן לבחור עד 5 זהויות בלבד');
  }
};
const toggleTrait = (trait) => {
  if (selectedTraits.includes(trait)) {
    setSelectedTraits(selectedTraits.filter(t => t !== trait));
  } else if (selectedTraits.length < 5) {
    setSelectedTraits([...selectedTraits, trait]);
  } else {
    Alert.alert('מקסימום תכונות', 'ניתן לבחור עד 5 תכונות בלבד');
  }
};

const animatePress = (trait) => {
  Animated.sequence([
    Animated.timing(animationRefs.current[trait], {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.spring(animationRefs.current[trait], {
      toValue: 1,
      useNativeDriver: true,
    }),
  ]).start();
};

useEffect(() => {
  SUPPORT_NEEDS.forEach(need => {
    animationRefs.current[need] = new Animated.Value(1);
  });
}, []);
useEffect(() => {
  IDENTITY_TRAITS.forEach(identity => {
    animationRefs.current[identity] = new Animated.Value(1);
  });
}, []);

const filteredTraits = TRAITS.filter(trait =>
  trait.toLowerCase().includes(searchTerm.toLowerCase())
);
const goBack = () => router.back();

const [modalVisible, setModalVisible] = useState(false);
const [selectedStatus, setSelectedStatus] = useState(form.status || '');
const [promptModalVisible, setPromptModalVisible] = useState(false);

const [recordingModalVisible, setRecordingModalVisible] = useState(false);
const [recording, setRecording] = useState(null);
const [recordedUri, setRecordedUri] = useState(null);
const [sound, setSound] = useState(null);
const [isRecording, setIsRecording] = useState(false);
const [isPlaying, setIsPlaying] = useState(false);
const [isEnabled, setIsEnabled] = useState(false)
const toggleSwitch = () => setIsEnabled(previousState => !previousState);
const toggleTraitsSwitch = () => setIsEnabled(previousState => !previousState);


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
    

  const saveAndContinue = async () => {
    if (!recordedUri) return;

    try {
      const result = await uploadAudioFile(recordedUri);

      if (result.success) {
        const publicUrl = result.data;
        setUserData({ audioUrl: publicUrl });
        setRecordingModalVisible(false);
      }
    } catch (error) {
      console.error('Failed to upload and save audio', error);
    }
  };


const PromptCard = ({ icon, onPress }) => (
  <Pressable style={styles.card} onPress={onPress}>
    <View style={styles.icon}>{icon}</View>
    <View>
      <Text style={styles.selectText}>בחרו פרומפט</Text>
      <Text style={styles.recordText}>והקליטו את התשובה שלכם</Text>
    </View>
    <Entypo name="plus" size={20} color="white" style={styles.plusIcon} />
  </Pressable>
);

const handlePromptSelected = (selected) => {
  setForm(f => ({ ...f, prompt: selected }));
  setModalVisible(false); 
};

const openModal = () => {
  setModalVisible(true);
};

const onSelectStatus = (status) => {
  setSelectedStatus(status);
};

const onSave = () => {
  setForm(f => ({ ...f, status: selectedStatus }));
  setModalVisible(false);
};

const onCancel = () => {
  setModalVisible(false);
};

  return (
    <ScreenWrapper bg={theme.colors.background}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ gap: hp(3) }}>
          <Header title="עריכת פרופיל" />

          <View style={styles.avatarContainer}>
            <Avatar uri={form.image} size={hp(12)} rounded={hp(6)} />
            <Pressable style={styles.cameraIcon} onPress={onPickImage}>
              <Icon
                name="camera"
                size={24}
                strokeWidth={2}
                color={theme.colors.textPrimary}
              />
            </Pressable>
          </View>

          <Text style={styles.subtext}>אנא מלא/י את פרטי הפרופיל שלך</Text>

          {/* טקסט בסיסי */}
          <Input
            icon={<Icon name="user" size={24} color={theme.colors.textLight} />}
            placeholder="הכנס/י את שמך"
            value={form.name}
            onChangeText={v => setForm(f => ({ ...f, name: v }))}
          />

          <Input
            icon={<Icon name="mail" size={24} color={theme.colors.textLight} />}
            placeholder="הכנס/י אימייל"
            value={form.email}
            onChangeText={v => setForm(f => ({ ...f, email: v }))}
          />

          <View style={{ gap: 6, alignItems: 'flex-end' }}>
            <Text style={[styles.switchLabel, { textAlign: 'right', writingDirection: 'rtl' }]}>
              תאריך לידה
            </Text>

            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.dateInput,
                {
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                },
              ]}
            >
              <Text
                style={{
                  color: form.birth_date ? theme.colors.textPrimary : theme.colors.textLight,
                  textAlign: 'right',
                  writingDirection: 'rtl',
                  flex: 1,
                }}
              >
                {form.birth_date
                  ? new Date(form.birth_date).toLocaleDateString('he-IL')
                  : 'בחר תאריך'}
              </Text>

              <Ionicons name="calendar-outline" size={20} color={theme.colors.textLight} />
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={form.birth_date ? new Date(form.birth_date) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                {...(Platform.OS === 'ios' ? { themeVariant: 'light' } : {})}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    const iso = selectedDate.toISOString().split('T')[0];
                    setForm(f => ({ ...f, birth_date: iso }));
                  }
                }}
                maximumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { textAlign: 'center', writingDirection: 'rtl' }]}>
            בחר מין
          </Text>

          {['זכר', 'נקבה'].map(g => (
            <TouchableOpacity
              key={g}
              style={[
                styles.genderOption,
                form.gender === g && styles.genderOptionSelected,
                { flexDirection: 'row-reverse', justifyContent: 'flex-start' }
              ]}
              onPress={() => selectGender(g)}
            >
              <Text
                style={[
                  styles.genderOptionText,
                  form.gender === g && styles.genderOptionTextSelected,
                  { textAlign: 'right', writingDirection: 'rtl' }
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}

        </View>

          <Modal
            transparent
            visible={genderModalVisible}
            animationType="fade"
            onRequestClose={() => setGenderModalVisible(false)}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setGenderModalVisible(false)}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>בחר מין</Text>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => selectGender('זכר')}
                >
                  <Text style={styles.modalOptionText}>זכר</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => selectGender('נקבה')}
                >
                  <Text style={styles.modalOptionText}>נקבה</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>

          {/* connectionTypes - רשימה */}
          
         <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { textAlign: 'center', writingDirection: 'rtl' }]}>בחר סוג קשר</Text>
            {['חברויות', 'דייטים'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.genderOption, form.connectionTypes.includes(type) && styles.genderOptionSelected, { flexDirection: 'row-reverse', justifyContent: 'flex-start' }]}
                onPress={() => {
                  setForm(f => {
                    const current = f.connectionTypes;
                    const updated = current.includes(type)
                      ? current.filter(t => t !== type)
                      : [...current, type];
                    return { ...f, connectionTypes: updated };
                  });
                }}
              >
                <Text
                  style={[styles.genderOptionText, form.connectionTypes.includes(type) && styles.genderOptionTextSelected, { textAlign: 'right', writingDirection: 'rtl' }]}
                >{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

         

         

          {/* preferredMatch */}
          <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { textAlign: 'center', writingDirection: 'rtl' }]}>העדפת התאמה</Text>
          {preferredMatchOptions.map(option => (
            <TouchableOpacity
              key={option}
              style={[
                styles.genderOption,
                form.preferredMatch === option && styles.genderOptionSelected,
                { flexDirection: 'row-reverse', justifyContent: 'flex-start' }
              ]}
              onPress={() => {
                setForm(f => ({ ...f, preferredMatch: option }));
              }}
            >
              <Text
                style={[
                  styles.genderOptionText,
                  form.preferredMatch === option && styles.genderOptionTextSelected,
                  { textAlign: 'right', writingDirection: 'rtl' }
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>




        {/*traits*/}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>הצג תכונות בפרופיל</Text>
          <Switch
                  value={form.showTraits}
                  onValueChange={v => setForm(f => ({ ...f, showTraits: v }))}
                />
        </View>


        {form.showTraits && (
        <>
        <Pressable
          onPress={() => setTraitsModalVisible(true)}
          style={styles.selectTraitsButton}
        >
          <Text style={styles.selectTraitsText}>בחר תכונות</Text>
        </Pressable>
        {form.traits.length > 0 && (
          <View style={styles.traitsPreviewContainer}>
            {form.traits.map(trait => (
              <View key={trait} style={styles.traitTag}>
                <Text style={styles.traitTagText}>{trait}</Text>
              </View>
            ))}
          </View>
        )}
      </>
        )}
        <Modal
              visible={isTraitsModalVisible}
              animationType="slide"
              backdropColor="#0000" 
              transparent={false} 
              onRequestClose={() => setTraitsModalVisible(false)}
            >
          <Pressable onPress={goBack} style={styles.backButton}>
            <Text style={styles.backText}>חזור</Text>
          </Pressable>
          <View style={styles.modalContainer}>
            
          <TextInput
              placeholder="חפש תכונה..."
              placeholderTextColor="#aaa"  
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={[styles.input, { color: 'white' }]}
            />

            <Text style={styles.counterText}>
              {selectedTraits.length} / 5 תכונות נבחרו
            </Text>

            <ScrollView contentContainerStyle={styles.traitsContainer}>
              {filteredTraits.map((trait) => (
                <Animated.View
                  key={trait}
                  style={[
                    styles.trait,
                    selectedTraits.includes(trait) && styles.traitSelected,
                    { transform: [{ scale: animationRefs.current[trait] }] },
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      animatePress(trait);
                      toggleTrait(trait);
                    }}
                  >
                    <Text
                      style={[
                        styles.traitText,
                        selectedTraits.includes(trait) && styles.traitTextSelected,
                      ]}
                    >
                      {trait}
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>

            <Pressable
              style={styles.fancyButton}
              onPress={() => {
                setForm(f => ({ ...f, traits: selectedTraits }));
                setTraitsModalVisible(false);
              }}
            >
              <Text style={styles.fancyText}>שמור</Text>
            </Pressable>
          </View>
        </Modal>
        


    {/* hobbies */}
    <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>הצג תחביבים בפרופיל</Text>
          <Switch
           value={form.showHobbies}
           onValueChange={v => setForm(f => ({ ...f, showHobbies: v }))}
          />
        </View>

        {form.showHobbies && (
          <>
            <Pressable
              onPress={() => setHobbiesModalVisible(true)}
              style={styles.selectTraitsButton}
            >
              <Text style={styles.selectTraitsText}>בחר תחביבים</Text>
            </Pressable>
            {form.hobbies.length > 0 && (
              <View style={styles.traitsPreviewContainer}>
                {form.hobbies.map(hobby => (
                  <View key={hobby} style={styles.traitTag}>
                    <Text style={styles.traitTagText}>{hobby}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
        
       <Modal
          visible={isHobbiesModalVisible}
          animationType="slide"
          transparent={false}
          backdropColor="#0000" 
          onRequestClose={() => setHobbiesModalVisible(false)}
        >
    <Pressable onPress={() => setHobbiesModalVisible(false)} style={styles.backButton}>
      <Text style={styles.backText}>חזור</Text>
    </Pressable>
          <View style={styles.modalContainer}>
    
   

    <TextInput
      placeholder="חפש תחביב או כתוב בעצמך..."
      placeholderTextColor="#aaa"
      value={searchHobby}
      onChangeText={setSearchHobby}
      style={styles.input}
      textAlign="right"
    />

    <Text style={styles.counterText}>
      {selectedHobbies.length} / 5 תחביבים נבחרו
    </Text>

    <ScrollView contentContainerStyle={styles.traitsContainer}>
        {filteredHobbies.map(hobby => (
          <Animated.View
            key={hobby}
            style={[
              styles.trait,
              selectedHobbies.includes(hobby) && styles.traitSelected,
              { transform: [{ scale: animationRefs.current[hobby] }] },
            ]}
          >
            <Pressable
              onPress={() => {
                animatePress2(hobby);
                toggleHobby(hobby);
              }}
            >
              <Text style={styles.traitText}>{hobby}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
      <Pressable
        style={styles.fancyButton}
        onPress={() => {
          setForm(f => ({ ...f, hobbies: selectedHobbies }));
          setHobbiesModalVisible(false);
        }}
      >
        <Text style={styles.fancyText}>שמור</Text>
      </Pressable>
      </View>
    </Modal>




              {/* identities */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>הצג זהויות בפרופיל</Text>
                <Switch
                  value={form.showIdentities}
                  onValueChange={v => setForm(f => ({ ...f, showIdentities: v }))}
                />
              </View>

              {form.showIdentities && (
                <>
                  <Pressable
                    onPress={() => setIdentitiesModalVisible(true)}
                    style={styles.selectTraitsButton}
                  >
                    <Text style={styles.selectTraitsText}>בחר זהויות</Text>
                  </Pressable>
                  {form.identities.length > 0 && (
                    <View style={styles.traitsPreviewContainer}>
                      {form.identities.map(identity => (
                        <View key={identity} style={styles.traitTag}>
                          <Text style={styles.traitTagText}>{identity}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

            <Modal
            visible={isIdentitiesModalVisible}
            animationType="slide"
            backdropColor="#0000" 
            transparent={false}
            onRequestClose={() => setIdentitiesModalVisible(false)}
            >
            <Pressable onPress={() => setIdentitiesModalVisible(false)} style={styles.backButton}>
              <Text style={styles.backText}>חזור</Text>
            </Pressable>

            <View style={styles.modalContainer}>
              <TextInput
                placeholder="חפש זהות או כתוב בעצמך..."
                placeholderTextColor="#aaa"
                value={searchIdentity}
                onChangeText={setSearchIdentity}
                style={styles.input}
                textAlign="right"
              />

              <Text style={styles.counterText}>
                {selectedIdentities.length} / 5 זהויות נבחרו
              </Text>

              <ScrollView contentContainerStyle={styles.traitsContainer}>
                {filteredIdentities.map(identity => (
                  <Animated.View
                    key={identity}
                    style={[
                      styles.trait,
                      selectedIdentities.includes(identity) && styles.traitSelected,
                      { transform: [{ scale: animationRefs.current[identity] }] },
                    ]}
                  >
                    <Pressable
                      onPress={() => {
                        animatePress2(identity);
                        toggleIdentity(identity);
                      }}
                    >
                      <Text style={styles.traitText}>{identity}</Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>

              <Pressable
                style={styles.fancyButton}
                onPress={() => {
                  setForm(f => ({ ...f, identities: selectedIdentities }));
                  setIdentitiesModalVisible(false);
                }}
              >
                <Text style={styles.fancyText}>שמור</Text>
              </Pressable>
            </View>
            </Modal>
      
              {/* supportNeeds */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>הצג צרכי תמיכה בפרופיל</Text>
                <Switch
                  value={form.showSupportNeeds}
                  onValueChange={v => setForm(f => ({ ...f, showSupportNeeds: v }))}
                />
              </View>

              {form.showSupportNeeds && (
                <>
                  <Pressable
                    onPress={() => setSupportNeedsModalVisible(true)}
                    style={styles.selectTraitsButton}
                  >
                    <Text style={styles.selectTraitsText}>בחר צרכים</Text>
                  </Pressable>
                  {form.supportNeeds.length > 0 && (
                    <View style={styles.traitsPreviewContainer}>
                      {form.supportNeeds.map(need => (
                        <View key={need} style={styles.traitTag}>
                          <Text style={styles.traitTagText}>{need}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
                 )}
               <Modal
                  visible={isSupportNeedsModalVisible}
                  animationType="slide"
                  transparent={false}
                  onRequestClose={() => setSupportNeedsModalVisible(false)}
                >
                <View style={{ flex: 1, backgroundColor: 'black' }}>
                  <Pressable onPress={() => setSupportNeedsModalVisible(false)} style={styles.backButton}>
                    <Text style={styles.backText}>חזור</Text>
                  </Pressable>

                  <View style={styles.modalContainer}>
                    <TextInput
                      placeholder="חפש צורך או כתוב בעצמך..."
                      placeholderTextColor="#aaa"
                      value={searchSupportNeed}
                      onChangeText={setSearchSupportNeed}
                      style={styles.input}
                      textAlign="right"
                    />

                    <Text style={styles.counterText}>
                      {selectedSupportNeeds.length} / 5 צרכים נבחרו
                    </Text>

                    <ScrollView contentContainerStyle={styles.traitsContainer}>
                      {filteredSupportNeeds.map(need => (
                        <Animated.View
                          key={need}
                          style={[
                            styles.trait,
                            selectedSupportNeeds.includes(need) && styles.traitSelected,
                            { transform: [{ scale: animationRefs.current[need] }] },
                          ]}
                        >
                          <Pressable
                            onPress={() => {
                              animatePress2(need);
                              toggleSupportNeed(need);
                            }}
                          >
                            <Text style={styles.traitText}>{need}</Text>
                          </Pressable>
                        </Animated.View>
                      ))}
                    </ScrollView>

                    <Pressable
                      style={styles.fancyButton}
                      onPress={() => {
                        setForm(f => ({ ...f, supportNeeds: selectedSupportNeeds }));
                        setSupportNeedsModalVisible(false);
                      }}
                    >
                      <Text style={styles.fancyText}>שמור</Text>
                    </Pressable>
                  </View>
                </View>
              </Modal>
      
              {/* introduction */}
              <View style={styles.container}>
              <Text style={styles.title}>רשמו משהו על עצמכם, שאחרים יכירו אתכם טוב יותר:</Text>
              <TextInput
                style={styles.input}
                placeholder="הקדמה"
                value={form.introduction}
                onChangeText={v => setForm(f => ({ ...f, introduction: v }))}
                multiline
                numberOfLines={3}
                textAlignVertical="top"  
              />
            </View>
            
             {/* status */}
             <Text style={styles.title}>בחרו סטטוס:</Text>

             <Pressable style={styles.statusInput} onPress={openModal}>
              <Text style={[styles.statusText, !form.status && styles.placeholder]}>
                {form.status || 'בחר/י סטטוס'}
              </Text>
            </Pressable>

            <Modal
              visible={modalVisible}
              transparent={true}
              animationType="slide"
              onRequestClose={onCancel}
            >
              <View style={styles.modalBackdrop}>
                <View style={styles.modalContainer}>
                  <Text style={styles.title}>בחר/י סטטוס</Text>
                  <View style={styles.buttonsContainer}>
                    <Pressable
                      style={[
                        styles.statusButton,
                        selectedStatus === 'רווק/ה' && styles.selectedButton,
                      ]}
                      onPress={() => onSelectStatus('רווק/ה')}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          selectedStatus === 'רווק/ה' && styles.selectedText,
                        ]}
                      >
                        רווק/ה
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.statusButton,
                        selectedStatus === 'בזוגיות' && styles.selectedButton,
                      ]}
                      onPress={() => onSelectStatus('בזוגיות')}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          selectedStatus === 'בזוגיות' && styles.selectedText,
                        ]}
                      >
                        בזוגיות
                      </Text>
                    </Pressable>
                  </View>

                  <View style={styles.actionButtons}>
                    <Pressable style={styles.cancelButton2} onPress={onCancel}>
                      <Text style={styles.cancelText2}>ביטול</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.fancyButton, !selectedStatus && styles.disabledButton]}
                      onPress={onSave}
                      disabled={!selectedStatus}
                    >
                      <Text style={styles.fancyText}>שמור</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
            
              {/* prompt */}
              <View style={styles.promptRow}>
                <View style={styles.promptRow}>
                  <Text style={styles.promptText}>הקליטו משהו על עצמכם...</Text>
                  <TouchableOpacity style={styles.micButton} onPress={() => setPromptModalVisible(true)}>
                    <Ionicons name="mic" size={20} color="white" />
                  </TouchableOpacity>
                </View>
                <View style={styles.promptInputContainer}>
                  <Input
                    placeholder="הוסיפו טקסט חופשי..."
                    value={form.prompt}
                    onChangeText={v => setForm(f => ({ ...f, prompt: v }))}
                    multiline
                    numberOfLines={2}
                    style={styles.promptInput}
                  />
                  <PromptCard
                    icon={<Ionicons name="mic" size={20} color="white" />}
                    onPress={() => setPromptModalVisible(true)}
                  />
                </View>
              </View>
              <PromptModal
                visible={promptModalVisible}
                onClose={() => setPromptModalVisible(false)}
                onSelectPrompt={(selected) => {
                  setForm(f => ({ ...f, prompt: selected }));
                  setPromptModalVisible(false);
                  setRecordingModalVisible(true);
                }}
              />
            <Modal visible={recordingModalVisible} animationType="slide" transparent={true}>
  <View style={styles.modalBackground}>
    <View style={styles.recordingModalContainer}>
      <Text style={styles.modalTitle}>הקליטו את עצמכם</Text>

      {form.prompt ? (
        <Text style={styles.promptSubtitle}>{form.prompt}</Text>
      ) : null}

      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        style={[styles.recordButton, isRecording && styles.recordingActive]}
      >
        <Text style={styles.recordButtonText}>
          {isRecording ? 'עצור הקלטה' : 'התחל הקלטה'}
        </Text>
      </TouchableOpacity>

      {recordedUri && (
        <View style={styles.audioControls}>
          <TouchableOpacity onPress={playRecording} disabled={isPlaying}>
            <Text style={styles.playButton}>▶ השמע</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={saveAndContinue} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>שמור והמשך</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={() => setRecordingModalVisible(false)}>
        <Text style={styles.cancelText}>בטל</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
                                  
                        
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>קבל התראות</Text>
            <Switch
              value={form.wantsNotifications}
              onValueChange={v => setForm(f => ({ ...f, wantsNotifications: v }))}
            />
          </View>
      
              <Button
                loading={loading}
                onPress={onSubmit}
                style={{ marginVertical: hp(3) }}
                title="שמור שינויים"
              />
            </ScrollView>
          </View>
          
        </ScreenWrapper>
    );
  }
      
      const styles = StyleSheet.create({
        container: {
          flex: 1,
          paddingHorizontal: wp(4),
          paddingTop: hp(2),
          backgroundColor: theme.colors.background,
          gap: hp(3),
        },
        title: {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 8,
          color:theme.colors.primaryDark,
          textAlign: 'right', 
        },
        avatarContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        cameraIcon: {
          position: 'absolute',
          right: wp(2),
          bottom: hp(0.5),
          backgroundColor: theme.colors.primary,
          borderRadius: 20,
          padding: 8,
          zIndex: 10,
        },
        subtext: {
          textAlign: 'center',
          color: theme.colors.textSecondary,
          fontSize: 14,
          marginBottom: hp(2),
        },
        switchRow: {
          flexDirection: 'row-reverse', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginVertical: 10, 
          
        },
        switchLabel: {
          fontSize: 16,
          color: 'white', 
          textAlign: 'right',
          
        },
        dateInput: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 6,
          backgroundColor: theme.colors.inputBackground,
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: wp(5),
        },
      
        genderOption: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          paddingVertical: 10,
          paddingHorizontal: 14,
          marginVertical: 5,
          backgroundColor: theme.colors.background, 
        },
        genderOptionSelected: {
          backgroundColor: theme.colors.primaryLight,
          borderColor: theme.colors.primary,
        },
        genderOptionText: {
          fontSize: 16,
          color: theme.colors.textPrimary,
        },
        genderOptionTextSelected: {
          fontWeight: 'bold',
          color: theme.colors.primary,
        },
        modalTitle: {
          fontSize: 18,
          fontWeight: '600',
          color: 'white', 
          marginBottom: 10,
          textAlign: 'right'
        },
        promptSubtitle: {
          fontSize: 16,
          color: '#ccc',
          textAlign: 'center',
          marginBottom: 20,
        },
        modalContent: {
          paddingHorizontal: 20,
          paddingVertical: 10,
          backgroundColor: theme.colors.background,
          borderRadius: 10,
          marginBottom: 20,
        },
        connectionTypeOption: {
          paddingVertical: hp(1.5),
          paddingHorizontal: wp(4),
          borderRadius: 8,
          width: '100%',
          marginVertical: hp(0.5),
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          flexDirection: 'row-reverse',
          justifyContent: 'flex-start',
        },
        connectionTypeOptionSelected: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        connectionTypeOptionText: {
          fontSize: 16,
          color: theme.colors.textPrimary,
          textAlign: 'right',
          writingDirection: 'rtl',
        },
        connectionTypeOptionTextSelected: {
          color: '#fff',
        },
        connectionTypeOptionSelected: {
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primary,
        },
        connectionTypeOptionText: {
          fontSize: 16,
          color: theme.colors.textPrimary,
          textAlign: 'right',            
          writingDirection: 'rtl',        
        },
        connectionTypeOptionTextSelected: {
          color: '#fff',
        },
        input: {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.lg,
          padding: hp(1.8),
          fontSize: hp(2),
          color: theme.colors.text,
          marginBottom: hp(2),
          textAlign: 'right',
        },
        counterText: {
          textAlign: 'right',
          color: theme.colors.textSecondary,
          fontSize: hp(1.8),
          marginBottom: hp(1),
        },
        traitsContainer: {
          flexDirection: 'row-reverse',
          flexWrap: 'wrap',
          justifyContent: 'flex-start',
          paddingBottom: hp(2),
        },
        trait: {
          backgroundColor: theme.colors.surface,
          padding: wp(3),
          borderRadius: theme.radius.md,
          marginVertical: hp(1),
          marginHorizontal: wp(1),
        },
        traitSelected: {
          backgroundColor: theme.colors.primaryDark,
        },
        traitText: {
          fontSize: hp(2),
          color: theme.colors.text,
        },
        traitTextSelected: {
          color: theme.colors.dark,
          fontWeight: 'bold',
        },
        bottomSection: {
          marginTop: hp(4),
        },
        toggleRow: {
          flexDirection: 'row-reverse',
          alignItems: 'center',
          marginBottom: hp(2),
        },
        toggleLabel: {
          fontSize: hp(2),
          color: theme.colors.text,
          marginRight: wp(3),
        },
        saveButton: {
          backgroundColor: theme.colors.primary,
          paddingVertical: hp(1.8),
          borderRadius: theme.radius.md,
          alignItems: 'center',
          marginBottom: hp(6),
        },
        saveText: {
          color: theme.colors.textSecondary,
          fontSize: hp(2.2),
          fontWeight: 'bold',
        },
        selectTraitsButton: {
          backgroundColor: theme.colors.primary,
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 16,
          alignItems: 'center',
          alignSelf: 'center',
          marginTop: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        },
        
        selectTraitsText: {
          color: theme.colors.text,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: 0.5,
        },
        
        traitsPreviewContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: 12,
          gap: 8,
          paddingHorizontal: 16,
        },
        
        traitTag: {
          backgroundColor: theme.colors.dark,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 20,
          shadowColor: '#A3BFFA',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
          elevation: 2,
        },
        
        traitTagText: {
          color: theme.colors.primary,
          fontSize: 14,
          fontWeight: '500',
        },
       
        backButton: {
          position: 'absolute',
          top: hp(8),
          right: hp(4),
          width: '14%',
          backgroundColor: theme.colors.card,
          paddingVertical: hp(1.0),
          borderRadius: theme.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 4,
          marginTop: -30,
        },
        backText: {
          color: theme.colors.primary,
          fontSize: hp(2),
          fontWeight: theme.fonts.semibold,
        },
        statusInput: {
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 8,
          paddingVertical: 14,
          paddingHorizontal: 12,
          color: theme.colors.primary,          
        },
        statusText: {
          fontSize: 16,
          color: theme.colors.primary,
          textAlign: 'right',
        },
        modalBackdrop: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
          justifyContent: 'center',
          paddingHorizontal: 30,
          
        },
        modalContainer: {
          backgroundColor: 'rgba(84, 81, 85, 0.7)', 
          borderRadius: 12,
          padding: 20,
          elevation: 10,    
          marginBottom: 230,
          marginTop: 100,      
        },
        buttonsContainer: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          
          marginTop: 40,             
          marginBottom: 30,
          
        },
        statusButton: {
          borderWidth: 1,
          borderColor: '#fff',       
          borderRadius: 50,
          paddingVertical: 15,
          paddingHorizontal: 30,
          backgroundColor: theme.colors.primaryDark,
        },
        selectedButton: {
          backgroundColor: theme.colors.primary,
          borderColor: '#fff',     
        },
        buttonText: {
          fontSize: 16,
          color: '#333',
        },
        selectedText: {
          color: '#fff',
          fontWeight: 'bold',
        },
        actionButtons: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 10,
        },
        cancelButton2: {
          backgroundColor: '#2C2C2E',
          paddingVertical: hp(1.6),         
          paddingHorizontal: hp(3.5),     
          borderRadius: 12,                
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,                    
          marginTop: hp(2),
        },
        cancelButton: {
          flex: 1,              
          marginRight: 10,
          paddingVertical: 12,
          backgroundColor: '#333',  
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        },
        saveButton: {
          flex: 2,                  
          paddingVertical: 12,
          backgroundColor: theme.colors.primary,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        },
        disabledButton: {
          backgroundColor: '#aaa',
        },
        cancelText2: {
          color: '#fff',
          fontSize: hp(2.2),
          fontWeight: '600',
          fontFamily: 'Poppins_600SemiBold',
          letterSpacing: 0.5,
        },
        cancelText: {
          color: '#ff5555',
          marginTop: 20,
          fontSize: 14,
        },
        saveText: {
          fontSize: 16,
          color: 'white',
          fontWeight: '600',
        },
        promptRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#333',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 16,
        },
        
        sectionLabel: {
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 6,
          color: 'white',
          textAlign: 'right',
        },
        
        promptInputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#333',
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 6,
          marginBottom: 10,
        },
        
        promptInput: {
          flex: 1,
          color: 'white',
          fontSize: 14,
          paddingRight: 10,
        },
        promptText: {
          color: 'white',
          fontSize: 14,
          flex: 1,
          textAlign: 'right',
        },
        
        micButton: {
          backgroundColor: '#ff5b8c',
          padding: 8,
          borderRadius: 20,
          marginLeft: 10,
        },
        modalBackground: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)', // כהה שקוף
          justifyContent: 'center',
          alignItems: 'center',
        },
        recordingModalContainer: {
          backgroundColor: '#1e1e1e', // רקע כהה
          padding: 25,
          borderRadius: 15,
          width: '85%',
          alignItems: 'center',
        },
        recordButton: {
          backgroundColor: '#FF4D4D',
          padding: 10,
          borderRadius: 8,
          marginBottom: 10,
        },
        recordButton: {
          backgroundColor: '#444',
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8,
          marginVertical: 10,
        },
        recordingActive: {
          backgroundColor: '#a00',
        },
        audioControls: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: 20,
        },
        playButton: {
          color: '#4caf50',
          fontSize: 16,
          paddingHorizontal: 12,
        },
        saveButton: {
          backgroundColor: '#0066cc',
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 6,
        },
        saveButtonText: {
          color: 'white',
          fontSize: 16,
        },
        fancyButton: {
          backgroundColor: theme.colors.primaryDark,
          paddingVertical: hp(2),
          paddingHorizontal: hp(4),
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 5, 
          marginTop: hp(2),
          marginTop: 30,
        },
        
        fancyText: {
          color: '#fff',
          fontSize: hp(2.4),
          fontWeight: '600',
          fontFamily: 'Poppins_600SemiBold',
          letterSpacing: 0.5,
        },
      });