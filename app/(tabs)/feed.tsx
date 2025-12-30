import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Image, TextInput, KeyboardAvoidingView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, ArrowUp, Bot, X, Plus, MessageSquare, Edit2, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('RAPDXB');
  const [profileImage, setProfileImage] = useState('https://i.imgur.com/vhILBC1.png');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [chats, setChats] = useState<Array<{id: number, title: string, lastMessage: string}>>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sidebarAnim = useRef(new Animated.Value(-320)).current;

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedFullName = await AsyncStorage.getItem('fullName');
        if (storedFullName) {
          setFullName(storedFullName);
        }
        const storedProfileUrl = await AsyncStorage.getItem('instagramProfileUrl');
        if (storedProfileUrl && storedProfileUrl !== 'https://i.imgur.com/vhILBC1.png') {
          setProfileImage(storedProfileUrl);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };
    loadUserData();
  }, []);

  const handleNewChat = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Save current chat if it has messages
    if (messages.length > 0 && currentChatId === null) {
      const newChat = {
        id: Date.now(),
        title: messages[0].text.substring(0, 30) + (messages[0].text.length > 30 ? '...' : ''),
        lastMessage: messages[messages.length - 1].text,
      };
      setChats([newChat, ...chats]);
    }
    
    // Start new chat
    setMessages([]);
    setCurrentChatId(null);
  };

  const handleDeleteChat = (chatId: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setChats(chats.filter(chat => chat.id !== chatId));
  };

  useEffect(() => {
    Animated.timing(sidebarAnim, {
      toValue: showSidebar ? 0 : -320,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [showSidebar]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newMessage: Message = {
      id: Date.now(),
      text: message.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: Date.now() + 1,
        text: "I'm your AI assistant. How can I help you today?",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Scroll to bottom after bot response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1000);

    // Scroll to bottom after sending
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleMenuPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowSidebar(!showSidebar);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleMenuPress}
              activeOpacity={0.7}
            >
              <Menu color="#ffffff" size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Plus color="#ffffff" size={24} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Chat Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={[
            styles.chatContent,
            { paddingBottom: 140 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>
                Hi, {fullName}
              </Text>
              <Text style={styles.welcomeSubtext}>
                How may I help you?
              </Text>
            </View>
          ) : (
            <View style={styles.messagesContainer}>
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageWrapper,
                    msg.isUser ? styles.userMessageWrapper : styles.botMessageWrapper
                  ]}
                >
                  {!msg.isUser && (
                    <View style={styles.botAvatar}>
                      <Bot color="#ffffff" size={20} strokeWidth={2} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageBubble,
                      msg.isUser ? styles.userMessage : styles.botMessage
                    ]}
                  >
                    <Text style={[
                      styles.messageText,
                      msg.isUser ? styles.userMessageText : styles.botMessageText
                    ]}>
                      {msg.text}
                    </Text>
                  </View>
                  {msg.isUser && (
                    <Image
                      source={{ uri: profileImage }}
                      style={styles.userAvatar}
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, { marginBottom: 120 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            activeOpacity={0.7}
            disabled={!message.trim()}
          >
            <ArrowUp color="#000000" size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sidebar Modal */}
      {showSidebar && (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity 
            style={styles.sidebarOverlayTouchable} 
            activeOpacity={1}
            onPress={() => setShowSidebar(false)}
          />
          <Animated.View 
            style={[styles.sidebarContainer, { transform: [{ translateX: sidebarAnim }] }]}
          >
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarHeaderContent}>
                <Bot color="#ffffff" size={24} strokeWidth={2} />
                <Text style={styles.sidebarTitle}>Chat History</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSidebar(false)}
                style={styles.sidebarCloseButton}
                activeOpacity={0.7}
              >
                <X color="#ffffff" size={20} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sidebarContent}>
              <TouchableOpacity
                style={styles.sidebarNewChatButton}
                activeOpacity={0.7}
                onPress={() => {
                  handleNewChat();
                  setShowSidebar(false);
                }}
              >
                <Plus color="#ffffff" size={20} strokeWidth={2} />
                <Text style={styles.sidebarNewChatText}>New Chat</Text>
              </TouchableOpacity>

              {chats.length > 0 && (
                <View style={styles.sidebarSection}>
                  <Text style={styles.sidebarSectionTitle}>Recent Chats</Text>
                  <View style={styles.sidebarChatList}>
                    {chats.map((chat) => (
                      <View key={chat.id} style={styles.sidebarChatItem}>
                        <MessageSquare color="rgba(255, 255, 255, 0.6)" size={18} strokeWidth={2} />
                        <Text style={styles.sidebarChatText} numberOfLines={1}>{chat.title}</Text>
                        <View style={styles.sidebarChatActions}>
                          <TouchableOpacity
                            onPress={() => {
                              if (Platform.OS !== 'web') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              }
                              // TODO: Implement rename functionality
                            }}
                            style={styles.sidebarChatActionButton}
                            activeOpacity={0.7}
                          >
                            <Edit2 color="rgba(255, 255, 255, 0.5)" size={16} strokeWidth={2} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteChat(chat.id)}
                            style={styles.sidebarChatActionButton}
                            activeOpacity={0.7}
                          >
                            <Trash2 color="rgba(255, 100, 100, 0.8)" size={16} strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {messages.length > 0 && currentChatId === null && (
                <View style={styles.sidebarSection}>
                  <Text style={styles.sidebarSectionTitle}>Current Chat</Text>
                  <View style={styles.sidebarChatList}>
                    <View style={styles.sidebarChatItem}>
                      <MessageSquare color="rgba(96, 165, 250, 0.8)" size={18} strokeWidth={2} />
                      <Text style={styles.sidebarChatText} numberOfLines={1}>
                        {messages[0]?.text.substring(0, 30)}{messages[0]?.text.length > 30 ? '...' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  newChatButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  chatContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  welcomeText: {
    fontSize: 32,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  messagesContainer: {
    paddingTop: 20,
    paddingBottom: 20,
    gap: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  botMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userMessage: {
    backgroundColor: '#ffffff',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
    letterSpacing: -0.1,
    color: '#ffffff',
  },
  userMessageText: {
    color: '#000000',
  },
  botMessageText: {
    color: '#ffffff',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    letterSpacing: -0.1,
    paddingVertical: 4,
    maxHeight: 100,
    outlineStyle: 'none',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  sidebarOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sidebarContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 320,
    backgroundColor: '#000000',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1001,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sidebarTitle: {
    fontSize: 18,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  sidebarCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sidebarContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sidebarNewChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  sidebarNewChatText: {
    fontSize: 15,
    fontFamily: 'Archivo-Bold',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  sidebarSection: {
    gap: 12,
  },
  sidebarSectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sidebarChatList: {
    gap: 8,
  },
  sidebarChatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sidebarChatText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: -0.1,
  },
  sidebarChatActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sidebarChatActionButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
