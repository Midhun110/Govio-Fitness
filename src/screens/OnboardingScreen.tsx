import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { supabase } from '../lib/supabase';
import { calculateNutritionMetrics, NutritionMetrics, UserProfile } from '../utils/calculations';

type OnboardingScreenRouteProp = RouteProp<RootStackParamList, 'Onboarding'>;

type OnboardingScreenProps = {
  route: OnboardingScreenRouteProp;
};

type SexType = 'male' | 'female';
type HeightUnitType = 'cm' | 'ft-in';
type WeightUnitType = 'kg' | 'lb';
type ActivityLevelType = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type FitnessGoalType = 'lose' | 'maintain' | 'gain' | 'recomposition';

export default function OnboardingScreen({ route }: OnboardingScreenProps) {
  const { session, onComplete } = route.params;
  const [step, setStep] = useState(1); // Steps 1 to 7 (Step 3 split into 3A: Height, 3B: Weight)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say' | null>(null);
  const [sex, setSex] = useState<SexType | null>(null);
  
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  
  const [heightUnit, setHeightUnit] = useState<HeightUnitType>('cm');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  
  const [weightUnit, setWeightUnit] = useState<WeightUnitType>('kg');
  const [weightVal, setWeightVal] = useState(''); // Stores raw input for either kg or lb
  
  const [activityLevel, setActivityLevel] = useState<ActivityLevelType | null>(null);
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoalType | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced' | null>(null);

  // Get current progress labels and percentage
  const getProgressInfo = (currentStep: number) => {
    switch (currentStep) {
      case 1: // Name
        return { label: 'Step 1 of 8', percent: 12 };
      case 2: // Gender & Sex
        return { label: 'Step 2 of 8', percent: 25 };
      case 3: // DOB
        return { label: 'Step 3 of 8', percent: 37 };
      case 4: // Height
        return { label: 'Step 4 of 8', percent: 50 };
      case 5: // Weight
        return { label: 'Step 4 of 8', percent: 50 };
      case 6: // Activity Level
        return { label: 'Step 5 of 8', percent: 62 };
      case 7: // Fitness Goal
        return { label: 'Step 6 of 8', percent: 75 };
      case 8: // Experience Level
        return { label: 'Step 7 of 8', percent: 87 };
      case 9: // Confirmation
        return { label: 'Step 8 of 8', percent: 100 };
      default:
        return { label: '', percent: 0 };
    }
  };

  // Convert inputs to standardized database values
  const getCalculatedHeightCm = (): number => {
    if (heightUnit === 'cm') {
      return parseFloat(heightCm) || 0;
    } else {
      const feet = parseFloat(heightFt) || 0;
      const inches = parseFloat(heightIn) || 0;
      const totalInches = (feet * 12) + inches;
      return Math.round(totalInches * 2.54 * 10) / 10; // 1 decimal place
    }
  };

  const getCalculatedWeightKg = (): number => {
    const rawVal = parseFloat(weightVal) || 0;
    if (weightUnit === 'kg') {
      return rawVal;
    } else {
      return Math.round(rawVal * 0.45359237 * 10) / 10; // 1 decimal place
    }
  };

  const getCalculatedAge = (): number => {
    const day = parseInt(dobDay, 10);
    const month = parseInt(dobMonth, 10);
    const year = parseInt(dobYear, 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;

    const today = new Date();
    let age = today.getFullYear() - year;
    const m = today.getMonth() - (month - 1);
    if (m < 0 || (m === 0 && today.getDate() < day)) {
      age--;
    }
    return age;
  };

  // Validate current step
  const handleNext = () => {
    setError(null);

    if (step === 1) {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!gender) {
        setError('Please select your gender identity.');
        return;
      }
      if (!sex) {
        setError('Please select your biological sex.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const day = parseInt(dobDay, 10);
      const month = parseInt(dobMonth, 10);
      const year = parseInt(dobYear, 10);

      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        setError('Please enter a valid date of birth.');
        return;
      }

      if (day < 1 || day > 31) {
        setError('Day must be between 1 and 31.');
        return;
      }

      if (month < 1 || month > 12) {
        setError('Month must be between 1 and 12.');
        return;
      }

      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        setError(`Year must be between 1900 and ${currentYear}.`);
        return;
      }

      const dobDate = new Date(year, month - 1, day);
      if (
        dobDate.getFullYear() !== year ||
        dobDate.getMonth() !== month - 1 ||
        dobDate.getDate() !== day
      ) {
        setError('The date you entered is invalid.');
        return;
      }

      const age = getCalculatedAge();
      if (age < 13 || age > 100) {
        setError('Age must be between 13 and 100 years old.');
        return;
      }

      setStep(4);
    } else if (step === 4) {
      const val = getCalculatedHeightCm();
      if (isNaN(val) || val < 100 || val > 250) {
        setError('Height must be between 100 cm and 250 cm (3\'3" - 8\'2").');
        return;
      }
      setStep(5);
    } else if (step === 5) {
      const val = getCalculatedWeightKg();
      if (isNaN(val) || val < 30 || val > 300) {
        setError('Weight must be between 30 kg and 300 kg (66 lbs - 661 lbs).');
        return;
      }
      setStep(6);
    } else if (step === 6) {
      if (!activityLevel) {
        setError('Please select your activity level.');
        return;
      }
      setStep(7);
    } else if (step === 7) {
      if (!fitnessGoal) {
        setError('Please select your main fitness goal.');
        return;
      }
      setStep(8);
    } else if (step === 8) {
      if (!experienceLevel) {
        setError('Please select your experience level.');
        return;
      }
      setStep(9);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !gender || !sex || !activityLevel || !fitnessGoal || !experienceLevel) return;

    const day = parseInt(dobDay, 10);
    const month = parseInt(dobMonth, 10);
    const year = parseInt(dobYear, 10);

    const formattedMonth = month < 10 ? `0${month}` : `${month}`;
    const formattedDay = day < 10 ? `0${day}` : `${day}`;
    const dateOfBirthStr = `${year}-${formattedMonth}-${formattedDay}`;

    const heightValCm = getCalculatedHeightCm();
    const weightValKg = getCalculatedWeightKg();

    // 1. Calculate nutrition metrics using the pure utility function
    const profileData: UserProfile = {
      sex,
      date_of_birth: dateOfBirthStr,
      height_cm: heightValCm,
      weight_kg: weightValKg,
      activity_level: activityLevel,
      fitness_goal: fitnessGoal,
      full_name: fullName,
      gender,
      experience_level: experienceLevel,
    };
    const calculatedMetrics = calculateNutritionMetrics(profileData);

    setLoading(true);
    setError(null);

    // Bypass live database writes during local testing overlay mode
    if (session.user.id === 'mock-user-id-12345') {
      setTimeout(() => {
        setLoading(false);
        onComplete(calculatedMetrics);
      }, 1000);
      return;
    }

    try {
      // 1. Save to user_profiles
      const { error: insertProfileError } = await supabase.from('user_profiles').insert({
        id: session.user.id,
        sex,
        date_of_birth: dateOfBirthStr,
        height_cm: Math.round(heightValCm),
        weight_kg: Math.round(weightValKg),
        activity_level: activityLevel,
        fitness_goal: fitnessGoal,
        full_name: fullName,
        gender,
        experience_level: experienceLevel,
      });

      if (insertProfileError) throw insertProfileError;

      // 2. Save calculated metrics to user_metrics
      const { error: insertMetricsError } = await supabase.from('user_metrics').insert({
        id: session.user.id,
        bmi: calculatedMetrics.bmi,
        bmr: calculatedMetrics.bmr,
        tdee: calculatedMetrics.tdee,
        daily_calorie_goal: calculatedMetrics.daily_calorie_goal,
        protein_g: calculatedMetrics.protein_g,
        fat_g: calculatedMetrics.fat_g,
        carbs_g: calculatedMetrics.carbs_g,
      });

      if (insertMetricsError) throw insertMetricsError;

      onComplete(calculatedMetrics);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper formatting for height/weight display
  const getHeightDisplayString = () => {
    const cm = getCalculatedHeightCm();
    const feet = Math.floor(cm / 30.48);
    const inches = Math.round((cm % 30.48) / 2.54);
    const adjustedInches = inches === 12 ? 0 : inches;
    const adjustedFeet = inches === 12 ? feet + 1 : feet;
    return `${cm} cm (${adjustedFeet}'${adjustedInches}")`;
  };

  const getWeightDisplayString = () => {
    const kg = getCalculatedWeightKg();
    const lbs = Math.round(kg * 2.20462262);
    return `${kg} kg (${lbs} lbs)`;
  };

  const getActivityDisplayLabel = () => {
    switch (activityLevel) {
      case 'sedentary': return 'Sedentary';
      case 'light': return 'Lightly active';
      case 'moderate': return 'Moderately active';
      case 'active': return 'Very active';
      case 'very_active': return 'Extremely active';
      default: return '';
    }
  };

  const getGoalDisplayLabel = () => {
    switch (fitnessGoal) {
      case 'lose': return 'Lose fat';
      case 'maintain': return 'Maintain weight';
      case 'gain': return 'Build muscle';
      case 'recomposition': return 'Body recomposition';
      default: return '';
    }
  };

  // Step screens markup
  const renderStepContent = () => {
    switch (step) {
      case 1: // Name Screen
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.questionText}>What is your full name?</Text>
            <Text style={styles.subtext}>
              How should we address you in your fitness dashboard?
            </Text>
            <TextInput
              style={styles.largeTextInput}
              placeholder="e.g. Midhun Nikhil"
              placeholderTextColor="#7A7A7A"
              maxLength={50}
              autoFocus={true}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
        );

      case 2: // Gender & Biological Sex
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.questionText}>Gender Identity & Biological Sex</Text>
            <Text style={styles.subtext}>
              Choose your gender identity, plus biological sex for formulas.
            </Text>

            <Text style={styles.sectionLabel}>GENDER IDENTITY</Text>
            <View style={{ height: 50, marginBottom: 16 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                {([
                  { key: 'male', label: 'Male' },
                  { key: 'female', label: 'Female' },
                  { key: 'non_binary', label: 'Non-binary' },
                  { key: 'other', label: 'Other' },
                  { key: 'prefer_not_to_say', label: 'Prefer not to say' },
                ] as const).map((g) => (
                  <TouchableOpacity
                    key={g.key}
                    style={[styles.pillCard, gender === g.key && styles.activePillCard]}
                    onPress={() => setGender(g.key)}
                  >
                    <Text style={[styles.pillText, gender === g.key && styles.activePillText]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.sectionLabel}>BIOLOGICAL SEX (FOR BMR EQUATIONS)</Text>
            <View style={styles.dualRow}>
              <TouchableOpacity
                style={[styles.halfOptionCard, sex === 'male' && styles.activeOptionCard]}
                onPress={() => setSex('male')}
              >
                <Text style={[styles.optionTitle, sex === 'male' && styles.activeOptionTitle]}>
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.halfOptionCard, sex === 'female' && styles.activeOptionCard]}
                onPress={() => setSex('female')}
              >
                <Text style={[styles.optionTitle, sex === 'female' && styles.activeOptionTitle]}>
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3: // DOB
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.questionText}>When were you born?</Text>
            <Text style={styles.subtext}>
              We use this instead of age for more accurate results over time.
            </Text>

            <View style={styles.dobRow}>
              <View style={styles.dobInputCol}>
                <Text style={styles.dobLabel}>Day</Text>
                <TextInput
                  style={styles.dobInput}
                  placeholder="DD"
                  placeholderTextColor="#4B5563"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={dobDay}
                  onChangeText={setDobDay}
                />
              </View>

              <View style={styles.dobInputCol}>
                <Text style={styles.dobLabel}>Month</Text>
                <TextInput
                  style={styles.dobInput}
                  placeholder="MM"
                  placeholderTextColor="#4B5563"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={dobMonth}
                  onChangeText={setDobMonth}
                />
              </View>

              <View style={styles.dobInputCol}>
                <Text style={styles.dobLabel}>Year</Text>
                <TextInput
                  style={[styles.dobInput, styles.dobYearInput]}
                  placeholder="YYYY"
                  placeholderTextColor="#4B5563"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={dobYear}
                  onChangeText={setDobYear}
                />
              </View>
            </View>
          </View>
        );

      case 4: // Height Screen
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.questionText}>What's your height?</Text>
            
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleButton, heightUnit === 'cm' && styles.toggleButtonActive]}
                onPress={() => setHeightUnit('cm')}
              >
                <Text style={[styles.toggleButtonText, heightUnit === 'cm' && styles.toggleButtonTextActive]}>
                  cm
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, heightUnit === 'ft-in' && styles.toggleButtonActive]}
                onPress={() => setHeightUnit('ft-in')}
              >
                <Text style={[styles.toggleButtonText, heightUnit === 'ft-in' && styles.toggleButtonTextActive]}>
                  ft-in
                </Text>
              </TouchableOpacity>
            </View>

            {heightUnit === 'cm' ? (
              <View style={styles.singleInputContainer}>
                <TextInput
                  style={styles.largeInput}
                  placeholder="170"
                  placeholderTextColor="#4B5563"
                  keyboardType="number-pad"
                  maxLength={3}
                  value={heightCm}
                  onChangeText={setHeightCm}
                />
                <Text style={styles.inputSuffix}>cm</Text>
              </View>
            ) : (
              <View style={styles.multiInputContainer}>
                <View style={styles.splitInputCol}>
                  <TextInput
                    style={styles.largeInput}
                    placeholder="5"
                    placeholderTextColor="#4B5563"
                    keyboardType="number-pad"
                    maxLength={1}
                    value={heightFt}
                    onChangeText={setHeightFt}
                  />
                  <Text style={styles.inputLabelBelow}>ft</Text>
                </View>
                <View style={styles.splitInputCol}>
                  <TextInput
                    style={styles.largeInput}
                    placeholder="7"
                    placeholderTextColor="#4B5563"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={heightIn}
                    onChangeText={setHeightIn}
                  />
                  <Text style={styles.inputLabelBelow}>in</Text>
                </View>
              </View>
            )}
          </View>
        );

      case 5: // Weight Screen
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.questionText}>What's your current weight?</Text>
            
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleButton, weightUnit === 'kg' && styles.toggleButtonActive]}
                onPress={() => setWeightUnit('kg')}
              >
                <Text style={[styles.toggleButtonText, weightUnit === 'kg' && styles.toggleButtonTextActive]}>
                  kg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, weightUnit === 'lb' && styles.toggleButtonActive]}
                onPress={() => setWeightUnit('lb')}
              >
                <Text style={[styles.toggleButtonText, weightUnit === 'lb' && styles.toggleButtonTextActive]}>
                  lb
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.singleInputContainer}>
              <TextInput
                style={styles.largeInput}
                placeholder={weightUnit === 'kg' ? '70' : '150'}
                placeholderTextColor="#4B5563"
                keyboardType="numeric"
                maxLength={5}
                value={weightVal}
                onChangeText={setWeightVal}
              />
              <Text style={styles.inputSuffix}>{weightUnit}</Text>
            </View>
          </View>
        );

      case 6: // Activity Screen
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.questionText}>How active is your daily life, outside of workouts?</Text>
            <Text style={styles.subtext}>Be honest — this directly affects your calorie target.</Text>

            <ScrollView style={styles.optionsList}>
              {[
                { key: 'sedentary', title: 'Sedentary', desc: 'Desk job, little to no exercise' },
                { key: 'light', title: 'Lightly active', desc: 'Light exercise 1–3 days/week' },
                { key: 'moderate', title: 'Moderately active', desc: 'Moderate exercise 3–5 days/week' },
                { key: 'active', title: 'Very active', desc: 'Hard exercise 6–7 days/week' },
                { key: 'very_active', title: 'Extremely active', desc: 'Physical job plus daily training' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.optionItem,
                    activityLevel === item.key && styles.optionItemActive,
                  ]}
                  onPress={() => setActivityLevel(item.key as ActivityLevelType)}
                >
                  <Text style={styles.optionItemTitle}>{item.title}</Text>
                  <Text style={styles.optionItemDesc}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 7: // Goal Screen
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.questionText}>What's your main goal right now?</Text>
            <Text style={styles.subtext}>We use this to establish calorie budgets.</Text>

            <ScrollView style={styles.optionsList}>
              {[
                { key: 'lose', title: 'Lose fat', desc: 'Create a deficit to reduce body fat percentage' },
                { key: 'maintain', title: 'Maintain weight', desc: 'Balance energy intake to hold current weight' },
                { key: 'gain', title: 'Build muscle', desc: 'Slight surplus to support muscle mass development' },
                { key: 'recomposition', title: 'Body recomposition', desc: 'Lose fat and gain muscle simultaneously' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.optionItem,
                    fitnessGoal === item.key && styles.optionItemActive,
                  ]}
                  onPress={() => setFitnessGoal(item.key as FitnessGoalType)}
                >
                  <Text style={styles.optionItemTitle}>{item.title}</Text>
                  <Text style={styles.optionItemDesc}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 8: // Experience Level Screen
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.questionText}>What is your experience level?</Text>
            <Text style={styles.subtext}>
              This helps tailor recommendations to your athletic baseline.
            </Text>

            <TouchableOpacity
              style={[styles.optionCard, experienceLevel === 'beginner' && styles.activeOptionCard]}
              onPress={() => setExperienceLevel('beginner')}
            >
              <Text style={[styles.optionTitle, experienceLevel === 'beginner' && styles.activeOptionTitle]}>
                Beginner
              </Text>
              <Text style={styles.optionSubtitle}>New to structured physical training</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, experienceLevel === 'intermediate' && styles.activeOptionCard]}
              onPress={() => setExperienceLevel('intermediate')}
            >
              <Text style={[styles.optionTitle, experienceLevel === 'intermediate' && styles.activeOptionTitle]}>
                Intermediate
              </Text>
              <Text style={styles.optionSubtitle}>Consistently training for 1-2 years</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, experienceLevel === 'advanced' && styles.activeOptionCard]}
              onPress={() => setExperienceLevel('advanced')}
            >
              <Text style={[styles.optionTitle, experienceLevel === 'advanced' && styles.activeOptionTitle]}>
                Advanced
              </Text>
              <Text style={styles.optionSubtitle}>Years of training, seeking performance peak</Text>
            </TouchableOpacity>
          </View>
        );

      case 9: // Confirmation Screen
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.questionText}>Verify your information</Text>
            <Text style={styles.subtext}>Make sure everything is correct before final setup.</Text>

            <ScrollView style={styles.summaryListScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.summaryList}>
                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabelCol}>
                    <Text style={styles.summaryLabel}>Full Name</Text>
                    <Text style={styles.summaryValue}>{fullName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setStep(1)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabelCol}>
                    <Text style={styles.summaryLabel}>Gender / Sex</Text>
                    <Text style={styles.summaryValue}>
                      {gender === 'non_binary' ? 'Non-binary' : gender === 'prefer_not_to_say' ? 'Prefer not to say' : gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : ''} ({sex === 'male' ? 'Male' : 'Female'} BMR)
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setStep(2)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabelCol}>
                    <Text style={styles.summaryLabel}>Date of Birth</Text>
                    <Text style={styles.summaryValue}>
                      {dobYear}-{dobMonth.padStart(2, '0')}-{dobDay.padStart(2, '0')} (Age: {getCalculatedAge()})
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setStep(3)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabelCol}>
                    <Text style={styles.summaryLabel}>Height</Text>
                    <Text style={styles.summaryValue}>{getHeightDisplayString()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setStep(4)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabelCol}>
                    <Text style={styles.summaryLabel}>Current Weight</Text>
                    <Text style={styles.summaryValue}>{getWeightDisplayString()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setStep(5)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabelCol}>
                    <Text style={styles.summaryLabel}>Activity Level</Text>
                    <Text style={styles.summaryValue}>{getActivityDisplayLabel()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setStep(6)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabelCol}>
                    <Text style={styles.summaryLabel}>Main Goal</Text>
                    <Text style={styles.summaryValue}>{getGoalDisplayLabel()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setStep(7)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summaryItem}>
                  <View style={styles.summaryLabelCol}>
                    <Text style={styles.summaryLabel}>Experience Level</Text>
                    <Text style={styles.summaryValue}>
                      {experienceLevel ? experienceLevel.charAt(0).toUpperCase() + experienceLevel.slice(1) : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setStep(8)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <Text style={styles.disclaimerText}>
              This information helps us personalize your plan. Govio doesn't provide medical advice — consult a doctor for health concerns.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const progressInfo = getProgressInfo(step);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>{progressInfo.label}</Text>
            <Text style={styles.percentageText}>{progressInfo.percent}%</Text>
          </View>
          <View style={styles.progressBarOuter}>
            <View style={[styles.progressBarInner, { width: `${progressInfo.percent}%` }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {error && (
              <View style={styles.errorAlert}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {renderStepContent()}

            <View style={styles.buttonRow}>
              {step > 1 && (
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.nextButton, loading && styles.disabledButton]}
                onPress={step === 9 ? handleSubmit : handleNext}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.nextButtonText}>
                    {step === 9 ? 'Confirm & Finish' : 'Continue'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  keyboardView: {
    flex: 1,
  },
  progressBarWrapper: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    color: '#A0A0A0',
    fontSize: 13,
    fontWeight: '700',
  },
  percentageText: {
    color: '#D4FF13',
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarOuter: {
    height: 6,
    backgroundColor: '#1E1E1E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: '#D4FF13',
    borderRadius: 3,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2D2D37',
    minHeight: 460,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  stepContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#A0A0A0',
    marginBottom: 24,
    lineHeight: 20,
  },
  optionCard: {
    backgroundColor: '#242424',
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  activeOptionCard: {
    borderColor: '#D4FF13',
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#A0A0A0',
  },
  activeOptionTitle: {
    color: '#FFFFFF',
  },
  dobRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dobInputCol: {
    flex: 1,
    marginHorizontal: 4,
  },
  dobLabel: {
    color: '#A0A0A0',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dobInput: {
    backgroundColor: '#242424',
    color: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  dobYearInput: {
    flexGrow: 1.5,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2D2D37',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#2A2A2A',
  },
  toggleButtonText: {
    color: '#A0A0A0',
    fontWeight: '700',
    fontSize: 13,
  },
  toggleButtonTextActive: {
    color: '#D4FF13',
  },
  singleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    paddingHorizontal: 16,
  },
  largeInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    paddingVertical: 14,
  },
  inputSuffix: {
    color: '#A0A0A0',
    fontSize: 16,
    fontWeight: '800',
  },
  multiInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitInputCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    paddingHorizontal: 16,
    marginHorizontal: 6,
  },
  inputLabelBelow: {
    color: '#A0A0A0',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  optionsList: {
    maxHeight: 280,
  },
  optionItem: {
    backgroundColor: '#242424',
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  optionItemActive: {
    borderColor: '#D4FF13',
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
  },
  optionItemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionItemDesc: {
    fontSize: 13,
    color: '#A0A0A0',
    lineHeight: 18,
  },
  summaryList: {
    backgroundColor: '#121212',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    padding: 16,
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D37',
  },
  summaryLabelCol: {
    flex: 1,
  },
  summaryLabel: {
    color: '#7A7A7A',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  editText: {
    color: '#D4FF13',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#7A7A7A',
    lineHeight: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#4B5563',
    borderRadius: 30, // rounded pill
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#A0A0A0',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#D4FF13',
    borderRadius: 30, // rounded pill
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  nextButtonText: {
    color: '#121212',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  largeTextInput: {
    backgroundColor: '#242424',
    color: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#7A7A7A',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  pillsScroll: {
    flexDirection: 'row',
  },
  pillCard: {
    backgroundColor: '#242424',
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePillCard: {
    borderColor: '#D4FF13',
    backgroundColor: 'rgba(212, 255, 19, 0.1)',
  },
  pillText: {
    color: '#A0A0A0',
    fontWeight: '700',
    fontSize: 13,
  },
  activePillText: {
    color: '#FFFFFF',
  },
  dualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -4,
  },
  halfOptionCard: {
    flex: 1,
    backgroundColor: '#242424',
    borderWidth: 1.5,
    borderColor: '#2D2D37',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  summaryListScroll: {
    maxHeight: 280,
  },
});
