import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { MOCK_FOOD_LOGS } from './HomeScreen';

type LogFoodScreenRouteProp = RouteProp<RootStackParamList, 'LogFood'>;

type LogFoodScreenProps = {
  route: LogFoodScreenRouteProp;
};

interface Food {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
}

const MOCK_FOODS: Food[] = [
  { id: 'f-1', name: 'Roti (Whole Wheat Chapati)', calories_per_100g: 260.0, protein_per_100g: 8.0, carbs_per_100g: 55.0, fat_per_100g: 1.5 },
  { id: 'f-2', name: 'Basmati White Rice (Cooked)', calories_per_100g: 130.0, protein_per_100g: 2.7, carbs_per_100g: 28.0, fat_per_100g: 0.3 },
  { id: 'f-3', name: 'Brown Rice (Cooked)', calories_per_100g: 111.0, protein_per_100g: 2.6, carbs_per_100g: 23.0, fat_per_100g: 0.9 },
  { id: 'f-4', name: 'Dal Tadka (Cooked Yellow Lentils)', calories_per_100g: 85.0, protein_per_100g: 5.0, carbs_per_100g: 14.0, fat_per_100g: 1.5 },
  { id: 'f-5', name: 'Chicken Breast (Grilled)', calories_per_100g: 165.0, protein_per_100g: 31.0, carbs_per_100g: 0.0, fat_per_100g: 3.6 },
  { id: 'f-6', name: 'Whole Egg (Boiled)', calories_per_100g: 155.0, protein_per_100g: 13.0, carbs_per_100g: 1.1, fat_per_100g: 11.0 },
  { id: 'f-7', name: 'Egg White (Boiled)', calories_per_100g: 52.0, protein_per_100g: 11.0, carbs_per_100g: 0.7, fat_per_100g: 0.2 },
  { id: 'f-8', name: 'Paneer (Cottage Cheese)', calories_per_100g: 265.0, protein_per_100g: 18.3, carbs_per_100g: 1.2, fat_per_100g: 20.8 },
  { id: 'f-9', name: 'Whole Milk (3.25% Fat)', calories_per_100g: 61.0, protein_per_100g: 3.2, carbs_per_100g: 4.8, fat_per_100g: 3.3 },
  { id: 'f-10', name: 'Low Fat Milk (Double Toned)', calories_per_100g: 43.0, protein_per_100g: 3.4, carbs_per_100g: 4.9, fat_per_100g: 1.5 },
  { id: 'f-11', name: 'Curd / Dahi (Plain Whole)', calories_per_100g: 63.0, protein_per_100g: 3.0, carbs_per_100g: 4.0, fat_per_100g: 3.5 },
  { id: 'f-12', name: 'Rolled Oats (Raw)', calories_per_100g: 389.0, protein_per_100g: 16.9, carbs_per_100g: 66.0, fat_per_100g: 6.9 },
  { id: 'f-13', name: 'Banana', calories_per_100g: 89.0, protein_per_100g: 1.1, carbs_per_100g: 23.0, fat_per_100g: 0.3 },
  { id: 'f-14', name: 'Apple', calories_per_100g: 52.0, protein_per_100g: 0.3, carbs_per_100g: 14.0, fat_per_100g: 0.2 },
  { id: 'f-15', name: 'Almonds (Badam)', calories_per_100g: 579.0, protein_per_100g: 21.0, carbs_per_100g: 22.0, fat_per_100g: 49.0 },
  { id: 'f-16', name: 'Walnuts (Akhrot)', calories_per_100g: 654.0, protein_per_100g: 15.0, carbs_per_100g: 14.0, fat_per_100g: 65.0 },
  { id: 'f-17', name: 'Potato (Boiled)', calories_per_100g: 87.0, protein_per_100g: 1.9, carbs_per_100g: 20.0, fat_per_100g: 0.1 },
  { id: 'f-18', name: 'Sweet Potato (Boiled)', calories_per_100g: 76.0, protein_per_100g: 1.4, carbs_per_100g: 18.0, fat_per_100g: 0.1 },
  { id: 'f-19', name: 'Cooked Chickpeas (Chole)', calories_per_100g: 164.0, protein_per_100g: 8.9, carbs_per_100g: 27.0, fat_per_100g: 2.6 },
  { id: 'f-20', name: 'Cooked Kidney Beans (Rajma)', calories_per_100g: 127.0, protein_per_100g: 8.7, carbs_per_100g: 22.8, fat_per_100g: 0.5 },
  { id: 'f-21', name: 'Peanut Butter (Creamy)', calories_per_100g: 588.0, protein_per_100g: 25.0, carbs_per_100g: 20.0, fat_per_100g: 50.0 },
  { id: 'f-22', name: 'White Bread (1 Slice ~25g)', calories_per_100g: 265.0, protein_per_100g: 9.0, carbs_per_100g: 49.0, fat_per_100g: 3.2 },
  { id: 'f-23', name: 'Brown Bread (1 Slice ~25g)', calories_per_100g: 250.0, protein_per_100g: 10.0, carbs_per_100g: 43.0, fat_per_100g: 3.0 },
  { id: 'f-24', name: 'Whey Protein Powder', calories_per_100g: 400.0, protein_per_100g: 80.0, carbs_per_100g: 6.0, fat_per_100g: 6.0 },
  { id: 'f-25', name: 'Samosa (Indian Snack)', calories_per_100g: 262.0, protein_per_100g: 4.5, carbs_per_100g: 32.0, fat_per_100g: 13.0 },
  { id: 'f-26', name: 'Butter (Salted)', calories_per_100g: 717.0, protein_per_100g: 0.9, carbs_per_100g: 0.1, fat_per_100g: 81.0 },
  { id: 'f-27', name: 'Ghee (Clarified Butter)', calories_per_100g: 900.0, protein_per_100g: 0.0, carbs_per_100g: 0.0, fat_per_100g: 100.0 },
  { id: 'f-28', name: 'Idli (Steamed Rice Cake)', calories_per_100g: 143.0, protein_per_100g: 3.5, carbs_per_100g: 30.0, fat_per_100g: 0.5 },
  { id: 'f-29', name: 'Cooked Rohu / Salmon Fish', calories_per_100g: 142.0, protein_per_100g: 20.0, carbs_per_100g: 0.0, fat_per_100g: 6.3 },
  { id: 'f-30', name: 'Mixed Salad Vegetables', calories_per_100g: 20.0, protein_per_100g: 1.0, carbs_per_100g: 4.0, fat_per_100g: 0.1 },
];

