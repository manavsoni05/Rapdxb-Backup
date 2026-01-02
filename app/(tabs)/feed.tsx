import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Image, TextInput, KeyboardAvoidingView, Animated, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, ArrowUp, X, Plus, MessageSquare, Edit2, Trash2 } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState, useRef, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = process.env.EXPO_PUBLIC_GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [profileImage, setProfileImage] = useState(require('@/assets/images/avatar.png'));
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [chats, setChats] = useState<Array<{id: number, title: string, lastMessage: string}>>([]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const sidebarAnim = useRef(new Animated.Value(-320)).current;
  const inputBottomAnim = useRef(new Animated.Value(80)).current;

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        Animated.timing(inputBottomAnim, {
          toValue: e.endCoordinates.height,
          duration: 0,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        Animated.timing(inputBottomAnim, {
          toValue: 80,
          duration: 0,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Load user data directly from AsyncStorage (real-time, no cache) - reloads on screen focus
  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        try {
          const storedFullName = await AsyncStorage.getItem('fullName');
          const storedProfileUrl = await AsyncStorage.getItem('instagramProfileUrl');
          
          if (storedFullName) {
            setFullName(storedFullName);
          }
          
          // Check if Instagram is connected and has profile URL
          if (storedProfileUrl && storedProfileUrl !== 'https://i.imgur.com/vhILBC1.png') {
            setProfileImage({ uri: storedProfileUrl });
          } else {
            // Use default avatar from assets if Instagram not connected
            setProfileImage(require('@/assets/images/avatar.png'));
          }
        } catch (error) {
          // Failed to load user data
        }
      };
      
      loadUserData();
    }, [])
  );

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

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const userMessage: Message = {
      id: Date.now(),
      text: message.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const currentMessage = message.trim();
    setMessages([...messages, userMessage]);
    setMessage('');

    // Dismiss keyboard after sending
    Keyboard.dismiss();

    // Scroll to bottom after sending
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Call Groq API for AI response
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for RAPDXB, a social media management platform. Help users with their questions about posting content, managing social media accounts, and general assistance.'
            },
            {
              role: 'user',
              content: currentMessage
            }
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const botResponse = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
        
        const botMessage: Message = {
          id: Date.now() + 1,
          text: botResponse,
          isUser: false,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, botMessage]);
        
        // Scroll to bottom after bot response
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
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
      behavior={undefined}
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
                <Text style={styles.welcomeHi}>Hi, </Text>
                <Text style={styles.welcomeName}>{fullName}</Text>
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
                      <Svg width="20" height="20" viewBox="0 0 50 50" fill="none">
                        <Path
                          d="M8.33332 34.3748C8.33332 37.8265 11.1316 40.6248 14.5833 40.6248C14.5833 43.5013 16.9152 45.8331 19.7917 45.8331C22.6681 45.8331 25 43.5013 25 40.6248C25 43.5013 27.3319 45.8329 30.2083 45.8329C33.0848 45.8329 35.4167 43.501 35.4167 40.6246C38.8685 40.6246 41.6667 37.8263 41.6667 34.3746C41.6667 33.1898 41.3371 32.0821 40.7646 31.1381C43.6514 30.5858 45.8333 28.0475 45.8333 24.9996C45.8333 21.9515 43.6514 19.4131 40.7646 18.8609C41.3371 17.9169 41.6667 16.8092 41.6667 15.6245C41.6667 12.1727 38.8685 9.3745 35.4167 9.3745C35.4167 6.498 33.0848 4.16617 30.2083 4.16617C27.3319 4.16617 25 6.49821 25 9.37469C25 6.49821 22.6681 4.16636 19.7917 4.16636C16.9152 4.16636 14.5833 6.49821 14.5833 9.37469C11.1316 9.37469 8.33332 12.1729 8.33332 15.6247C8.33332 16.8094 8.66295 17.9171 9.23549 18.8611C6.34847 19.4133 4.16666 21.9517 4.16666 24.9998C4.16666 28.0477 6.34847 30.586 9.23549 31.1383C8.66295 32.0823 8.33332 33.19 8.33332 34.3748Z"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Path
                          d="M15.625 30.2081L19.4623 18.6963C19.659 18.1061 20.2112 17.7081 20.8333 17.7081C21.4554 17.7081 22.0077 18.1061 22.2044 18.6963L26.0417 30.2081M32.2917 17.7081V30.2081M17.7083 26.0414H23.9583"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
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
                      source={profileImage}
                      style={styles.userAvatar}
                    />
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <Animated.View style={[styles.inputContainer, { 
          paddingBottom: insets.bottom || 20, 
          bottom: inputBottomAnim 
        }]}>
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
        </Animated.View>
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
                <Svg width="24" height="24" viewBox="0 0 50 50" fill="none">
                  <Path
                    d="M8.33332 34.3748C8.33332 37.8265 11.1316 40.6248 14.5833 40.6248C14.5833 43.5013 16.9152 45.8331 19.7917 45.8331C22.6681 45.8331 25 43.5013 25 40.6248C25 43.5013 27.3319 45.8329 30.2083 45.8329C33.0848 45.8329 35.4167 43.501 35.4167 40.6246C38.8685 40.6246 41.6667 37.8263 41.6667 34.3746C41.6667 33.1898 41.3371 32.0821 40.7646 31.1381C43.6514 30.5858 45.8333 28.0475 45.8333 24.9996C45.8333 21.9515 43.6514 19.4131 40.7646 18.8609C41.3371 17.9169 41.6667 16.8092 41.6667 15.6245C41.6667 12.1727 38.8685 9.3745 35.4167 9.3745C35.4167 6.498 33.0848 4.16617 30.2083 4.16617C27.3319 4.16617 25 6.49821 25 9.37469C25 6.49821 22.6681 4.16636 19.7917 4.16636C16.9152 4.16636 14.5833 6.49821 14.5833 9.37469C11.1316 9.37469 8.33332 12.1729 8.33332 15.6247C8.33332 16.8094 8.66295 17.9171 9.23549 18.8611C6.34847 19.4133 4.16666 21.9517 4.16666 24.9998C4.16666 28.0477 6.34847 30.586 9.23549 31.1383C8.66295 32.0823 8.33332 33.19 8.33332 34.3748Z"
                    stroke="#ffffff"
                    strokeWidth="3.125"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M15.625 30.2081L19.4623 18.6963C19.659 18.1061 20.2112 17.7081 20.8333 17.7081C21.4554 17.7081 22.0077 18.1061 22.2044 18.6963L26.0417 30.2081M32.2917 17.7081V30.2081M17.7083 26.0414H23.9583"
                    stroke="#ffffff"
                    strokeWidth="3.125"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
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
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 44,
    letterSpacing: -1.2,
    marginBottom: 16,
  },
  welcomeHi: {
    fontFamily: 'Inter-Thin',
    color: '#ffffff',
    fontSize: 44,
  },
  welcomeName: {
    fontFamily: 'Archivo-Bold',
    color: '#e97b1cff',
    fontSize: 44,
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
    position: 'absolute',
    left: 0,
    right: 0,
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
