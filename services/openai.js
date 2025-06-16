import Constants from 'expo-constants';
import OpenAI from 'openai';

const apiKey =
  Constants.expoConfig?.extra?.openaiApiKey ||
  Constants.manifest?.extra?.openaiApiKey;


let openai;
try {
  if (!apiKey) {
    throw new Error('Missing API key');
  }
  openai = new OpenAI({ 
    apiKey,
    dangerouslyAllowBrowser: true 
  });
} catch (error) {
  console.error('Failed to initialize OpenAI:', error);
}

export async function sendToChat(messages, options = {}) {
  if (!apiKey) {
    throw new Error(
      'Missing OpenAI API key – וודא ש־.env נטען דרך app.config.js'
    );
  }
  
  if (!openai) {
    throw new Error('OpenAI client not initialized');
  }
  
  const validatedMessages = messages.map(msg => {
    if (!msg.role || !msg.content) {
      console.error('Invalid message:', msg);
      throw new Error('Message must have role and content');
    }
    return {
      role: msg.role,
      content: msg.content.toString() 
    };
  });
  
  console.log('Sending validated messages to OpenAI...');
  
  try {
    const requestConfig = {
      model: options.model || 'gpt-4o-mini',
      messages: validatedMessages,
      temperature: options.temperature || 0.1,
      max_tokens: options.max_tokens || 5500,
      presence_penalty: options.presence_penalty || 0,
      frequency_penalty: options.frequency_penalty || 0,
    };

    if (options.json_mode || validatedMessages[0]?.content?.includes('Return only valid JSON')) {
      requestConfig.response_format = { type: "json_object" };
    }

    console.log('Request config:', {
      model: requestConfig.model,
      temperature: requestConfig.temperature,
      max_tokens: requestConfig.max_tokens,
      json_mode: !!requestConfig.response_format
    });
    
    const res = await openai.chat.completions.create(requestConfig);
    
    console.log('OpenAI Response received successfully');
    console.log('Tokens used:', res.usage);
    
    if (!res.choices || res.choices.length === 0) {
      throw new Error('No choices in OpenAI response');
    }
    
    const message = res.choices[0].message;
    if (!message || !message.content) {
      throw new Error('Empty content in OpenAI response');
    }
    
    if (res.choices[0].finish_reason === 'length') {
      console.warn('Response was truncated due to max_tokens limit');
    }
    
    return message;
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
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