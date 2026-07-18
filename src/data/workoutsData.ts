export interface Workout {
  id: string;
  title: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  calories: string;
  description: string;
  
  // Recommendation Metadata
  age_groups: ('Teen' | 'Young Adult' | 'Adult' | 'Senior')[];
  experience_levels: ('beginner' | 'intermediate' | 'advanced')[];
  workout_locations: ('gym' | 'home')[];
  equipment_levels: ('none' | 'some' | 'full')[];
  fitness_goals: ('gain' | 'lose' | 'maintain' | 'recomposition' | 'endurance' | 'strength')[];
  
  exercisesList: {
    id: string;
    name: string;
    muscle_group: string;
    sets: number;
    reps: string;
  }[];
}

export const POPULAR_WORKOUTS: Workout[] = [
  // Existing Workouts (Preserved)
  {
    id: 'popular-1',
    title: 'HIIT Cardio Burn',
    duration: '20 Min',
    difficulty: 'Intermediate',
    calories: '220 Kcal',
    description: 'A high-intensity interval training designed to burn fat rapidly, improve cardiovascular endurance, and kickstart your metabolism.',
    age_groups: ['Teen', 'Young Adult', 'Adult'],
    experience_levels: ['intermediate', 'advanced'],
    workout_locations: ['home', 'gym'],
    equipment_levels: ['none', 'some', 'full'],
    fitness_goals: ['lose', 'maintain', 'endurance'],
    exercisesList: [
      { id: 'ex-8', name: 'Plank', muscle_group: 'core', sets: 3, reps: '60 sec' },
      { id: 'ex-13', name: 'Push-up', muscle_group: 'chest', sets: 3, reps: '12 reps' },
      { id: 'ex-7', name: 'Lunges', muscle_group: 'legs', sets: 3, reps: '12 reps' },
    ],
  },
  {
    id: 'popular-2',
    title: 'Upper Body Strength',
    duration: '45 Min',
    difficulty: 'Advanced',
    calories: '380 Kcal',
    description: 'Focus on building lean muscle mass and power across your chest, back, shoulders, and arms with this heavy compound routine.',
    age_groups: ['Young Adult', 'Adult'],
    experience_levels: ['advanced'],
    workout_locations: ['gym'],
    equipment_levels: ['full'],
    fitness_goals: ['gain', 'maintain', 'strength'],
    exercisesList: [
      { id: 'ex-1', name: 'Bench Press', muscle_group: 'chest', sets: 4, reps: '8-10 reps' },
      { id: 'ex-5', name: 'Pull-up', muscle_group: 'back', sets: 4, reps: '8 reps' },
      { id: 'ex-6', name: 'Barbell Row', muscle_group: 'back', sets: 3, reps: '10 reps' },
      { id: 'ex-4', name: 'Overhead Press', muscle_group: 'shoulders', sets: 3, reps: '10 reps' },
    ],
  },
  {
    id: 'popular-3',
    title: 'Core Stability & Flow',
    duration: '30 Min',
    difficulty: 'Beginner',
    calories: '150 Kcal',
    description: 'Strengthen your core foundation, improve your posture, and enhance stability with this bodyweight-only routine.',
    age_groups: ['Teen', 'Young Adult', 'Adult', 'Senior'],
    experience_levels: ['beginner', 'intermediate'],
    workout_locations: ['home', 'gym'],
    equipment_levels: ['none', 'some', 'full'],
    fitness_goals: ['lose', 'maintain', 'gain', 'recomposition'],
    exercisesList: [
      { id: 'ex-8', name: 'Plank', muscle_group: 'core', sets: 3, reps: '45 sec' },
      { id: 'ex-13', name: 'Push-up', muscle_group: 'chest', sets: 3, reps: '10 reps' },
      { id: 'ex-2', name: 'Squat', muscle_group: 'legs', sets: 3, reps: '15 reps' },
    ],
  },
  {
    id: 'popular-4',
    title: 'Fat Blast Circuit',
    duration: '25 Min',
    difficulty: 'Beginner',
    calories: '260 Kcal',
    description: 'A metabolic conditioning circuit designed to maximize calorie burn, fat loss, and endurance.',
    age_groups: ['Teen', 'Young Adult', 'Adult'],
    experience_levels: ['beginner', 'intermediate'],
    workout_locations: ['home', 'gym'],
    equipment_levels: ['none', 'some', 'full'],
    fitness_goals: ['lose', 'endurance'],
    exercisesList: [
      { id: 'ex-8', name: 'Plank', muscle_group: 'core', sets: 3, reps: '45 sec' },
      { id: 'ex-7', name: 'Lunges', muscle_group: 'legs', sets: 3, reps: '12 reps' },
    ],
  },
  {
    id: 'popular-5',
    title: 'Hypertrophy Power Split',
    duration: '50 Min',
    difficulty: 'Advanced',
    calories: '410 Kcal',
    description: 'Heavy lifting focused on triggering maximum muscle hypertrophy for advanced lifters looking to gain muscle.',
    age_groups: ['Young Adult', 'Adult'],
    experience_levels: ['advanced'],
    workout_locations: ['gym'],
    equipment_levels: ['full'],
    fitness_goals: ['gain', 'strength'],
    exercisesList: [
      { id: 'ex-1', name: 'Bench Press', muscle_group: 'chest', sets: 4, reps: '8-10 reps' },
      { id: 'ex-6', name: 'Barbell Row', muscle_group: 'back', sets: 3, reps: '10 reps' },
    ],
  },
  {
    id: 'popular-6',
    title: 'Full Body Conditioning',
    duration: '35 Min',
    difficulty: 'Intermediate',
    calories: '300 Kcal',
    description: 'A balanced full body conditioning routine using compound movements to maintain fitness level.',
    age_groups: ['Young Adult', 'Adult', 'Senior'],
    experience_levels: ['intermediate'],
    workout_locations: ['home', 'gym'],
    equipment_levels: ['none', 'some', 'full'],
    fitness_goals: ['maintain', 'lose', 'endurance'],
    exercisesList: [
      { id: 'ex-2', name: 'Squat', muscle_group: 'legs', sets: 3, reps: '15 reps' },
      { id: 'ex-13', name: 'Push-up', muscle_group: 'chest', sets: 3, reps: '10 reps' },
    ],
  },

  // Teen Specific Workouts
  {
    id: 'teen-1',
    title: 'Teen Bodyweight Builder',
    duration: '20 Min',
    difficulty: 'Beginner',
    calories: '180 Kcal',
    description: 'A dynamic, safe bodyweight program designed for teens to build strength, learn correct posture, and stay active.',
    age_groups: ['Teen'],
    experience_levels: ['beginner', 'intermediate'],
    workout_locations: ['home', 'gym'],
    equipment_levels: ['none', 'some', 'full'],
    fitness_goals: ['gain', 'maintain', 'strength'],
    exercisesList: [
      { id: 'ex-13', name: 'Push-up', muscle_group: 'chest', sets: 3, reps: '8 reps' },
      { id: 'ex-8', name: 'Plank', muscle_group: 'core', sets: 3, reps: '30 sec' },
      { id: 'ex-2', name: 'Squat', muscle_group: 'legs', sets: 3, reps: '10 reps' },
    ],
  },
  {
    id: 'teen-2',
    title: 'Teen Endurance Athlete',
    duration: '25 Min',
    difficulty: 'Intermediate',
    calories: '240 Kcal',
    description: 'Speed and stamina training designed for young athletes. Improves cardiac health and muscle endurance.',
    age_groups: ['Teen'],
    experience_levels: ['intermediate', 'advanced'],
    workout_locations: ['home', 'gym'],
    equipment_levels: ['none', 'some', 'full'],
    fitness_goals: ['endurance', 'lose'],
    exercisesList: [
      { id: 'ex-7', name: 'Walking Lunge', muscle_group: 'legs', sets: 3, reps: '15 reps' },
      { id: 'ex-8', name: 'Plank', muscle_group: 'core', sets: 3, reps: '45 sec' },
    ],
  },

  // Senior Specific Workouts
  {
    id: 'senior-1',
    title: 'Senior Balance & Mobility',
    duration: '15 Min',
    difficulty: 'Beginner',
    calories: '90 Kcal',
    description: 'Gentle stretching and stability routine focused on joint health, balance control, and postural flexibility for seniors.',
    age_groups: ['Senior'],
    experience_levels: ['beginner', 'intermediate'],
    workout_locations: ['home', 'gym'],
    equipment_levels: ['none', 'some', 'full'],
    fitness_goals: ['maintain', 'endurance'],
    exercisesList: [
      { id: 'ex-8', name: 'Plank', muscle_group: 'core', sets: 2, reps: '20 sec' },
      { id: 'ex-13', name: 'Push-up', muscle_group: 'chest', sets: 2, reps: '8 reps' },
    ],
  },
  {
    id: 'senior-2',
    title: 'Senior Active Strength',
    duration: '20 Min',
    difficulty: 'Beginner',
    calories: '120 Kcal',
    description: 'Light resistance training using basic home items or dumbbells to maintain bone density and muscular vigor.',
    age_groups: ['Senior'],
    experience_levels: ['beginner', 'intermediate'],
    workout_locations: ['home', 'gym'],
    equipment_levels: ['some', 'full'],
    fitness_goals: ['strength', 'maintain'],
    exercisesList: [
      { id: 'ex-9', name: 'Dumbbell Bicep Curl', muscle_group: 'biceps', sets: 3, reps: '10 reps' },
      { id: 'ex-12', name: 'Lateral Raise', muscle_group: 'shoulders', sets: 3, reps: '8-10 reps' },
    ],
  },

  // Home Specific Workouts
  {
    id: 'home-1',
    title: 'Home Bodyweight Shred',
    duration: '30 Min',
    difficulty: 'Intermediate',
    calories: '280 Kcal',
    description: 'High-intensity home cardio session requiring zero equipment. Fast pace to torch calories.',
    age_groups: ['Teen', 'Young Adult', 'Adult'],
    experience_levels: ['intermediate', 'advanced'],
    workout_locations: ['home'],
    equipment_levels: ['none', 'some', 'full'],
    fitness_goals: ['lose', 'endurance'],
    exercisesList: [
      { id: 'ex-13', name: 'Push-up', muscle_group: 'chest', sets: 3, reps: '15 reps' },
      { id: 'ex-8', name: 'Plank', muscle_group: 'core', sets: 3, reps: '60 sec' },
      { id: 'ex-7', name: 'Walking Lunge', muscle_group: 'legs', sets: 3, reps: '20 reps' },
    ],
  },
  {
    id: 'home-2',
    title: 'Home Dumbbell Muscle Sculpt',
    duration: '40 Min',
    difficulty: 'Intermediate',
    calories: '320 Kcal',
    description: 'Targeted hypertrophy session using basic dumbbells. Perfect for building shape and muscle at home.',
    age_groups: ['Young Adult', 'Adult'],
    experience_levels: ['intermediate', 'advanced'],
    workout_locations: ['home'],
    equipment_levels: ['some', 'full'],
    fitness_goals: ['gain', 'recomposition', 'strength'],
    exercisesList: [
      { id: 'ex-9', name: 'Dumbbell Bicep Curl', muscle_group: 'biceps', sets: 4, reps: '12 reps' },
      { id: 'ex-12', name: 'Lateral Raise', muscle_group: 'shoulders', sets: 3, reps: '12 reps' },
      { id: 'ex-7', name: 'Walking Lunge', muscle_group: 'legs', sets: 3, reps: '12 reps' },
    ],
  },

  // Gym Specific Workouts
  {
    id: 'gym-1',
    title: 'Gym Machine Introduction',
    duration: '35 Min',
    difficulty: 'Beginner',
    calories: '200 Kcal',
    description: 'A beginner-friendly gym circuit utilizing basic resistance machines for safety, control, and muscle activation.',
    age_groups: ['Teen', 'Young Adult', 'Adult', 'Senior'],
    experience_levels: ['beginner', 'intermediate'],
    workout_locations: ['gym'],
    equipment_levels: ['full'],
    fitness_goals: ['maintain', 'gain', 'recomposition'],
    exercisesList: [
      { id: 'ex-11', name: 'Leg Press', muscle_group: 'legs', sets: 3, reps: '12 reps' },
      { id: 'ex-10', name: 'Triceps Pushdown', muscle_group: 'triceps', sets: 3, reps: '12 reps' },
    ],
  },
  {
    id: 'gym-2',
    title: 'Compound Strength Builder',
    duration: '50 Min',
    difficulty: 'Advanced',
    calories: '420 Kcal',
    description: 'A heavy compound movement split targeting raw power, bone density, and total body strength.',
    age_groups: ['Young Adult', 'Adult'],
    experience_levels: ['advanced'],
    workout_locations: ['gym'],
    equipment_levels: ['full'],
    fitness_goals: ['strength', 'gain'],
    exercisesList: [
      { id: 'ex-1', name: 'Bench Press', muscle_group: 'chest', sets: 4, reps: '6-8 reps' },
      { id: 'ex-2', name: 'Barbell Squat', muscle_group: 'legs', sets: 4, reps: '6-8 reps' },
      { id: 'ex-3', name: 'Deadlift', muscle_group: 'back', sets: 3, reps: '5 reps' },
      { id: 'ex-4', name: 'Overhead Press', muscle_group: 'shoulders', sets: 3, reps: '8 reps' },
    ],
  }
];
