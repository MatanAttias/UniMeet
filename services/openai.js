import Constants from 'expo-constants';
import OpenAI from 'openai';

const apiKey =
  Constants.expoConfig?.extra?.openaiApiKey ||
  Constants.manifest?.extra?.openaiApiKey;

console.log('API Key exists:', !!apiKey);

const openai = new OpenAI({ apiKey });

export async function sendToChat(messages) {
  if (!apiKey) {
    throw new Error(
      'Missing OpenAI API key – וודא ש־.env נטען דרך app.config.js'
    );
  }
  
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    console.log('OpenAI Response Status:', res);
    return res.choices[0].message;
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`OpenAI API Error: ${error.message}`);
  }
}