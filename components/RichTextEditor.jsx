import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { RichEditor } from 'react-native-pell-rich-editor';
import { theme } from '../constants/theme';

const RichTextEditor = ({ editorRef, onChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>מה אתה מרגיש?</Text>
      
      <RichEditor
        ref={editorRef}
        containerStyle={styles.editorContainer}
        editorStyle={styles.editorStyle}
        onChange={onChange}
        editorInitializedCallback={() => {
          editorRef?.current?.registerToolbar(() => {
            // לוגיקה של בר הכלים במידת הצורך
          });
        }}
        style={styles.editorInlineStyle}
        placeholder="שתף כאן את מה שעל לבך..."
      />
    </View>
  );
};

export default RichTextEditor;

const styles = StyleSheet.create({
  container: {
    minHeight: 285,
    padding: 12,
    backgroundColor: '#f5f5f7', // רקע כללי בהיר מאוד
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  editorContainer: {
    backgroundColor: '#e2e2e8', // אפור כהה יותר מהרקע הכללי (למשל #f5f5f7)
    borderRadius: 12,
    padding: 8,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#c0c0c5', // גבול אפור כהה יותר
  
    // צל מודגש טיפה יותר
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 5,
  },
  editorStyle: {
    backgroundColor: '#ffffff',
    color: '#ffffff', // טקסט לבן אם צריך
    placeholderColor: '#888888',
    cssText: `
      body {
        direction: rtl;
        text-align: right;
        font-family: Arial, sans-serif;
        font-size: 16px;
        color: #333333;
        background-color: #ffffff;
        padding: 10px;
      }
    `,
  },
  editorInlineStyle: {
    writingDirection: 'rtl',
    textAlign: 'right',
    minHeight: 120,
    color: '#333333',
  },
});