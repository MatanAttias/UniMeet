import Constants from 'expo-constants';
import OpenAI from 'openai';

const apiKey =
  Constants.expoConfig?.extra?.openaiApiKey ||
  Constants.manifest?.extra?.openaiApiKey;

console.log('API Key exists:', !!apiKey);
console.log('API Key length:', apiKey?.length);

// יצירת אינסטנס של OpenAI עם טיפול בשגיאות
let openai;
try {
  if (!apiKey) {
    throw new Error('Missing API key');
  }
  openai = new OpenAI({ 
    apiKey,
    dangerouslyAllowBrowser: true // נדרש ל-React Native
  });
} catch (error) {
  console.error('Failed to initialize OpenAI:', error);
}

export async function sendToChat(messages) {
  if (!apiKey) {
    throw new Error(
      'Missing OpenAI API key – וודא ש־.env נטען דרך app.config.js'
    );
  }
  
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }
  
  // וידוא שכל ההודעות תקינות
  const validatedMessages = messages.map(msg => {
    if (!msg.role || !msg.content) {
      console.error('Invalid message:', msg);
      throw new Error('Message must have role and content');
    }
    return {
      role: msg.role,
      content: msg.content.toString() // וידוא שזה string
    };
  });
  
  console.log('Sending validated messages to OpenAI...');
  
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: validatedMessages,
      temperature: 0.2,
      max_tokens: 4000, // הגדלנו מ-2000 ל-4000
      presence_penalty: 0,
      frequency_penalty: 0,
    });
    
    console.log('OpenAI Response received successfully');
    console.log('Tokens used:', res.usage);
    
    if (!res.choices || res.choices.length === 0) {
      throw new Error('No choices in OpenAI response');
    }
    
    const message = res.choices[0].message;
    if (!message || !message.content) {
      throw new Error('Empty content in OpenAI response');
    }
    
    // בדיקה אם התגובה נקטעה
    if (res.choices[0].finish_reason === 'length') {
      console.warn('Response was truncated due to max_tokens limit');
    }
    
    return message;
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    // טיפול בשגיאות ספציפיות
    if (error.response?.status === 401) {
      throw new Error('Invalid API key');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded - please try again later');
    } else if (error.response?.status === 400) {
      throw new Error(`Bad request: ${error.response?.data?.error?.message || error.message}`);
    }
    
    throw new Error(`OpenAI API Error: ${error.message}`);
  }
}