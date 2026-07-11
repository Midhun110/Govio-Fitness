import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

type ResultsScreenProps = {
  route: ResultsScreenRouteProp;
};

export default function ResultsScreen({ route }: ResultsScreenProps) {
  const { metrics, onFinish } = route.params;

  // Calorie calculations for macros
  const proteinCal = metrics.protein_g * 4;
  const fatCal = metrics.fat_g * 9;
  const carbsCal = metrics.carbs_g * 4;
  const totalCalCalculated = proteinCal + fatCal + carbsCal;

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#3B82F6' };
    if (bmi < 25) return { label: 'Normal weight', color: '#10B981' };
    if (bmi < 30) return { label: 'Overweight', color: '#F59E0B' };
    return { label: 'Obese', color: '#EF4444' };
  };

  const bmiCat = getBmiCategory(metrics.bmi);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logoText}>GOVIO</Text>
          <Text style={styles.tagline}>Your Nutrition Blueprint</Text>
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.title}>Your Personalized Target</Text>
          
          {/* Calorie Goal Front and Center */}
          <View style={styles.calorieContainer}>
            <Text style={styles.calorieNumber}>
              {metrics.daily_calorie_goal.toLocaleString()}
            </Text>
            <Text style={styles.calorieLabel}>kcal / day</Text>
          </View>

          {/* Macros Section */}
          <View style={styles.macrosSection}>
            <Text style={styles.sectionTitle}>Daily Macronutrient Splits</Text>
            
            {/* Protein Card */}
            <View style={[styles.macroCard, { borderLeftColor: '#D4FF13' }]}>
              <View style={styles.macroRow}>
                <Text style={styles.macroName}>Protein</Text>
                <Text style={styles.macroGrams}>{metrics.protein_g} g</Text>
              </View>
              <View style={styles.progressBarOuter}>
                <View 
                  style={[
                    styles.progressBarInner, 
                    { 
                      backgroundColor: '#D4FF13', 
                      width: `${Math.round((proteinCal / totalCalCalculated) * 100)}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.macroCalorieLabel}>
                {proteinCal} kcal • {Math.round((proteinCal / totalCalCalculated) * 100)}% of daily target
              </Text>
            </View>

            {/* Carbs Card */}
            <View style={[styles.macroCard, { borderLeftColor: '#06B6D4' }]}>
              <View style={styles.macroRow}>
                <Text style={styles.macroName}>Carbohydrates</Text>
                <Text style={styles.macroGrams}>{metrics.carbs_g} g</Text>
              </View>
              <View style={styles.progressBarOuter}>
                <View 
                  style={[
                    styles.progressBarInner, 
                    { 
                      backgroundColor: '#06B6D4', 
                      width: `${Math.round((carbsCal / totalCalCalculated) * 100)}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.macroCalorieLabel}>
                {carbsCal} kcal • {Math.round((carbsCal / totalCalCalculated) * 100)}% of daily target
              </Text>
            </View>

            {/* Fat Card */}
            <View style={[styles.macroCard, { borderLeftColor: '#F59E0B' }]}>
              <View style={styles.macroRow}>
                <Text style={styles.macroName}>Fat</Text>
                <Text style={styles.macroGrams}>{metrics.fat_g} g</Text>
              </View>
              <View style={styles.progressBarOuter}>
                <View 
                  style={[
                    styles.progressBarInner, 
                    { 
                      backgroundColor: '#F59E0B', 
                      width: `${Math.round((fatCal / totalCalCalculated) * 100)}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.macroCalorieLabel}>
                {fatCal} kcal • {Math.round((fatCal / totalCalCalculated) * 100)}% of daily target
              </Text>
            </View>
          </View>

          {/* Secondary Health Metrics */}
          <View style={styles.secondarySection}>
            <Text style={styles.sectionTitle}>Secondary Metabolic Estimations</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>BMI</Text>
                <Text style={styles.metricValue}>{metrics.bmi}</Text>
                <Text style={[styles.metricSubtext, { color: bmiCat.color }]}>
                  {bmiCat.label}
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>BMR</Text>
                <Text style={styles.metricValue}>{Math.round(metrics.bmr)}</Text>
                <Text style={styles.metricSubtext}>kcal (Basal metabolic)</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>TDEE</Text>
                <Text style={styles.metricValue}>{Math.round(metrics.tdee)}</Text>
                <Text style={styles.metricSubtext}>kcal (Daily expend)</Text>
              </View>
            </View>
          </View>

          {/* Continue button */}
          <TouchableOpacity style={styles.continueButton} onPress={onFinish}>
            <Text style={styles.continueButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#D4FF13',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 13,
    color: '#A0A0A0',
    marginTop: 4,
  },
  mainCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#222222',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A0A0A0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 16,
  },
  calorieContainer: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: '#222222',
    marginBottom: 28,
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  calorieNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(212, 255, 19, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  calorieLabel: {
    fontSize: 14,
    color: '#D4FF13',
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macrosSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  macroCard: {
    backgroundColor: '#121212',
    borderRadius: 16,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#222222',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  macroName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  macroGrams: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  progressBarOuter: {
    height: 6,
    backgroundColor: '#000000',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 3,
  },
  macroCalorieLabel: {
    fontSize: 12,
    color: '#A0A0A0',
  },
  secondarySection: {
    marginBottom: 32,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#121212',
    borderWidth: 1.5,
    borderColor: '#222222',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#7A7A7A',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 10,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#D4FF13',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4FF13',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