export default function LogFoodScreen({ route }: LogFoodScreenProps) {
  const session = route.params.session;
  const user = session.user;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [foodsList, setFoodsList] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected food logging state
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');

  const fetchFoods = async () => {
    if (user.id === 'mock-user-id-12345') {
      setFoodsList(MOCK_FOODS);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setFoodsList(data || []);
    } catch (err) {
      console.error('Error fetching foods:', err);
      setFoodsList(MOCK_FOODS); // Fallback to mock seeds
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
  };

  const handleLogFood = async () => {
    if (!selectedFood) return;

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid amount in grams.');
      return;
    }

    setSaving(true);
    const todayTimestamp = new Date().toISOString();

    if (user.id === 'mock-user-id-12345') {
      // Unshift mock log
      MOCK_FOOD_LOGS.unshift({
        id: `fl-${Date.now()}`,
        user_id: user.id,
        food_id: selectedFood.id,
        quantity_grams: parsedQty,
        meal_type: mealType,
        logged_at: todayTimestamp,
        foods: selectedFood,
      });

      setTimeout(() => {
        setSaving(false);
        navigation.navigate('Home', { session });
      }, 800);
      return;
    }

    try {
      const { error } = await supabase.from('food_logs').insert({
        user_id: user.id,
        food_id: selectedFood.id,
        quantity_grams: parsedQty,
        meal_type: mealType,
        logged_at: todayTimestamp,
      });

      if (error) throw error;
      navigation.navigate('Home', { session });
    } catch (err: any) {
      Alert.alert('Save Error', err.message || 'Failed to save food log.');
    } finally {
      setSaving(false);
    }
  };

  const filteredFoods = foodsList.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getScaledNutrients = (food: Food, grams: string) => {
    const qty = parseFloat(grams) || 0;
    const factor = qty / 100;
    return {
      calories: Math.round(food.calories_per_100g * factor),
      protein: (food.protein_per_100g * factor).toFixed(1),
      carbs: (food.carbs_per_100g * factor).toFixed(1),
      fat: (food.fat_per_100g * factor).toFixed(1),
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4FF13" />
        <StatusBar barStyle="light-content" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>✕ Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Log Food</Text>
          <View style={{ width: 60 }} />
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1 }}>
            {selectedFood ? (
              // Quantity & Meal Selection Panel
              <View style={styles.logContainer}>
                <View style={styles.selectedFoodCard}>
                  <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
                  
                  {/* Per 100g Info */}
                  <Text style={styles.per100gLabel}>
                    Base details (per 100g): {selectedFood.calories_per_100g} kcal • P: {selectedFood.protein_per_100g}g • C: {selectedFood.carbs_per_100g}g • F: {selectedFood.fat_per_100g}g
                  </Text>

                  {/* Calculated Nutrients Preview */}
                  <View style={styles.nutrientsPreviewRow}>
                    <View style={styles.nutrientPreviewBox}>
                      <Text style={styles.nutrientVal}>{getScaledNutrients(selectedFood, quantity).calories}</Text>
                      <Text style={styles.nutrientLbl}>Calories</Text>
                    </View>
                    <View style={styles.nutrientPreviewBox}>
                      <Text style={[styles.nutrientVal, { color: '#D4FF13' }]}>{getScaledNutrients(selectedFood, quantity).protein}g</Text>
                      <Text style={styles.nutrientLbl}>Protein</Text>
                    </View>
                    <View style={styles.nutrientPreviewBox}>
                      <Text style={[styles.nutrientVal, { color: '#06B6D4' }]}>{getScaledNutrients(selectedFood, quantity).carbs}g</Text>
                      <Text style={styles.nutrientLbl}>Carbs</Text>
                    </View>
                    <View style={styles.nutrientPreviewBox}>
                      <Text style={[styles.nutrientVal, { color: '#F59E0B' }]}>{getScaledNutrients(selectedFood, quantity).fat}g</Text>
                      <Text style={styles.nutrientLbl}>Fat</Text>
                    </View>
                  </View>
                </View>

                {/* Form Controls */}
                <View style={styles.formCard}>
                  {/* Quantity Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Quantity (grams)</Text>
                    <View style={styles.qtyInputRow}>
                      <TextInput
                        style={styles.qtyInput}
                        keyboardType="numeric"
                        autoFocus
                        value={quantity}
                        onChangeText={setQuantity}
                        maxLength={5}
                      />
                      <Text style={styles.qtySuffix}>g</Text>
                    </View>
                  </View>

                  {/* Meal Type Picker */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Meal Category</Text>
                    <View style={styles.mealTypeRow}>
                      {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.mealTypeBtn,
                            mealType === type && styles.mealTypeBtnActive,
                          ]}
                          onPress={() => setMealType(type)}
                        >
                          <Text
                            style={[
                              styles.mealTypeBtnText,
                              mealType === type && styles.mealTypeBtnTextActive,
                            ]}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Log Action Button */}
                  <TouchableOpacity
                    style={[styles.primaryButton, saving && styles.disabledButton]}
                    onPress={handleLogFood}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Add to Daily Log</Text>
                    )}
                  </TouchableOpacity>

                  {/* Back to search */}
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => setSelectedFood(null)}
                    disabled={saving}
                  >
                    <Text style={styles.secondaryButtonText}>Back to Search</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Search & Food List View
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.searchBar}
                  placeholder="Search common foods (e.g. roti, chicken, rice...)"
                  placeholderTextColor="#6B7280"
                  autoCorrect={false}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />

                <FlatList
                  data={filteredFoods}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.flatListContent}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.foodItem}
                      onPress={() => handleSelectFood(item)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.foodItemName}>{item.name}</Text>
                        <Text style={styles.foodItemMacros}>
                          {item.calories_per_100g} kcal / 100g • P: {item.protein_per_100g}g • C: {item.carbs_per_100g}g • F: {item.fat_per_100g}g
                        </Text>
                      </View>
                      <Text style={styles.logArrow}>+</Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={() => (
                    <View style={styles.emptyPlaceholder}>
                      <Text style={styles.emptyText}>No matching foods found</Text>
                      <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
                    </View>
                  )}
                />
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1.5,
    borderColor: '#222222',
  },
  backBtn: {
    paddingVertical: 6,
  },
  backBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  searchBar: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 16,
    color: '#FFFFFF',
    padding: 14,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
    fontSize: 15,
  },
  flatListContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  foodItemName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  foodItemMacros: {
    color: '#A0A0A0',
    fontSize: 12,
    marginTop: 4,
  },
  logArrow: {
    fontSize: 20,
    color: '#D4FF13',
    fontWeight: '900',
    paddingLeft: 10,
  },
  separator: {
    height: 1.5,
    backgroundColor: '#222222',
  },
  emptyPlaceholder: {
    alignItems: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyText: {
    color: '#A0A0A0',
    fontSize: 15,
    fontWeight: '800',
  },
  emptySubtext: {
    color: '#7A7A7A',
    fontSize: 13,
    marginTop: 4,
  },
  logContainer: {
    flex: 1,
    padding: 20,
  },
  selectedFoodCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#222222',
    padding: 16,
    marginBottom: 16,
  },
  selectedFoodName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  per100gLabel: {
    color: '#7A7A7A',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  nutrientsPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    borderTopWidth: 1.5,
    borderColor: '#222222',
    paddingTop: 16,
  },
  nutrientPreviewBox: {
    flex: 1,
    alignItems: 'center',
  },
  nutrientVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  nutrientLbl: {
    fontSize: 11,
    color: '#7A7A7A',
    marginTop: 4,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#222222',
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  qtyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#222222',
    paddingHorizontal: 12,
  },
  qtyInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    paddingVertical: 10,
  },
  qtySuffix: {
    color: '#A0A0A0',
    fontSize: 16,
    fontWeight: '800',
  },
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealTypeBtn: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  mealTypeBtnActive: {
    backgroundColor: '#2A2A2A',
    borderColor: '#D4FF13',
  },
  mealTypeBtnText: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '700',
  },
  mealTypeBtnTextActive: {
    color: '#D4FF13',
  },
  primaryButton: {
    backgroundColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#D4FF13',
    fontSize: 13,
    fontWeight: '700',
  },
});
