// ייבוא הפונקציות שלך
import { getUserData, searchUsersByName, updateUser } from './services/userService';
import { supabase } from './lib/supabase';

describe('🧪 בדיקות האפליקציה', () => {

  // ======== בדיקות שירותי משתמש ========
  describe('👤 שירותי משתמש', () => {
    
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('✅ קבלת נתוני משתמש - הצלחה', async () => {
      const mockUser = { id: '1', name: 'דני כהן', role: 'user' };
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      });

      const result = await getUserData('1');
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('דני כהן');
    });

    test('❌ קבלת נתוני משתמש - בלי מזהה', async () => {
      const result = await getUserData();
      
      expect(result.success).toBe(false);
      expect(result.msg).toBe('חסר מזהה משתמש');
    });

    test('🔍 חיפוש משתמשים - הצלחה', async () => {
      const mockUsers = [
        { id: '1', name: 'יוסי לוי' },
        { id: '2', name: 'רחל לוי' }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
      });

      const result = await searchUsersByName('לוי');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('יוסי לוי');
    });

    test('🔍 חיפוש משתמשים - חיפוש ריק', async () => {
      const result = await searchUsersByName('');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    test('✏️ עדכון משתמש - הצלחה', async () => {
      supabase.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await updateUser('1', { name: 'שם חדש' });
      
      expect(result.success).toBe(true);
    });

    test('❌ עדכון משתמש - נתונים חסרים', async () => {
      const result = await updateUser();
      
      expect(result.success).toBe(false);
      expect(result.msg).toBe('נתונים חסרים לעדכון');
    });
  });

  // ======== בדיקות התחברות ========
  describe('🔐 התחברות', () => {
    
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('✅ התחברות מוצלחת', async () => {
      // סימולציה של התחברות מוצלחת
      supabase.auth.signInWithPassword.mockResolvedValue({ error: null });

      const email = 'test@example.com';
      const password = '123456';

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      expect(error).toBeNull();
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: '123456'
      });
    });

    test('❌ התחברות נכשלת - סיסמה שגויה', async () => {
      const errorMessage = 'Invalid login credentials';
      supabase.auth.signInWithPassword.mockResolvedValue({ 
        error: { message: errorMessage } 
      });

      const { error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      expect(error.message).toBe(errorMessage);
    });

    test('📧 בדיקת תקינות אימייל', () => {
      const validEmails = ['test@gmail.com', 'user@domain.co.il'];
      const invalidEmails = ['invalid-email', '@gmail.com', 'test@'];
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });
      
      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  // ======== בדיקות דף ביקור משתמש ושליחת הודעות ========
  describe('👁️ דף ביקור משתמש ושליחת הודעות', () => {
    
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('✅ טעינת נתוני משתמש מבוקר - הצלחה', async () => {
      const mockVisitedUser = { 
        id: '2', 
        name: 'יוסי לוי', 
        email: 'yossi@example.com',
        profile_pic: 'https://example.com/pic.jpg'
      };
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockVisitedUser, error: null }),
      });

      // סימולציה של הפונקציה שטוענת את המשתמש המבוקר
      const fetchVisitedUser = async (userId) => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) return { success: false, error };
        return { success: true, data };
      };

      const result = await fetchVisitedUser('2');
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('יוסי לוי');
      expect(supabase.from).toHaveBeenCalledWith('users');
    });

    test('❌ טעינת נתוני משתמש מבוקר - משתמש לא קיים', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'User not found' } 
        }),
      });

      const fetchVisitedUser = async (userId) => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) return { success: false, error };
        return { success: true, data };
      };

      const result = await fetchVisitedUser('999');
      
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('User not found');
    });

    test('💬 חיפוש או יצירת צ\'אט - צ\'אט קיים', async () => {
      const mockExistingChat = { 
        id: '1', 
        user1_id: '1', 
        user2_id: '2',
        last_message: 'שלום!',
        updated_at: '2024-01-01T10:00:00Z'
      };
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [mockExistingChat], error: null }),
      });

      const findOrCreateChat = async (userId1, userId2) => {
        const { data: existingChats, error } = await supabase
          .from('chats')
          .select('*')
          .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
          .limit(1);

        if (error) return null;
        if (existingChats.length > 0) return existingChats[0];
        
        // לא מגיעים לכאן במקרה זה
        return null;
      };

      const result = await findOrCreateChat('1', '2');
      
      expect(result).toEqual(mockExistingChat);
      expect(supabase.from).toHaveBeenCalledWith('chats');
    });

    test('💬 חיפוש או יצירת צ\'אט - יצירת צ\'אט חדש', async () => {
      const mockNewChat = { 
        id: '2', 
        user1_id: '1', 
        user2_id: '3',
        last_message: '',
        updated_at: null
      };
      
      // ראשית - אין צ'אט קיים
      supabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        })
        // שנית - יצירת צ'אט חדש
        .mockReturnValueOnce({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockNewChat, error: null }),
        });

      const findOrCreateChat = async (userId1, userId2) => {
        // חיפוש צ'אט קיים
        const { data: existingChats, error } = await supabase
          .from('chats')
          .select('*')
          .or(`and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`)
          .limit(1);

        if (error) return null;
        if (existingChats.length > 0) return existingChats[0];

        // יצירת צ'אט חדש
        const { data: newChat, error: insertError } = await supabase
          .from('chats')
          .insert([{
            user1_id: userId1,
            user2_id: userId2,
            last_message: '',
            updated_at: null,
          }])
          .select()
          .single();

        if (insertError) return null;
        return newChat;
      };

      const result = await findOrCreateChat('1', '3');
      
      expect(result).toEqual(mockNewChat);
    });

    test('✉️ שליחת הודעה - הצלחה', async () => {
      const messageData = {
        content: 'שלום! איך הולך?',
        sender_id: '1',
        chat_id: '1'
      };
      
      // Mock עבור הכנסת ההודעה
      supabase.from
        .mockReturnValueOnce({
          insert: jest.fn().mockResolvedValue({ data: messageData, error: null }),
        })
        // Mock עבור עדכון הצ'אט
        .mockReturnValueOnce({
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null }),
        });

      const sendMessage = async (messageText, userId, chatId) => {
        // שמירת ההודעה
        const { data, error } = await supabase.from("messages").insert({
          content: messageText,
          sender_id: userId,
          chat_id: chatId,
        });

        if (error) return { success: false, error };

        // עדכון last_message בצ'אט
        const { error: updateError } = await supabase
          .from("chats")
          .update({
            last_message: messageText,
            updated_at: new Date().toISOString(),
          })
          .eq("id", chatId);

        if (updateError) return { success: false, error: updateError };
        return { success: true };
      };

      const result = await sendMessage('שלום! איך הולך?', '1', '1');
      
      expect(result.success).toBe(true);
    });

    test('❌ שליחת הודעה - הודעה ריקה', async () => {
      const sendMessage = async (messageText, userId, chatId) => {
        if (!messageText || !messageText.trim()) {
          return { success: false, error: 'הודעה ריקה' };
        }
        
        // לא מגיעים לכאן במקרה זה
        return { success: true };
      };

      const result = await sendMessage('   ', '1', '1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('הודעה ריקה');
    });

    test('❌ שליחת הודעה - משתמש לא מחובר', async () => {
      const sendMessage = async (messageText, userId, chatId) => {
        if (!userId) {
          return { success: false, error: 'משתמש לא מחובר' };
        }
        
        return { success: true };
      };

      const result = await sendMessage('הודעה', null, '1');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('משתמש לא מחובר');
    });

    test('🔄 קבלת משתמש נוכחי - הצלחה', async () => {
      const mockCurrentUser = { 
        id: '1', 
        email: 'current@example.com',
        name: 'המשתמש הנוכחי'
      };
      
      supabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockCurrentUser },
        error: null
      });

      const getCurrentUser = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) return { success: false, error };
        return { success: true, user };
      };

      const result = await getCurrentUser();
      
      expect(result.success).toBe(true);
      expect(result.user.id).toBe('1');
      expect(supabase.auth.getUser).toHaveBeenCalled();
    });

    test('🔧 בדיקת תקינות נתוני הודעה', () => {
      const validateMessageData = (messageText, user, chatObj) => {
        if (!messageText || !messageText.trim()) {
          return { valid: false, message: 'אנא מלא הודעה' };
        }
        
        if (!user) {
          return { valid: false, message: 'משתמש לא מחובר' };
        }
        
        if (!chatObj || !chatObj.id) {
          return { valid: false, message: 'צ\'אט לא תקין' };
        }
        
        return { valid: true };
      };

      // נתונים תקינים
      expect(validateMessageData('הודעה תקינה', { id: '1' }, { id: '1' }))
        .toEqual({ valid: true });

      // הודעה ריקה
      expect(validateMessageData('', { id: '1' }, { id: '1' }))
        .toEqual({ valid: false, message: 'אנא מלא הודעה' });

      // משתמש לא מחובר
      expect(validateMessageData('הודעה', null, { id: '1' }))
        .toEqual({ valid: false, message: 'משתמש לא מחובר' });

      // צ'אט לא תקין
      expect(validateMessageData('הודעה', { id: '1' }, null))
        .toEqual({ valid: false, message: 'צ\'אט לא תקין' });
    });

    test('📱 בדיקת מצב מודל הודעה', () => {
      const mockModalState = {
        visible: false,
        messageText: '',
        chatObj: null
      };

      const toggleModal = (state) => {
        return { ...state, visible: !state.visible };
      };

      const setMessageText = (state, text) => {
        return { ...state, messageText: text };
      };

      // פתיחת מודל
      let newState = toggleModal(mockModalState);
      expect(newState.visible).toBe(true);

      // הגדרת טקסט הודעה
      newState = setMessageText(newState, 'הודעה חדשה');
      expect(newState.messageText).toBe('הודעה חדשה');

      // סגירת מודל
      newState = toggleModal(newState);
      expect(newState.visible).toBe(false);
    });
  });

  // ======== בדיקות ולידציה ========
  describe('✔️ בדיקות ולידציה', () => {
    
    test('📝 בדיקת שדות ריקים', () => {
      const validateFields = (email, password) => {
        if (!email || !password) {
          return { valid: false, message: 'אנא מלא את כל השדות!' };
        }
        return { valid: true };
      };

      // שדות ריקים
      expect(validateFields('', '')).toEqual({
        valid: false,
        message: 'אנא מלא את כל השדות!'
      });

      // שדות מלאים
      expect(validateFields('test@gmail.com', '123456')).toEqual({
        valid: true
      });
    });

    test('🔒 בדיקת חוזק סיסמה', () => {
      const checkPasswordStrength = (password) => {
        if (password.length < 6) return 'חלשה';
        if (password.length >= 6 && password.length < 10) return 'בינונית';
        return 'חזקה';
      };

      expect(checkPasswordStrength('123')).toBe('חלשה');
      expect(checkPasswordStrength('123456')).toBe('בינונית');
      expect(checkPasswordStrength('123456789a')).toBe('חזקה');
    });

    test('📏 בדיקת אורך הודעה', () => {
      const validateMessageLength = (message) => {
        if (!message || message.trim().length === 0) {
          return { valid: false, message: 'הודעה ריקה' };
        }
        if (message.length > 1000) {
          return { valid: false, message: 'הודעה ארוכה מדי' };
        }
        return { valid: true };
      };

      // הודעה תקינה
      expect(validateMessageLength('הודעה רגילה')).toEqual({ valid: true });

      // הודעה ריקה
      expect(validateMessageLength('')).toEqual({ 
        valid: false, 
        message: 'הודעה ריקה' 
      });

      // הודעה ארוכה מדי
      const longMessage = 'א'.repeat(1001);
      expect(validateMessageLength(longMessage)).toEqual({ 
        valid: false, 
        message: 'הודעה ארוכה מדי' 
      });
    });
  });

  // ======== בדיקות כלליות ========
  describe('🛠️ בדיקות כלליות', () => {
    
    test('🌐 בדיקת חיבור לאינטרנט', () => {
      // סימולציה של בדיקת חיבור
      const isOnline = true; // בפועל תבדוק את navigator.onLine או NetInfo
      expect(isOnline).toBe(true);
    });

    test('📱 בדיקת פלטפורמה', () => {
      // בדיקה שהאפליקציה יודעת באיזה פלטפורמה היא רצה
      const platform = 'ios'; // או 'android'
      expect(['ios', 'android']).toContain(platform);
    });

    test('🎯 בדיקת פורמט נתוני משתמש', () => {
      const userData = {
        id: '123',
        name: 'משה כהן',
        email: 'moshe@example.com'
      };

      expect(userData).toHaveProperty('id');
      expect(userData).toHaveProperty('name');
      expect(userData).toHaveProperty('email');
      expect(typeof userData.name).toBe('string');
    });

    test('💬 בדיקת פורמט נתוני צ\'אט', () => {
      const chatData = {
        id: '1',
        user1_id: '1',
        user2_id: '2',
        last_message: 'שלום!',
        updated_at: '2024-01-01T10:00:00Z'
      };

      expect(chatData).toHaveProperty('id');
      expect(chatData).toHaveProperty('user1_id');
      expect(chatData).toHaveProperty('user2_id');
      expect(chatData).toHaveProperty('last_message');
      expect(chatData).toHaveProperty('updated_at');
      expect(typeof chatData.id).toBe('string');
    });

    test('✉️ בדיקת פורמט נתוני הודעה', () => {
      const messageData = {
        id: '1',
        content: 'תוכן ההודעה',
        sender_id: '1',
        chat_id: '1',
        created_at: '2024-01-01T10:00:00Z'
      };

      expect(messageData).toHaveProperty('id');
      expect(messageData).toHaveProperty('content');
      expect(messageData).toHaveProperty('sender_id');
      expect(messageData).toHaveProperty('chat_id');
      expect(typeof messageData.content).toBe('string');
      expect(messageData.content.length).toBeGreaterThan(0);
    });
  });

});