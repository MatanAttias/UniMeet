const sendMessage = async () => {
    
    if (!messageText.trim() || !chatObj || !user) return;
  
    const receiverId =
      chatObj.user1_id === user.id ? chatObj.user2_id : chatObj.user1_id;
  
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatObj.id,
        sender_id: user.id,
        receiver_id: receiverId,
        message_type: 'text',
        content: messageText.trim(),
        is_read: false,
      })
      .select()
      .single();
  
    if (error) {
      console.error('שגיאה בשליחת הודעה:', error);
    } else {
      setMessages(prev => [data, ...prev]);
      setMessageText('');
  
      await supabase
        .from('chats')
        .update({
          last_message: messageText.trim(),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', chatObj.id);
    }
  };
  