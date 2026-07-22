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
  Alert,
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { triggerSuccessHaptic } from '../utils/haptics';

type AiChatScreenRouteProp = RouteProp<RootStackParamList, 'AiChat'>;

interface FoodLogIntent {
  is_food_log: boolean;
  food_name: string;
  quantity_grams: number;
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  confidence?: string;
}

interface MatchedFood {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  foodLogIntent?: FoodLogIntent | null;
  matchedFood?: MatchedFood | null;
  matchedCalories?: number;
  isConfirmed?: boolean;
  isCustomFormOpen?: boolean;
  customFoodName?: string;
  customCalories?: string;
  customProtein?: string;
  customCarbs?: string;
  customFat?: string;
}

const STARTER_PROMPTS = [
  "Log 200g grilled chicken",
  "I ate a banana for lunch",
  "What should I eat for dinner?",
];

const STAPLE_FOODS: MatchedFood[] = [
  { id: 'f1', name: 'Chicken Breast (Grilled)', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 },
  { id: 'f2', name: 'Basmati White Rice (Cooked)', calories_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3 },
  { id: 'f3', name: 'Whole Egg (Boiled)', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
  { id: 'f4', name: 'Banana', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3 },
  { id: 'f5', name: 'Roti (Whole Wheat Chapati)', calories_per_100g: 264, protein_per_100g: 9, carbs_per_100g: 50, fat_per_100g: 3 },
  { id: 'f6', name: 'Paneer (Cottage Cheese)', calories_per_100g: 265, protein_per_100g: 18, carbs_per_100g: 1.2, fat_per_100g: 20 },
  { id: 'f7', name: 'Whole Milk (3.25% Fat)', calories_per_100g: 61, protein_per_100g: 3.2, carbs_per_100g: 4.8, fat_per_100g: 3.3 },
  { id: 'f8', name: 'Apple', calories_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2 },
  { id: 'f9', name: 'Almonds (Badam)', calories_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 50 },
  { id: 'f10', name: 'Oats (Rolled, Cooked)', calories_per_100g: 71, protein_per_100g: 2.5, carbs_per_100g: 12, fat_per_100g: 1.5 },
];

const fuzzyMatchFood = async (searchTerm: string): Promise<MatchedFood | null> => {
  if (!searchTerm) return null;
  const normalized = searchTerm.toLowerCase().trim();

  try {
    const { data } = await supabase
      .from('foods')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .limit(5);

    if (data && data.length > 0) {
      return data[0] as MatchedFood;
    }

    const words = normalized.split(/\s+/).filter(w => w.length > 2);
    for (const word of words) {
      const { data: wordData } = await supabase
        .from('foods')
        .select('*')
        .ilike('name', `%${word}%`)
        .limit(5);

      if (wordData && wordData.length > 0) {
        return wordData[0] as MatchedFood;
      }
    }
  } catch (e) {
    console.warn('Food DB search error:', e);
  }

  const directMatch = STAPLE_FOODS.find(f => 
    f.name.toLowerCase().includes(normalized) || normalized.includes(f.name.toLowerCase())
  );
  if (directMatch) return directMatch;

  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  for (const word of words) {
    const wordMatch = STAPLE_FOODS.find(f => f.name.toLowerCase().includes(word));
    if (wordMatch) return wordMatch;
  }

  return null;
};

export default function AiChatScreen({ route }: { route: any }) {
  const session = route?.params?.session;
  const user = session?.user;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am your Govio Coach. Ask me questions about diet or tell me to log food (e.g., 'Log 200g grilled chicken' or 'I ate a banana')! 🥗",
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  const getMockResponse = (message: string): { text: string; intent: FoodLogIntent | null } => {
    const msg = message.toLowerCase().trim();
    const keywords = ['log', 'ate', 'had', 'eat', 'logged'];
    const isLog = keywords.some(kw => msg.includes(kw));

    if (isLog) {
      const gramsMatch = msg.match(/(\d+)\s*g/);
      const qtyGrams = gramsMatch ? parseInt(gramsMatch[1], 10) : 150;

      let foodName = 'Chicken Breast (Grilled)';
      if (msg.includes('banana')) foodName = 'Banana';
      else if (msg.includes('egg')) foodName = 'Whole Egg (Boiled)';
      else if (msg.includes('rice')) foodName = 'Basmati White Rice (Cooked)';
      else if (msg.includes('milk')) foodName = 'Whole Milk (3.25% Fat)';
      else if (msg.includes('roti') || msg.includes('chapati')) foodName = 'Roti (Whole Wheat Chapati)';
      else if (msg.includes('custom') || msg.includes('unknown') || msg.includes('pizza')) foodName = 'Pepperoni Pizza';

      return {
        text: `I've prepared a food log entry for ${qtyGrams}g of ${foodName}. Please review and tap confirm below to log it directly into your daily tracker!`,
        intent: {
          is_food_log: true,
          food_name: foodName,
          quantity_grams: qtyGrams,
          meal_type: 'lunch',
          confidence: 'high'
        }
      };
    }

    if (msg.includes('dinner')) {
      return {
        text: "For a high-protein, calorie-friendly dinner, try Grilled Chicken Breast (200g) with Steamed Basmati Brown Rice (150g) and a side of mixed salad. This delivers around 520 kcal, 66g protein, 42g carbs, and under 8g fat.",
        intent: null
      };
    }
    if (msg.includes('protein')) {
      return {
        text: "To maximize muscle synthesis and stay full, aim for 1.8g to 2g of protein per kg of body weight. Focus your meals around lean sources like egg whites, grilled chicken breast, paneer, sprouts, or whey protein!",
        intent: null
      };
    }
    return {
      text: "To optimize your diet, focus on eating whole, single-ingredient foods and tracking your daily meals. Tell me what you ate (e.g. 'log 200g chicken') to track it!",
      intent: null
    };
  };

  const handleConfirmLogFood = async (messageId: string, food: MatchedFood, quantityGrams: number, mealType: string = 'snack') => {
    try {
      if (user?.id && user.id !== 'mock-user-id-12345') {
        const { error } = await supabase.from('food_logs').insert({
          user_id: user.id,
          food_id: food.id,
          quantity_grams: quantityGrams,
          meal_type: mealType.toLowerCase(),
          logged_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
      triggerSuccessHaptic();
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isConfirmed: true } : m))
      );
    } catch (e: any) {
      console.error('Error logging food:', e);
      Alert.alert('Error', 'Failed to save food log. Please try again.');
    }
  };

  const handleSaveCustomFood = async (messageId: string, intent: FoodLogIntent) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const name = msg.customFoodName?.trim() || intent.food_name || 'Custom Food';
    const cal = parseFloat(msg.customCalories || '200');
    const p = parseFloat(msg.customProtein || '15');
    const c = parseFloat(msg.customCarbs || '20');
    const f = parseFloat(msg.customFat || '5');

    if (isNaN(cal) || isNaN(p) || isNaN(c) || isNaN(f)) {
      Alert.alert('Invalid Input', 'Please enter valid numbers for nutrition values.');
      return;
    }

    try {
      let createdFoodId = `custom-${Date.now()}`;
      if (user?.id && user.id !== 'mock-user-id-12345') {
        const { data: foodData, error: foodErr } = await supabase
          .from('foods')
          .insert({
            name,
            calories_per_100g: cal,
            protein_per_100g: p,
            carbs_per_100g: c,
            fat_per_100g: f,
          })
          .select()
          .single();

        if (foodErr) {
          const { data: existing } = await supabase.from('foods').select('*').eq('name', name).maybeSingle();
          if (existing) createdFoodId = existing.id;
          else throw foodErr;
        } else if (foodData) {
          createdFoodId = foodData.id;
        }

        const { error: logErr } = await supabase.from('food_logs').insert({
          user_id: user.id,
          food_id: createdFoodId,
          quantity_grams: intent.quantity_grams,
          meal_type: (intent.meal_type || 'snack').toLowerCase(),
          logged_at: new Date().toISOString(),
        });
        if (logErr) throw logErr;
      }

      triggerSuccessHaptic();
      const newFood: MatchedFood = {
        id: createdFoodId,
        name,
        calories_per_100g: cal,
        protein_per_100g: p,
        carbs_per_100g: c,
        fat_per_100g: f,
      };

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                matchedFood: newFood,
                matchedCalories: Math.round((cal * intent.quantity_grams) / 100),
                isConfirmed: true,
                isCustomFormOpen: false,
              }
            : m
        )
      );
    } catch (e: any) {
      console.error('Error saving custom food:', e);
      Alert.alert('Error', 'Failed to save custom food. Please try again.');
    }
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

    if (user?.id === 'mock-user-id-12345') {
      setTimeout(async () => {
        const mockRes = getMockResponse(userMessageText);
        let matched: MatchedFood | null = null;
        let matchedCalories: number | undefined;

        if (mockRes.intent) {
          matched = await fuzzyMatchFood(mockRes.intent.food_name);
          if (matched) {
            matchedCalories = Math.round((matched.calories_per_100g * mockRes.intent.quantity_grams) / 100);
          }
        }

        const mockReply: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: mockRes.text,
          foodLogIntent: mockRes.intent,
          matchedFood: matched,
          matchedCalories,
          isConfirmed: false,
          isCustomFormOpen: false,
          customFoodName: mockRes.intent?.food_name || '',
          customCalories: '200',
          customProtein: '20',
          customCarbs: '10',
          customFat: '5',
        };
        setMessages((prev) => [...prev, mockReply]);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
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
        let matched: MatchedFood | null = null;
        let matchedCalories: number | undefined;

        if (data.foodLogIntent && data.foodLogIntent.food_name) {
          matched = await fuzzyMatchFood(data.foodLogIntent.food_name);
          if (matched) {
            matchedCalories = Math.round((matched.calories_per_100g * (data.foodLogIntent.quantity_grams || 100)) / 100);
          }
        }

        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.text,
          foodLogIntent: data.foodLogIntent,
          matchedFood: matched,
          matchedCalories,
          isConfirmed: false,
          isCustomFormOpen: false,
          customFoodName: data.foodLogIntent?.food_name || '',
          customCalories: '200',
          customProtein: '20',
          customCarbs: '10',
          customFat: '5',
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('Empty response received');
      }

    } catch (err: any) {
      console.error('AI invocation error:', err);
      let errorResponse = "Sorry, I encountered an issue connecting to the coach service. Please try again in a moment.";
      let isSetupError = false;

      if (err.message && err.message.includes('ANTHROPIC_API_KEY_MISSING')) {
        errorResponse = "⚠️ Anthropic API Key is missing.\n\nTo enable the AI coach, you need to configure your Anthropic API Key in Supabase. Please run:\n\n`supabase secrets set ANTHROPIC_API_KEY=your_key`";
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
    const hasIntent = !isUser && item.foodLogIntent;

    return (
      <View style={{ marginVertical: 6 }}>
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

        {/* Structured Food Logging Confirm / Add Card */}
        {hasIntent && (
          <View style={styles.foodCardContainer}>
            {item.isConfirmed ? (
              <View style={styles.confirmedCard}>
                <Text style={styles.confirmedCheck}>✓</Text>
                <Text style={styles.confirmedText}>
                  Logged {item.foodLogIntent?.quantity_grams}g {item.matchedFood?.name || item.foodLogIntent?.food_name}
                  {item.matchedCalories ? ` (${item.matchedCalories} kcal)` : ''}!
                </Text>
              </View>
            ) : item.matchedFood ? (
              <View style={styles.confirmCard}>
                <Text style={styles.confirmCardBadge}>🥗 FOOD LOG INTENT DETECTED</Text>
                <Text style={styles.confirmCardTitle}>
                  Log {item.foodLogIntent?.quantity_grams}g {item.matchedFood.name}?
                </Text>
                <Text style={styles.confirmCardStats}>
                  Est: {item.matchedCalories} kcal • {(item.matchedFood.protein_per_100g * (item.foodLogIntent?.quantity_grams || 100) / 100).toFixed(1)}g Protein
                </Text>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    handleConfirmLogFood(
                      item.id,
                      item.matchedFood!,
                      item.foodLogIntent!.quantity_grams,
                      item.foodLogIntent!.meal_type || 'snack'
                    )
                  }
                >
                  <Text style={styles.confirmBtnText}>✓ CONFIRM &amp; LOG FOOD</Text>
                </TouchableOpacity>
              </View>
            ) : item.isCustomFormOpen ? (
              <View style={styles.customFormCard}>
                <Text style={styles.confirmCardBadge}>➕ ADD AS NEW FOOD</Text>
                <Text style={styles.customFormSubtitle}>
                  No close match found. Enter nutritional info per 100g to save and log:
                </Text>

                <Text style={styles.inputFieldLabel}>Food Name</Text>
                <TextInput
                  style={styles.customInput}
                  value={item.customFoodName}
                  onChangeText={(val) =>
                    setMessages((prev) =>
                      prev.map((m) => (m.id === item.id ? { ...m, customFoodName: val } : m))
                    )
                  }
                />

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputFieldLabel}>Calories/100g</Text>
                    <TextInput
                      style={styles.customInput}
                      keyboardType="numeric"
                      value={item.customCalories}
                      onChangeText={(val) =>
                        setMessages((prev) =>
                          prev.map((m) => (m.id === item.id ? { ...m, customCalories: val } : m))
                        )
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputFieldLabel}>Protein/100g</Text>
                    <TextInput
                      style={styles.customInput}
                      keyboardType="numeric"
                      value={item.customProtein}
                      onChangeText={(val) =>
                        setMessages((prev) =>
                          prev.map((m) => (m.id === item.id ? { ...m, customProtein: val } : m))
                        )
                      }
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputFieldLabel}>Carbs/100g</Text>
                    <TextInput
                      style={styles.customInput}
                      keyboardType="numeric"
                      value={item.customCarbs}
                      onChangeText={(val) =>
                        setMessages((prev) =>
                          prev.map((m) => (m.id === item.id ? { ...m, customCarbs: val } : m))
                        )
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputFieldLabel}>Fat/100g</Text>
                    <TextInput
                      style={styles.customInput}
                      keyboardType="numeric"
                      value={item.customFat}
                      onChangeText={(val) =>
                        setMessages((prev) =>
                          prev.map((m) => (m.id === item.id ? { ...m, customFat: val } : m))
                        )
                      }
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.confirmBtn, { marginTop: 12 }]}
                  activeOpacity={0.8}
                  onPress={() => handleSaveCustomFood(item.id, item.foodLogIntent!)}
                >
                  <Text style={styles.confirmBtnText}>SAVE &amp; LOG FOOD</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noMatchCard}>
                <Text style={styles.noMatchTitle}>🔍 NO EXACT MATCH IN DATABASE</Text>
                <Text style={styles.noMatchDesc}>
                  Could not find a close match for "{item.foodLogIntent?.food_name}". Would you like to add it as a custom food?
                </Text>
                <TouchableOpacity
                  style={styles.addCustomBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    setMessages((prev) =>
                      prev.map((m) => (m.id === item.id ? { ...m, isCustomFormOpen: true } : m))
                    )
                  }
                >
                  <Text style={styles.addCustomBtnText}>+ ADD AS NEW FOOD</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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
  foodCardContainer: {
    marginLeft: 26,
    marginTop: 6,
    maxWidth: '85%',
  },
  confirmCard: {
    backgroundColor: '#161F2B',
    borderWidth: 1.5,
    borderColor: '#D4FF13',
    borderRadius: 16,
    padding: 14,
  },
  confirmCardBadge: {
    color: '#D4FF13',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  confirmCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  confirmCardStats: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 12,
  },
  confirmBtn: {
    backgroundColor: '#D4FF13',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#0D141D',
    fontSize: 12,
    fontWeight: '900',
  },
  confirmedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderWidth: 1,
    borderColor: '#00E676',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  confirmedCheck: {
    color: '#00E676',
    fontSize: 16,
    fontWeight: '900',
    marginRight: 8,
  },
  confirmedText: {
    color: '#00E676',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  noMatchCard: {
    backgroundColor: '#1C2530',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
    padding: 14,
  },
  noMatchTitle: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  noMatchDesc: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  addCustomBtn: {
    backgroundColor: '#374151',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addCustomBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  customFormCard: {
    backgroundColor: '#161F2B',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 16,
    padding: 14,
  },
  customFormSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginVertical: 6,
  },
  inputFieldLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  customInput: {
    backgroundColor: '#0D141D',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
});
