import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';

type AiChatScreenRouteProp = RouteProp<RootStackParamList, 'AiChat'>;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

const STARTER_PROMPTS = [
  "What should I eat for dinner?",
  "Am I eating enough protein?",
  "Suggest a high-protein breakfast",
];

export default function AiChatScreen({ route }: { route: any }) {
  const session = route?.params?.session;
  const user = session?.user;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am your Govio Coach. Ask me any questions about meals, diet plans, or hitting your daily calorie and protein budgets today! 🥗",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  const getMockResponse = (message: string): string => {
    const msg = message.toLowerCase().trim();
    if (msg.includes('dinner')) {
      return "For a high-protein, calorie-friendly dinner, try Grilled Chicken Breast (200g) with Steamed Basmati Brown Rice (150g) and a side of mixed salad. This delivers around 520 kcal, 66g protein, 42g carbs, and under 8g fat. It's balanced and keeps you full!";
    }
    if (msg.includes('protein')) {
      return "To maximize muscle synthesis and stay full, aim for 1.8g to 2g of protein per kg of body weight. Focus your meals around lean sources like egg whites, grilled chicken breast, paneer, sprouts, fish, or a scoop of whey protein!";
    }
    if (msg.includes('breakfast')) {
      return "A premium high-protein breakfast to start your day is a 4-Egg White Omelette with spinach, paired with 50g of rolled oats cooked in low-fat milk. This provides roughly 380 kcal and 36g of protein to kickstart muscle synthesis.";
    }
    return "To optimize your diet for your fitness goals, focus on eating whole, single-ingredient foods, hitting a consistent protein target, and adjusting your daily calories according to your energy needs. What specific food or ingredient would you like to discuss?";
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessageText = textToSend.trim();
    setInputText('');
    Keyboard.dismiss();

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessageText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Bypass/mock user check
    if (user?.id === 'mock-user-id-12345') {
      setTimeout(() => {
        const mockReply: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: getMockResponse(userMessageText),
        };
        setMessages((prev) => [...prev, mockReply]);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('ask-govio-chat', {
        body: { 
          message: userMessageText, 
          conversationHistory: messages.filter(m => m.id !== 'welcome') 
        },
      });

      if (error) {
        throw error;
      }

      if (data && data.text) {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.text,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('Empty response received');
      }

    } catch (err: any) {
      console.error('AI invocation error:', err);
      let errorResponse = "Sorry, I encountered an issue connecting to the coach service. Please try again in a moment.";
      let isSetupError = false;

      // Handle specific secrets error
      if (err.message && err.message.includes('ANTHROPIC_API_KEY_MISSING')) {
        errorResponse = "⚠️ Anthropic API Key is missing.\n\nTo enable the AI coach, you need to configure your Anthropic API Key in Supabase. Please run the following command in your terminal:\n\n`supabase secrets set ANTHROPIC_API_KEY=your_key`";
        isSetupError = true;
      }

      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: errorResponse,
        isError: !isSetupError,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowAssistant,
        ]}
      >
        {!isUser && <Text style={styles.avatarMini}>🤖</Text>}
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
            item.isError && styles.bubbleError,
          ]}
        >
          <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Ask Govio Coach</Text>
          <Text style={styles.headerSubtitle}>AI Nutrition Assistant</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages List */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              loading ? (
                <View style={styles.typingContainer}>
                  <Text style={styles.avatarMini}>🤖</Text>
                  <View style={[styles.bubble, styles.bubbleAssistant]}>
                    <ActivityIndicator size="small" color="#D4FF13" />
                  </View>
                </View>
              ) : null
            }
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Chat input and suggested prompt chips */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.inputSection}>
          {/* Suggestion Chips */}
          {messages.length === 1 && !loading && (
            <View style={styles.chipsRow}>
              {STARTER_PROMPTS.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chip}
                  activeOpacity={0.8}
                  onPress={() => handleSend(prompt)}
                >
                  <Text style={styles.chipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Text Input Row */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask about diet, protein, meals..."
              placeholderTextColor="#7A7A7A"
              value={inputText}
              onChangeText={setInputText}
              multiline={false}
              onSubmitEditing={() => handleSend(inputText)}
              editable={!loading}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || loading) && styles.sendBtnDisabled,
              ]}
              activeOpacity={0.8}
              onPress={() => handleSend(inputText)}
              disabled={!inputText.trim() || loading}
            >
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D141D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#1C2530',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#D4FF13',
    fontSize: 24,
    fontWeight: '800',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#D4FF13',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    maxWidth: '85%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  typingContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'center',
  },
  avatarMini: {
    fontSize: 18,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: '#D4FF13',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#1E1E1E',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2C3540',
  },
  bubbleError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  bubbleTextUser: {
    color: '#0D141D',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  bubbleTextAssistant: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  inputSection: {
    padding: 16,
    borderTopWidth: 1.5,
    borderTopColor: '#1C2530',
    backgroundColor: '#0D141D',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#3D4A3D',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: '#D4FF13',
    fontSize: 11,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1.5,
    borderColor: '#3D4A3D',
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#2A2A2A',
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#0D141D',
    fontSize: 14,
    fontWeight: '800',
  },
});
