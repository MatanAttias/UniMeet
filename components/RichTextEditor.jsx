import { StyleSheet, Text, View, TextInput } from 'react-native'
import React, { useState } from 'react'
import { RichEditor } from 'react-native-pell-rich-editor'
import { theme } from '../constants/theme'

const RichTextEditor = ({ editorRef, onChange }) => {
  const [text, setText] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's on your mind?</Text>
      
      <View style={styles.textBox}>
        <TextInput
          style={styles.input}
          placeholder="Start typing here..."
          placeholderTextColor="#999"
          multiline
          onChangeText={(value) => {
            setText(value);
            onChange(value);
          }}
          value={text}
        />
      </View>
      
      <RichEditor
        ref={editorRef}
        containerStyle={styles.rich}
        editorStyle={styles.contantStyle}
        onChange={onChange}
      />
    </View>
  )
}

export default RichTextEditor

const styles = StyleSheet.create({
  container: {
    minHeight: 285,
    padding: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  textBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // צל לאנדרואיד
    marginBottom: 10,
  },
  input: {
    fontSize: 16,
    color: "#333",
    textAlignVertical: "top",
    minHeight: 100,
  },
  richBar: {
    borderTopRightRadius: theme.radius.xl,
    borderTopLeftRadius: theme.radius.xl,
    backgroundColor: theme.colors.gray,
  }
});