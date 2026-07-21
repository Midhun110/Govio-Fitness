export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  primary_muscle?: string;
  secondary_muscles?: string[];
  instructions?: string[];
  form_tips?: string[];
  common_mistakes?: string[];
  image_url?: any;
  user_id?: string;
  is_custom?: boolean;
  muscleFocusNote?: string;
  equipment_required?: 'gym_machine' | 'barbell' | 'dumbbell' | 'bodyweight' | 'resistance_band';
}

export const MOCK_EXERCISES: Exercise[] = [
  {
    "id": "ex-1",
    "name": "Bench Press",
    "equipment_required": "barbell",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major",
    "secondary_muscles": [
      "Triceps",
      "Anterior Deltoids"
    ],
    "instructions": [
      "Lie on flat bench. Grip barbell slightly wider than shoulder-width.",
      "Lower bar to chest.",
      "Press bar back up."
    ],
    "form_tips": [
      "Keep feet flat on floor.",
      "Keep elbows at 45 degree angle."
    ],
    "common_mistakes": [
      "Bouncing bar off chest."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-16",
    "name": "Incline Dumbbell Press",
    "equipment_required": "dumbbell",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major (Upper)",
    "secondary_muscles": [
      "Anterior Deltoids",
      "Triceps"
    ],
    "instructions": [
      "Lie on incline bench at 30-45 degrees.",
      "Press dumbbells up from chest level.",
      "Lower under control."
    ],
    "form_tips": [
      "Maintain solid arch in lower back.",
      "Keep wrists stacked directly over elbows."
    ],
    "common_mistakes": [
      "Pressing at too steep an angle."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-17",
    "name": "Cable Chest Fly",
    "equipment_required": "gym_machine",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major",
    "secondary_muscles": [
      "Anterior Deltoids"
    ],
    "instructions": [
      "Stand between cable pulleys in middle position.",
      "Bring hands together in wide arc.",
      "Return to start feeling stretch."
    ],
    "form_tips": [
      "Slight bend in elbows throughout.",
      "Engage core to prevent torso rotation."
    ],
    "common_mistakes": [
      "Turning the fly into a press."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-18",
    "name": "Dips (Chest Focus)",
    "equipment_required": "bodyweight",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major (Lower)",
    "secondary_muscles": [
      "Triceps",
      "Anterior Deltoids"
    ],
    "instructions": [
      "Support body on dip bars.",
      "Lean torso forward and bend elbows to lower body.",
      "Press back up to lock out."
    ],
    "form_tips": [
      "Keep elbows slightly flared.",
      "Maintain forward lean."
    ],
    "common_mistakes": [
      "Staying too upright (shifts focus to triceps)."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-chest-1",
    "name": "Push-Up",
    "equipment_required": "bodyweight",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major",
    "secondary_muscles": [
      "Triceps",
      "Anterior Deltoids"
    ],
    "instructions": [
      "Start in high plank position.",
      "Lower chest to floor.",
      "Push back up."
    ],
    "form_tips": [
      "Keep body in straight line.",
      "Elbows at 45 degrees."
    ],
    "common_mistakes": [
      "Sagging hips."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-chest-2",
    "name": "Dumbbell Floor Press",
    "equipment_required": "dumbbell",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major",
    "secondary_muscles": [
      "Triceps",
      "Anterior Deltoids"
    ],
    "instructions": [
      "Lie on floor with knees bent.",
      "Press dumbbells up from floor.",
      "Lower until elbows touch floor."
    ],
    "form_tips": [
      "Control the descent.",
      "Keep lower back flat."
    ],
    "common_mistakes": [
      "Bouncing elbows."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-chest-3",
    "name": "Dumbbell Chest Fly",
    "equipment_required": "dumbbell",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major",
    "secondary_muscles": [
      "Anterior Deltoids"
    ],
    "instructions": [
      "Lie on back holding dumbbells above chest.",
      "Lower arms in wide arc.",
      "Bring back together squeezing chest."
    ],
    "form_tips": [
      "Slight bend in elbows."
    ],
    "common_mistakes": [
      "Lowering too deep."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-chest-4",
    "name": "Incline Push-Up",
    "equipment_required": "bodyweight",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major (Lower)",
    "secondary_muscles": [
      "Triceps",
      "Anterior Deltoids"
    ],
    "instructions": [
      "Place hands on elevated surface (bench/chair).",
      "Lower chest to surface.",
      "Push back up."
    ],
    "form_tips": [
      "Keep body straight.",
      "Brace core."
    ],
    "common_mistakes": [
      "Bending at hips."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-chest-5",
    "name": "Decline Push-Up",
    "equipment_required": "bodyweight",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major (Upper)",
    "secondary_muscles": [
      "Triceps",
      "Anterior Deltoids"
    ],
    "instructions": [
      "Place feet on elevated surface (bench/chair).",
      "Lower chest to floor.",
      "Push back up."
    ],
    "form_tips": [
      "Keep hips high and stable.",
      "Control descent."
    ],
    "common_mistakes": [
      "Sagging midsection."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-chest-6",
    "name": "Wide Push-Up",
    "equipment_required": "bodyweight",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major",
    "secondary_muscles": [
      "Triceps",
      "Anterior Deltoids"
    ],
    "instructions": [
      "High plank with hands wider than shoulder-width.",
      "Lower chest to floor.",
      "Push back up."
    ],
    "form_tips": [
      "Keep core engaged.",
      "Do not flare elbows excessively."
    ],
    "common_mistakes": [
      "Shallow range of motion."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-chest-7",
    "name": "Dumbbell Pullover",
    "equipment_required": "dumbbell",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major / Lats",
    "secondary_muscles": [
      "Triceps"
    ],
    "instructions": [
      "Lie on back holding single dumbbell over chest.",
      "Lower weight back overhead.",
      "Pull back to starting position."
    ],
    "form_tips": [
      "Slight bend in elbows.",
      "Keep lower back flat."
    ],
    "common_mistakes": [
      "Bending elbows too much."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-3",
    "name": "Deadlift",
    "equipment_required": "barbell",
    "muscle_group": "Back",
    "primary_muscle": "Hamstrings / Lower Back",
    "secondary_muscles": [
      "Glutes",
      "Upper Back"
    ],
    "instructions": [
      "Stand with feet hip-width apart under barbell.",
      "Hinge hips and bend knees to grip bar.",
      "Drive through legs to lift bar, locking out hips."
    ],
    "form_tips": [
      "Keep spine neutral.",
      "Bar close to shins."
    ],
    "common_mistakes": [
      "Rounding lower back."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-5",
    "name": "Pull-Up",
    "equipment_required": "bodyweight",
    "muscle_group": "Back",
    "primary_muscle": "Latissimus Dorsi",
    "secondary_muscles": [
      "Biceps",
      "Rhomboids"
    ],
    "instructions": [
      "Grip pull-up bar palms facing away.",
      "Pull chest up to bar.",
      "Lower under control."
    ],
    "form_tips": [
      "Full range of motion.",
      "Engage scapula first."
    ],
    "common_mistakes": [
      "Kipping or using momentum."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-6",
    "name": "Bent-Over Barbell Row",
    "equipment_required": "barbell",
    "muscle_group": "Back",
    "primary_muscle": "Latissimus Dorsi",
    "secondary_muscles": [
      "Rhomboids",
      "Biceps"
    ],
    "instructions": [
      "Hinge forward holding barbell.",
      "Pull bar to lower chest.",
      "Lower under control."
    ],
    "form_tips": [
      "Keep back flat.",
      "Drive elbows up."
    ],
    "common_mistakes": [
      "Standing too upright."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-12",
    "name": "Lat Pulldown",
    "equipment_required": "gym_machine",
    "muscle_group": "Back",
    "primary_muscle": "Latissimus Dorsi",
    "secondary_muscles": [
      "Biceps",
      "Rhomboids"
    ],
    "instructions": [
      "Sit at pulley station.",
      "Pull bar down to upper chest.",
      "Return slowly."
    ],
    "form_tips": [
      "Keep chest up.",
      "Lean slightly back."
    ],
    "common_mistakes": [
      "Pulling behind neck."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-19",
    "name": "Seated Cable Row",
    "equipment_required": "gym_machine",
    "muscle_group": "Back",
    "primary_muscle": "Rhomboids / Lats",
    "secondary_muscles": [
      "Biceps",
      "Forearms"
    ],
    "instructions": [
      "Sit at cable station with feet on platform.",
      "Pull handle to abdomen.",
      "Extend arms fully to return."
    ],
    "form_tips": [
      "Maintain upright posture.",
      "Squeeze shoulder blades."
    ],
    "common_mistakes": [
      "Leaning too far back."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-back-1",
    "name": "Dumbbell Row",
    "equipment_required": "dumbbell",
    "muscle_group": "Back",
    "primary_muscle": "Latissimus Dorsi",
    "secondary_muscles": [
      "Rhomboids",
      "Biceps"
    ],
    "instructions": [
      "Support knee and hand on flat surface.",
      "Pull dumbbell to hip.",
      "Lower slowly."
    ],
    "form_tips": [
      "Keep spine flat.",
      "Pull with elbow."
    ],
    "common_mistakes": [
      "Torso rotation."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-back-2",
    "name": "Superman",
    "equipment_required": "bodyweight",
    "muscle_group": "Back",
    "primary_muscle": "Erector Spinae",
    "secondary_muscles": [
      "Hamstrings"
    ],
    "instructions": [
      "Lie face down on floor.",
      "Lift arms, chest, and legs off floor.",
      "Hold for 2 seconds, then lower."
    ],
    "form_tips": [
      "Keep neck neutral.",
      "Squeeze lower back gently."
    ],
    "common_mistakes": [
      "Jerking neck."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-back-3",
    "name": "Single Arm Dumbbell Row",
    "equipment_required": "dumbbell",
    "muscle_group": "Back",
    "primary_muscle": "Latissimus Dorsi",
    "secondary_muscles": [
      "Biceps"
    ],
    "instructions": [
      "Stand in staggered stance holding dumbbell.",
      "Hinge forward and pull dumbbell to hip.",
      "Lower with control."
    ],
    "form_tips": [
      "Support opposite hand on thigh.",
      "Keep back straight."
    ],
    "common_mistakes": [
      "Rounding shoulders."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-back-4",
    "name": "Resistance Band Row",
    "equipment_required": "resistance_band",
    "muscle_group": "Back",
    "primary_muscle": "Latissimus Dorsi",
    "secondary_muscles": [
      "Biceps",
      "Rear Delts"
    ],
    "instructions": [
      "Loop band around feet or anchor.",
      "Hold handles and pull to chest.",
      "Extend arms slowly."
    ],
    "form_tips": [
      "Maintain straight back.",
      "Keep elbows tucked."
    ],
    "common_mistakes": [
      "Shrugging shoulders."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-back-5",
    "name": "Bird Dog",
    "equipment_required": "bodyweight",
    "muscle_group": "Back",
    "primary_muscle": "Erector Spinae / Core",
    "secondary_muscles": [
      "Hamstrings"
    ],
    "instructions": [
      "Start on hands and knees.",
      "Extend opposite arm and leg straight out.",
      "Hold for 2 seconds, return and switch."
    ],
    "form_tips": [
      "Keep hips level.",
      "Do not arch back too much."
    ],
    "common_mistakes": [
      "Lifting leg too high."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-back-6",
    "name": "Inverted Bodyweight Row",
    "equipment_required": "bodyweight",
    "muscle_group": "Back",
    "primary_muscle": "Latissimus Dorsi",
    "secondary_muscles": [
      "Biceps"
    ],
    "instructions": [
      "Lie under sturdy table or bar.",
      "Grip edge and pull chest up.",
      "Lower slowly."
    ],
    "form_tips": [
      "Keep body straight like a plank.",
      "Pull shoulders back."
    ],
    "common_mistakes": [
      "Sagging hips."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-back-7",
    "name": "Resistance Band Pull-Apart",
    "equipment_required": "resistance_band",
    "muscle_group": "Back",
    "primary_muscle": "Rhomboids / Rear Delts",
    "secondary_muscles": [
      "Trapezius"
    ],
    "instructions": [
      "Hold band out in front at shoulder height.",
      "Pull hands apart out to sides.",
      "Return to start slowly."
    ],
    "form_tips": [
      "Keep arms straight but not locked.",
      "Squeeze shoulder blades."
    ],
    "common_mistakes": [
      "Using momentum."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-4",
    "name": "Overhead Press",
    "equipment_required": "barbell",
    "muscle_group": "Shoulders",
    "primary_muscle": "Anterior Deltoids",
    "secondary_muscles": [
      "Triceps",
      "Lateral Deltoids"
    ],
    "instructions": [
      "Stand holding barbell at shoulder level.",
      "Press bar straight overhead.",
      "Lower under control."
    ],
    "form_tips": [
      "Squeeze glutes and core.",
      "Keep wrists aligned."
    ],
    "common_mistakes": [
      "Excessive arching of back."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-21",
    "name": "Face Pull",
    "equipment_required": "gym_machine",
    "muscle_group": "Shoulders",
    "primary_muscle": "Posterior Deltoids",
    "secondary_muscles": [
      "Rhomboids",
      "Rotator Cuff"
    ],
    "instructions": [
      "Hold rope handles from high pulley.",
      "Pull hands toward ears keeping elbows high.",
      "Return under control."
    ],
    "form_tips": [
      "Squeeze upper back.",
      "Rotate hands out at end."
    ],
    "common_mistakes": [
      "Using too much weight."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-22",
    "name": "Upright Row",
    "equipment_required": "barbell",
    "muscle_group": "Shoulders",
    "primary_muscle": "Lateral Deltoids / Traps",
    "secondary_muscles": [
      "Biceps",
      "Brachialis"
    ],
    "instructions": [
      "Stand holding barbell in front.",
      "Pull bar up close to body to upper chest.",
      "Lower with control."
    ],
    "form_tips": [
      "Keep elbows above hands.",
      "Do not pull too high."
    ],
    "common_mistakes": [
      "Jerking weight up."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-shoulder-1",
    "name": "Arnold Press",
    "equipment_required": "dumbbell",
    "muscle_group": "Shoulders",
    "primary_muscle": "Anterior Deltoids",
    "secondary_muscles": [
      "Lateral Deltoids",
      "Triceps"
    ],
    "instructions": [
      "Hold dumbbells palms facing in.",
      "Rotate palms out as you press up.",
      "Reverse rotation as you lower."
    ],
    "form_tips": [
      "Control the rotation.",
      "Brace core."
    ],
    "common_mistakes": [
      "Pressing too fast."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-shoulder-2",
    "name": "Lateral Raise",
    "equipment_required": "dumbbell",
    "muscle_group": "Shoulders",
    "primary_muscle": "Lateral Deltoids",
    "secondary_muscles": [
      "Anterior Deltoids"
    ],
    "instructions": [
      "Stand holding dumbbells at sides.",
      "Raise arms to sides to shoulder height.",
      "Lower slowly."
    ],
    "form_tips": [
      "Slight bend in elbows.",
      "Pinkies slightly up at top."
    ],
    "common_mistakes": [
      "Swinging torso."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-shoulder-3",
    "name": "Pike Push-Up",
    "equipment_required": "bodyweight",
    "muscle_group": "Shoulders",
    "primary_muscle": "Anterior Deltoids",
    "secondary_muscles": [
      "Triceps",
      "Upper Chest"
    ],
    "instructions": [
      "Start in push-up position, hike hips high.",
      "Lower head toward floor.",
      "Push back up."
    ],
    "form_tips": [
      "Keep core engaged.",
      "Elbows back slightly."
    ],
    "common_mistakes": [
      "Flaring elbows."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-shoulder-4",
    "name": "Dumbbell Shoulder Press",
    "equipment_required": "dumbbell",
    "muscle_group": "Shoulders",
    "primary_muscle": "Anterior Deltoids",
    "secondary_muscles": [
      "Triceps"
    ],
    "instructions": [
      "Hold dumbbells at shoulder height palms forward.",
      "Press overhead.",
      "Lower with control."
    ],
    "form_tips": [
      "Do not arch lower back.",
      "Keep wrists straight."
    ],
    "common_mistakes": [
      "Leaning back."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-shoulder-5",
    "name": "Dumbbell Front Raise",
    "equipment_required": "dumbbell",
    "muscle_group": "Shoulders",
    "primary_muscle": "Anterior Deltoids",
    "secondary_muscles": [
      "Lateral Deltoids"
    ],
    "instructions": [
      "Hold dumbbells in front of thighs palms down.",
      "Raise arms to shoulder height.",
      "Lower slowly."
    ],
    "form_tips": [
      "Slight elbow bend.",
      "Control descent."
    ],
    "common_mistakes": [
      "Using body swing."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-shoulder-6",
    "name": "Shoulder Tap",
    "equipment_required": "bodyweight",
    "muscle_group": "Shoulders",
    "primary_muscle": "Anterior Deltoids / Core",
    "secondary_muscles": [
      "Triceps"
    ],
    "instructions": [
      "Start in high plank position.",
      "Tap opposite shoulder with hand.",
      "Alternate sides keeping hips still."
    ],
    "form_tips": [
      "Brace core tightly.",
      "Minimize hip rocking."
    ],
    "common_mistakes": [
      "Swinging hips."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-shoulder-7",
    "name": "Bent-Over Dumbbell Reverse Fly",
    "equipment_required": "dumbbell",
    "muscle_group": "Shoulders",
    "primary_muscle": "Posterior Deltoids",
    "secondary_muscles": [
      "Rhomboids"
    ],
    "instructions": [
      "Hinge forward holding dumbbells.",
      "Raise arms out to sides.",
      "Lower slowly."
    ],
    "form_tips": [
      "Squeeze shoulder blades.",
      "Keep neck neutral."
    ],
    "common_mistakes": [
      "Swinging weights."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-9",
    "name": "Barbell Curl",
    "equipment_required": "barbell",
    "muscle_group": "Biceps",
    "primary_muscle": "Biceps Brachii",
    "secondary_muscles": [
      "Forearms"
    ],
    "instructions": [
      "Stand holding barbell palms forward.",
      "Curl bar to shoulders.",
      "Lower slowly."
    ],
    "form_tips": [
      "Keep elbows locked at sides.",
      "Avoid body swing."
    ],
    "common_mistakes": [
      "Using momentum."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-25",
    "name": "Preacher Curl",
    "equipment_required": "barbell",
    "muscle_group": "Biceps",
    "primary_muscle": "Biceps (Short Head)",
    "secondary_muscles": [
      "Brachialis"
    ],
    "instructions": [
      "Sit at preacher bench, arms resting on pad.",
      "Curl bar toward chin.",
      "Lower fully."
    ],
    "form_tips": [
      "Keep back of arms flat on pad.",
      "Do not swing shoulders."
    ],
    "common_mistakes": [
      "Incomplete range of motion."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-26",
    "name": "Cable Curl",
    "equipment_required": "gym_machine",
    "muscle_group": "Biceps",
    "primary_muscle": "Biceps Brachii",
    "secondary_muscles": [
      "Brachioradialis"
    ],
    "instructions": [
      "Attach bar to low pulley.",
      "Curl bar up keeping elbows in.",
      "Lower slowly."
    ],
    "form_tips": [
      "Squeeze biceps at top.",
      "Stand tall."
    ],
    "common_mistakes": [
      "Elbows moving forward."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-bicep-1",
    "name": "Hammer Curl (Brick, Wood, or Water Bottle)",
    "equipment_required": "bodyweight",
    "muscle_group": "Biceps",
    "primary_muscle": "Brachialis / Biceps",
    "secondary_muscles": [
      "Forearms"
    ],
    "instructions": [
      "Hold a brick, wood piece, or filled water bottle in each hand, palms facing in.",
      "Curl the weights up by bending at the elbows while keeping palms facing in.",
      "Lower slowly."
    ],
    "form_tips": [
      "Keep elbows still at your sides.",
      "Squeeze your biceps at the top."
    ],
    "common_mistakes": [
      "Swinging shoulders or back."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-bicep-2",
    "name": "Concentration Curl",
    "equipment_required": "dumbbell",
    "muscle_group": "Biceps",
    "primary_muscle": "Biceps Brachii",
    "secondary_muscles": [],
    "instructions": [
      "Sit and rest elbow on inner thigh.",
      "Curl dumbbell toward shoulder.",
      "Lower fully."
    ],
    "form_tips": [
      "Keep arm isolated.",
      "Focus on bicep contraction."
    ],
    "common_mistakes": [
      "Moving the thigh."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-bicep-3",
    "name": "Chin-Up",
    "equipment_required": "bodyweight",
    "muscle_group": "Biceps",
    "primary_muscle": "Biceps Brachii",
    "secondary_muscles": [
      "Lats",
      "Forearms"
    ],
    "instructions": [
      "Grip bar underhand (palms facing you).",
      "Pull chest to bar.",
      "Lower fully."
    ],
    "form_tips": [
      "Engage biceps fully.",
      "Full extension at bottom."
    ],
    "common_mistakes": [
      "Using swing."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-bicep-4",
    "name": "Bicep Curl (Brick, Wood, or Water Bottle)",
    "equipment_required": "bodyweight",
    "muscle_group": "Biceps",
    "primary_muscle": "Biceps Brachii",
    "secondary_muscles": [
      "Forearms"
    ],
    "instructions": [
      "Stand holding a brick, wood piece, or filled water bottle in each hand, palms out.",
      "Curl the objects up toward your shoulders, keeping upper arms still.",
      "Lower slowly."
    ],
    "form_tips": [
      "Keep elbows pinned to your sides.",
      "Keep your wrists straight and locked."
    ],
    "common_mistakes": [
      "Swinging your body to raise the weights."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-bicep-5",
    "name": "Dumbbell Reverse Curl",
    "equipment_required": "dumbbell",
    "muscle_group": "Biceps",
    "primary_muscle": "Brachioradialis",
    "secondary_muscles": [
      "Forearms",
      "Biceps"
    ],
    "instructions": [
      "Hold dumbbells overhand palms down.",
      "Curl up keeping palms down.",
      "Lower slowly."
    ],
    "form_tips": [
      "Strengthens wrists and biceps.",
      "Control descent."
    ],
    "common_mistakes": [
      "Letting wrists sag."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-bicep-6",
    "name": "Resistance Band Bicep Curl",
    "equipment_required": "resistance_band",
    "muscle_group": "Biceps",
    "primary_muscle": "Biceps Brachii",
    "secondary_muscles": [
      "Forearms"
    ],
    "instructions": [
      "Stand on band, hold handles palms up.",
      "Curl hands to shoulders.",
      "Lower slowly."
    ],
    "form_tips": [
      "Brace core.",
      "Maintain tension throughout."
    ],
    "common_mistakes": [
      "Standing too loose on band."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-bicep-7",
    "name": "Resistance Band Hammer Curl",
    "equipment_required": "resistance_band",
    "muscle_group": "Biceps",
    "primary_muscle": "Brachialis",
    "secondary_muscles": [
      "Forearms"
    ],
    "instructions": [
      "Stand on band, hold handles palms facing each other.",
      "Curl hands up.",
      "Lower slowly."
    ],
    "form_tips": [
      "Keep neutral wrists.",
      "Pin elbows to sides."
    ],
    "common_mistakes": [
      "Torso movement."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-27",
    "name": "Close-Grip Bench Press",
    "equipment_required": "barbell",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii",
    "secondary_muscles": [
      "Chest",
      "Anterior Delts"
    ],
    "instructions": [
      "Lie on flat bench. Grip bar shoulder-width.",
      "Lower bar to chest.",
      "Press back up."
    ],
    "form_tips": [
      "Keep elbows tucked.",
      "Maintain flat wrists."
    ],
    "common_mistakes": [
      "Grip too narrow."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-28",
    "name": "Tricep Pushdown",
    "equipment_required": "gym_machine",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii",
    "secondary_muscles": [],
    "instructions": [
      "Hold bar/rope on high pulley.",
      "Push down extending elbows fully.",
      "Return to start slowly."
    ],
    "form_tips": [
      "Keep elbows pinned to sides.",
      "Control descent."
    ],
    "common_mistakes": [
      "Using bodyweight to press."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-30",
    "name": "Skull Crusher",
    "equipment_required": "barbell",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii",
    "secondary_muscles": [],
    "instructions": [
      "Lie on bench holding barbell overhead.",
      "Lower bar to forehead by bending elbows.",
      "Press back up."
    ],
    "form_tips": [
      "Keep upper arms vertical.",
      "Keep elbows from flaring."
    ],
    "common_mistakes": [
      "Moving upper arms."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-tricep-1",
    "name": "Bench Dip",
    "equipment_required": "bodyweight",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii",
    "secondary_muscles": [
      "Shoulders",
      "Chest"
    ],
    "instructions": [
      "Place hands on bench/chair behind you.",
      "Lower hips bending elbows.",
      "Press back up."
    ],
    "form_tips": [
      "Keep back close to bench.",
      "90 degree bend in elbows."
    ],
    "common_mistakes": [
      "Going too low."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-tricep-2",
    "name": "Overhead Tricep Extension",
    "equipment_required": "dumbbell",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps (Long Head)",
    "secondary_muscles": [],
    "instructions": [
      "Hold dumbbell overhead with both hands.",
      "Lower weight behind head.",
      "Press back up."
    ],
    "form_tips": [
      "Keep elbows pointing forward.",
      "Brace core."
    ],
    "common_mistakes": [
      "Flaring elbows."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-tricep-3",
    "name": "Tricep Kickback",
    "equipment_required": "dumbbell",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii",
    "secondary_muscles": [],
    "instructions": [
      "Hinge forward holding dumbbells.",
      "Extend arms back fully.",
      "Return to start."
    ],
    "form_tips": [
      "Keep upper arms stationary.",
      "Fully contract tricep."
    ],
    "common_mistakes": [
      "Dropping upper arms."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-tricep-4",
    "name": "Diamond Push-Up",
    "equipment_required": "bodyweight",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii",
    "secondary_muscles": [
      "Chest"
    ],
    "instructions": [
      "High plank with hands close forming diamond.",
      "Lower chest to hands.",
      "Push back up."
    ],
    "form_tips": [
      "Keep elbows tucked.",
      "Drop to knees if needed."
    ],
    "common_mistakes": [
      "Flaring elbows."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-tricep-5",
    "name": "Close-Grip Push-Up",
    "equipment_required": "bodyweight",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii",
    "secondary_muscles": [
      "Chest"
    ],
    "instructions": [
      "High plank with hands shoulder-width.",
      "Lower chest keeping elbows close to body.",
      "Push back up."
    ],
    "form_tips": [
      "Elbows brush ribcage.",
      "Keep body in line."
    ],
    "common_mistakes": [
      "Elbows flaring."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-tricep-6",
    "name": "Dumbbell Skull Crusher",
    "equipment_required": "dumbbell",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii",
    "secondary_muscles": [],
    "instructions": [
      "Lie on back holding dumbbells overhead.",
      "Bend elbows to lower dumbbells near ears.",
      "Extend arms back up."
    ],
    "form_tips": [
      "Keep elbows pointing up.",
      "Control descent."
    ],
    "common_mistakes": [
      "Moving upper arms."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-tricep-7",
    "name": "Tricep Dip on Chair",
    "equipment_required": "bodyweight",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii",
    "secondary_muscles": [
      "Shoulders"
    ],
    "instructions": [
      "Place hands on seat of sturdy chair.",
      "Lower hips toward floor.",
      "Push back up."
    ],
    "form_tips": [
      "Keep knees bent for easier variation.",
      "Chest up."
    ],
    "common_mistakes": [
      "Shrugging shoulders."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-2",
    "name": "Barbell Squat",
    "equipment_required": "barbell",
    "muscle_group": "Legs",
    "primary_muscle": "Quadriceps",
    "secondary_muscles": [
      "Glutes",
      "Hamstrings"
    ],
    "instructions": [
      "Rest barbell on upper back.",
      "Squat down bending knees.",
      "Drive back up to stand."
    ],
    "form_tips": [
      "Keep chest up.",
      "Knees track over toes."
    ],
    "common_mistakes": [
      "Knees caving in."
    ],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  },
  {
    "id": "ex-11",
    "name": "Leg Press",
    "equipment_required": "gym_machine",
    "muscle_group": "Legs",
    "primary_muscle": "Quadriceps",
    "secondary_muscles": [
      "Glutes",
      "Hamstrings"
    ],
    "instructions": [
      "Sit in leg press machine.",
      "Lower weight sled to chest.",
      "Press back up."
    ],
    "form_tips": [
      "Do not lock knees.",
      "Keep lower back flat."
    ],
    "common_mistakes": [
      "Too deep range of motion."
    ],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  },
  {
    "id": "ex-14",
    "name": "Romanian Deadlift",
    "equipment_required": "barbell",
    "muscle_group": "Legs",
    "primary_muscle": "Hamstrings",
    "secondary_muscles": [
      "Glutes",
      "Lower Back"
    ],
    "instructions": [
      "Hold barbell at hips.",
      "Hinge hips backward lowering bar to shins.",
      "Return to stand."
    ],
    "form_tips": [
      "Keep knees slightly soft.",
      "Flat back."
    ],
    "common_mistakes": [
      "Rounding spine."
    ],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  },
  {
    "id": "ex-h-leg-1",
    "name": "Walking Lunge",
    "equipment_required": "dumbbell",
    "muscle_group": "Legs",
    "primary_muscle": "Quadriceps",
    "secondary_muscles": [
      "Glutes",
      "Hamstrings"
    ],
    "instructions": [
      "Step forward, bend knees.",
      "Push off front foot to step forward.",
      "Alternate legs."
    ],
    "form_tips": [
      "Keep torso upright.",
      "Front knee over ankle."
    ],
    "common_mistakes": [
      "Leaning too far forward."
    ],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  },
  {
    "id": "ex-h-leg-2",
    "name": "Bodyweight Squat",
    "equipment_required": "bodyweight",
    "muscle_group": "Legs",
    "primary_muscle": "Quadriceps",
    "secondary_muscles": [
      "Glutes",
      "Hamstrings"
    ],
    "instructions": [
      "Stand feet shoulder-width apart.",
      "Lower hips down.",
      "Return to stand."
    ],
    "form_tips": [
      "Weight on heels.",
      "Keep chest up."
    ],
    "common_mistakes": [
      "Knees caving."
    ],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  },
  {
    "id": "ex-h-leg-3",
    "name": "Sumo Squat",
    "equipment_required": "bodyweight",
    "muscle_group": "Legs",
    "primary_muscle": "Quadriceps",
    "secondary_muscles": [
      "Inner Thighs"
    ],
    "instructions": [
      "Wide stance, toes out 45 degrees.",
      "Lower hips down.",
      "Drive up to stand."
    ],
    "form_tips": [
      "Knees track toes.",
      "Upright posture."
    ],
    "common_mistakes": [
      "Knees collapsing."
    ],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  },
  {
    "id": "ex-h-leg-4",
    "name": "Step-Up",
    "equipment_required": "bodyweight",
    "muscle_group": "Legs",
    "primary_muscle": "Quadriceps",
    "secondary_muscles": [
      "Glutes"
    ],
    "instructions": [
      "Step onto sturdy platform.",
      "Drive up to stand on it.",
      "Step back down."
    ],
    "form_tips": [
      "Push through front heel.",
      "Stable step."
    ],
    "common_mistakes": [
      "Pushing off back foot."
    ],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  },
  {
    "id": "ex-h-leg-5",
    "name": "Wall Sit",
    "equipment_required": "bodyweight",
    "muscle_group": "Legs",
    "primary_muscle": "Quadriceps",
    "secondary_muscles": [
      "Hamstrings"
    ],
    "instructions": [
      "Back flat against wall.",
      "Slide down until knees are 90 degrees.",
      "Hold position."
    ],
    "form_tips": [
      "Feet flat.",
      "Keep breathing."
    ],
    "common_mistakes": [
      "Shallow bend."
    ],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  },
  {
    "id": "ex-h-leg-6",
    "name": "Dumbbell Goblet Squat",
    "equipment_required": "dumbbell",
    "muscle_group": "Legs",
    "primary_muscle": "Quadriceps",
    "secondary_muscles": [
      "Glutes",
      "Core"
    ],
    "instructions": [
      "Hold dumbbell vertically at chest.",
      "Squat down keeping weight close.",
      "Drive up to stand."
    ],
    "form_tips": [
      "Brace core.",
      "Keep elbows pointing down."
    ],
    "common_mistakes": [
      "Rounding back."
    ],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  },
  {
    "id": "ex-h-leg-7",
    "name": "Bodyweight Split Squat",
    "equipment_required": "bodyweight",
    "muscle_group": "Legs",
    "primary_muscle": "Quadriceps",
    "secondary_muscles": [
      "Glutes",
      "Hamstrings"
    ],
    "instructions": [
      "Stand in staggered split stance.",
      "Lower rear knee toward floor.",
      "Drive through front heel to start."
    ],
    "form_tips": [
      "Keep upright posture.",
      "Equal work on both legs."
    ],
    "common_mistakes": [
      "Front knee pushing too far forward."
    ],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  },
  {
    "id": "ex-33",
    "name": "Cable Crunch",
    "equipment_required": "gym_machine",
    "muscle_group": "Abs",
    "primary_muscle": "Rectus Abdominis",
    "secondary_muscles": [],
    "instructions": [
      "Kneel at high pulley holding rope.",
      "Flex spine to pull elbows to thighs.",
      "Return slowly."
    ],
    "form_tips": [
      "Use abs, not arms/hips.",
      "Keep hips stationary."
    ],
    "common_mistakes": [
      "Sitting back on heels."
    ],
    "image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600"
  },
  {
    "id": "ex-h-abs-1",
    "name": "Plank",
    "equipment_required": "bodyweight",
    "muscle_group": "Abs",
    "primary_muscle": "Rectus Abdominis / Core",
    "secondary_muscles": [
      "Shoulders"
    ],
    "instructions": [
      "Hold push-up position on elbows.",
      "Keep body in straight line.",
      "Hold for time."
    ],
    "form_tips": [
      "Engage core and glutes.",
      "Neutral neck."
    ],
    "common_mistakes": [
      "Sagging hips."
    ],
    "image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600"
  },
  {
    "id": "ex-h-abs-2",
    "name": "Hanging Leg Raise",
    "equipment_required": "bodyweight",
    "muscle_group": "Abs",
    "primary_muscle": "Lower Abs",
    "secondary_muscles": [
      "Forearms"
    ],
    "instructions": [
      "Hang from bar.",
      "Raise legs to 90 degrees.",
      "Lower slowly."
    ],
    "form_tips": [
      "Do not swing.",
      "Control descent."
    ],
    "common_mistakes": [
      "Using momentum."
    ],
    "image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600"
  },
  {
    "id": "ex-h-abs-3",
    "name": "Russian Twist",
    "equipment_required": "bodyweight",
    "muscle_group": "Abs",
    "primary_muscle": "Obliques",
    "secondary_muscles": [
      "Core"
    ],
    "instructions": [
      "Sit with knees bent, feet slightly off floor.",
      "Twist torso side to side.",
      "Repeat."
    ],
    "form_tips": [
      "Keep back straight.",
      "Move slowly."
    ],
    "common_mistakes": [
      "Rounding spine."
    ],
    "image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600"
  },
  {
    "id": "ex-h-abs-4",
    "name": "Bicycle Crunch",
    "equipment_required": "bodyweight",
    "muscle_group": "Abs",
    "primary_muscle": "Rectus Abdominis / Obliques",
    "secondary_muscles": [],
    "instructions": [
      "Lie on back, hands behind head.",
      "Alternate touching elbow to opposite knee.",
      "Keep cycling legs."
    ],
    "form_tips": [
      "Do not pull on neck.",
      "Twist from torso."
    ],
    "common_mistakes": [
      "Rushing repetitions."
    ],
    "image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600"
  },
  {
    "id": "ex-h-abs-5",
    "name": "Crunch",
    "equipment_required": "bodyweight",
    "muscle_group": "Abs",
    "primary_muscle": "Rectus Abdominis",
    "secondary_muscles": [],
    "instructions": [
      "Lie on back with knees bent.",
      "Curl shoulders off floor.",
      "Lower slowly."
    ],
    "form_tips": [
      "Exhale as you lift.",
      "No neck pulling."
    ],
    "common_mistakes": [
      "Lifting lower back."
    ],
    "image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600"
  },
  {
    "id": "ex-h-abs-6",
    "name": "Mountain Climber",
    "equipment_required": "bodyweight",
    "muscle_group": "Abs",
    "primary_muscle": "Rectus Abdominis",
    "secondary_muscles": [
      "Shoulders"
    ],
    "instructions": [
      "High plank position.",
      "Drive knees to chest alternately.",
      "Keep hips low."
    ],
    "form_tips": [
      "Align wrists under shoulders.",
      "Brace core."
    ],
    "common_mistakes": [
      "Bouncing hips."
    ],
    "image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600"
  },
  {
    "id": "ex-h-abs-7",
    "name": "Lying Leg Raise",
    "equipment_required": "bodyweight",
    "muscle_group": "Abs",
    "primary_muscle": "Lower Abs",
    "secondary_muscles": [],
    "instructions": [
      "Lie flat, raise legs to vertical.",
      "Lower slowly to just above floor.",
      "Repeat."
    ],
    "form_tips": [
      "Press lower back flat.",
      "Control descent."
    ],
    "common_mistakes": [
      "Arching back."
    ],
    "image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600"
  },
  {
    "id": "ex-36",
    "name": "Wrist Curl",
    "equipment_required": "barbell",
    "muscle_group": "Forearms",
    "primary_muscle": "Forearm Flexors",
    "secondary_muscles": [],
    "instructions": [
      "Rest forearms on bench holding barbell palms up.",
      "Curl wrists up.",
      "Lower slowly."
    ],
    "form_tips": [
      "Isolate wrists.",
      "Controlled movement."
    ],
    "common_mistakes": [
      "Lifting forearms off bench."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-37",
    "name": "Reverse Wrist Curl",
    "equipment_required": "barbell",
    "muscle_group": "Forearms",
    "primary_muscle": "Forearm Extensors",
    "secondary_muscles": [],
    "instructions": [
      "Rest forearms on bench holding barbell palms down.",
      "Curl wrists up.",
      "Lower slowly."
    ],
    "form_tips": [
      "Isolate wrist joint.",
      "Controlled reps."
    ],
    "common_mistakes": [
      "Forearms lifting."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-40",
    "name": "Plate Pinch Hold",
    "equipment_required": "dumbbell",
    "muscle_group": "Forearms",
    "primary_muscle": "Forearm Flexors (Grip)",
    "secondary_muscles": [],
    "instructions": [
      "Pinch two plates together smooth sides out.",
      "Hold at sides for time.",
      "Set down carefully."
    ],
    "form_tips": [
      "Keep wrists straight.",
      "Maintain firm pinch."
    ],
    "common_mistakes": [
      "Shrugging shoulders."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-forearm-1",
    "name": "Farmer's Carry",
    "equipment_required": "dumbbell",
    "muscle_group": "Forearms",
    "primary_muscle": "Forearms / Grip",
    "secondary_muscles": [
      "Core",
      "Traps"
    ],
    "instructions": [
      "Carry heavy dumbbells in each hand.",
      "Walk forward slowly maintaining posture.",
      "Put down with control."
    ],
    "form_tips": [
      "Stand tall.",
      "Brace core."
    ],
    "common_mistakes": [
      "Leaning forward."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-forearm-2",
    "name": "Dead Hang",
    "equipment_required": "bodyweight",
    "muscle_group": "Forearms",
    "primary_muscle": "Forearm Flexors (Grip)",
    "secondary_muscles": [],
    "instructions": [
      "Hang from bar.",
      "Keep shoulders slightly engaged.",
      "Hold for time."
    ],
    "form_tips": [
      "Active shoulders.",
      "Steady breathing."
    ],
    "common_mistakes": [
      "Swinging."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-forearm-3",
    "name": "Dumbbell Wrist Curl",
    "equipment_required": "dumbbell",
    "muscle_group": "Forearms",
    "primary_muscle": "Forearm Flexors",
    "secondary_muscles": [],
    "instructions": [
      "Rest forearms on thighs holding dumbbells palms up.",
      "Curl wrists up.",
      "Lower slowly."
    ],
    "form_tips": [
      "Isolate the wrists.",
      "Full range of motion."
    ],
    "common_mistakes": [
      "Lifting elbows."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-forearm-4",
    "name": "Dumbbell Reverse Wrist Curl",
    "equipment_required": "dumbbell",
    "muscle_group": "Forearms",
    "primary_muscle": "Forearm Extensors",
    "secondary_muscles": [],
    "instructions": [
      "Rest forearms on thighs holding dumbbells palms down.",
      "Curl wrists up.",
      "Lower slowly."
    ],
    "form_tips": [
      "Isolate wrists.",
      "Controlled speed."
    ],
    "common_mistakes": [
      "Using arm movement."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-forearm-5",
    "name": "Towel Dead Hang",
    "equipment_required": "bodyweight",
    "muscle_group": "Forearms",
    "primary_muscle": "Forearm Flexors (Grip)",
    "secondary_muscles": [],
    "instructions": [
      "Drape towel over bar.",
      "Grip towel ends and hang.",
      "Hold for time."
    ],
    "form_tips": [
      "Active shoulders.",
      "Squeeze grip hard."
    ],
    "common_mistakes": [
      "Swinging."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-forearm-6",
    "name": "Dumbbell Farmer's Walk",
    "equipment_required": "dumbbell",
    "muscle_group": "Forearms",
    "primary_muscle": "Forearms (Grip)",
    "secondary_muscles": [
      "Shoulders"
    ],
    "instructions": [
      "Hold dumbbells at sides.",
      "Walk in straight line.",
      "Hold grip firmly."
    ],
    "form_tips": [
      "Chest high.",
      "Do not shrug."
    ],
    "common_mistakes": [
      "Rushing steps."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-forearm-7",
    "name": "Behind-the-Back Wrist Curl",
    "equipment_required": "dumbbell",
    "muscle_group": "Forearms",
    "primary_muscle": "Forearm Flexors",
    "secondary_muscles": [],
    "instructions": [
      "Stand holding dumbbells behind your back palms facing away.",
      "Curl wrists upward.",
      "Lower slowly."
    ],
    "form_tips": [
      "Control the weight.",
      "Keep arms straight."
    ],
    "common_mistakes": [
      "Using shoulder shrug."
    ],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-h-senior-1",
    "name": "Jumping Jacks (Gentle Cardio)",
    "equipment_required": "bodyweight",
    "muscle_group": "Abs",
    "primary_muscle": "Heart / Full Body",
    "secondary_muscles": ["Calves", "Shoulders"],
    "instructions": [
      "Stand with feet together and arms at your sides.",
      "Slightly bend knees, jump feet out to the sides while raising arms overhead.",
      "Jump back to the starting position."
    ],
    "form_tips": [
      "Land softly on the balls of your feet.",
      "Keep arms slightly bent if shoulder joints are stiff."
    ],
    "common_mistakes": [
      "Landing heavily on heels."
    ],
    "image_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600"
  },
  {
    "id": "ex-h-senior-2",
    "name": "Wall Push-Up (Gentle Chest & Arms)",
    "equipment_required": "bodyweight",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major",
    "secondary_muscles": ["Triceps", "Anterior Deltoids"],
    "instructions": [
      "Stand facing a wall, about arm's length away.",
      "Place your hands flat on the wall at shoulder height and shoulder-width apart.",
      "Slowly bend your elbows to bring your chest close to the wall.",
      "Push back to return to the starting position."
    ],
    "form_tips": [
      "Keep your body in a straight line from head to heels.",
      "Do not round your shoulders."
    ],
    "common_mistakes": [
      "Letting your hips sag toward the wall."
    ],
    "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600"
  },
  {
    "id": "ex-h-senior-3",
    "name": "Chair Squat (Gentle Leg Strength)",
    "equipment_required": "bodyweight",
    "muscle_group": "Legs",
    "primary_muscle": "Quadriceps",
    "secondary_muscles": ["Glutes", "Hamstrings"],
    "instructions": [
      "Stand tall in front of a sturdy chair, feet shoulder-width apart.",
      "Slowly lower your hips back and down to sit lightly on the chair.",
      "Press through your heels to stand back up."
    ],
    "form_tips": [
      "Keep your chest lifted as you descend.",
      "Do not rush the movement; keep it controlled."
    ],
    "common_mistakes": [
      "Letting knees cave inward."
    ],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  },
  {
    "id": "ex-h-senior-4",
    "name": "Standing Arm Circles (Shoulder Mobility)",
    "equipment_required": "bodyweight",
    "muscle_group": "Shoulders",
    "primary_muscle": "Deltoids",
    "secondary_muscles": ["Upper Back"],
    "instructions": [
      "Stand tall with feet shoulder-width apart.",
      "Extend your arms out to the sides at shoulder height, palms down.",
      "Perform slow, small forward circles, then reverse direction after 10-15 seconds."
    ],
    "form_tips": [
      "Keep your shoulders relaxed, not shrugged.",
      "Keep circles small and controlled."
    ],
    "common_mistakes": [
      "Flailing arms or moving too fast."
    ],
    "image_url": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600"
  },
  {
    "id": "ex-h-senior-7",
    "name": "Glute Bridge (Gentle Glute Strength)",
    "equipment_required": "bodyweight",
    "muscle_group": "Legs",
    "primary_muscle": "Gluteus Maximus",
    "secondary_muscles": ["Hamstrings", "Core"],
    "instructions": [
      "Lie on your back with knees bent and feet flat on the floor.",
      "Lift your hips off the floor until your knees, hips, and shoulders form a straight line.",
      "Pause for a moment, then slowly lower back down."
    ],
    "form_tips": [
      "Squeeze your glutes at the top.",
      "Keep your neck relaxed."
    ],
    "common_mistakes": [
      "Arching lower back too excessively."
    ],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  }
];

export const getExerciseImageUrl = (muscleGroup: string) => {
  const muscle = muscleGroup.toLowerCase();
  if (muscle === 'chest') {
    return 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600';
  }
  if (muscle === 'back') {
    return 'https://images.unsplash.com/photo-1603287638312-c001b929411f?q=80&w=600';
  }
  if (muscle === 'shoulders') {
    return 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=600';
  }
  if (muscle === 'legs') {
    return 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600';
  }
  if (muscle === 'core' || muscle === 'abs') {
    return 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600';
  }
  return 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600';
};

const nameToLocalAsset: { [key: string]: any } = {
  "plank": require('../../assets/images/exercises/abs_plank.png'),
  "hanging leg raise": require('../../assets/images/exercises/abs_hanging_leg_raise.png'),
  "cable crunch": require('../../assets/images/exercises/abs_cable_crunch.png'),
  "russian twist": require('../../assets/images/exercises/abs_russian_twist.png'),
  "bicycle crunch": require('../../assets/images/exercises/abs_bicycle_crunch.png'),

  "wrist curl": require('../../assets/images/exercises/forearms_wrist_curl.png'),
  "reverse wrist curl": require('../../assets/images/exercises/forearms_reverse_wrist_curl.png'),
  "dead hang": require('../../assets/images/exercises/forearms_dead_hang.png'),
  "plate pinch hold": require('../../assets/images/exercises/forearms_plate_pinch_hold.png'),
  "bench press": require('../../assets/images/exercises/chest_bench_press.png'),
  "push-up": require('../../assets/images/exercises/chest_pushup.png'),
  "incline dumbbell press": require('../../assets/images/exercises/chest_incline_dumbbell_press.png'),
  "cable chest fly": require('../../assets/images/exercises/chest_cable_fly.png'),
  "dips (chest focus)": require('../../assets/images/exercises/chest_dips.png'),

  "deadlift": require('../../assets/images/exercises/back_deadlift.png'),
  "pull-up": require('../../assets/images/exercises/back_pullup.png'),
  "bent-over barbell row": require('../../assets/images/exercises/back_bent_over_row.png'),
  "lat pulldown": require('../../assets/images/exercises/back_lat_pulldown.png'),
  "seated cable row": require('../../assets/images/exercises/back_seated_cable_row.png'),

  "overhead press": require('../../assets/images/exercises/shoulders_overhead_press.png'),
  "arnold press": require('../../assets/images/exercises/shoulders_arnold_press.png'),
  "lateral raise": require('../../assets/images/exercises/shoulders_lateral_raise.png'),
  "face pull": require('../../assets/images/exercises/shoulders_face_pull.png'),
  "upright row": require('../../assets/images/exercises/shoulders_upright_row.png'),

  "barbell curl": require('../../assets/images/exercises/biceps_barbell_curl.png'),
  "dumbbell hammer curl": require('../../assets/images/exercises/biceps_hammer_curl.png'),
  "concentration curl": require('../../assets/images/exercises/biceps_concentration_curl.png'),
  "preacher curl": require('../../assets/images/exercises/biceps_preacher_curl.png'),
  "cable curl": require('../../assets/images/exercises/biceps_cable_curl.png'),

  "bench dip": require('../../assets/images/exercises/triceps_bench_dip.png'),
  "close-grip bench press": require('../../assets/images/exercises/triceps_close_grip_bench.png'),
  "tricep pushdown": require('../../assets/images/exercises/triceps_pushdown.png'),
  "overhead tricep extension": require('../../assets/images/exercises/triceps_overhead_extension.png'),
  "skull crusher": require('../../assets/images/exercises/triceps_skull_crusher.png'),

  "barbell squat": require('../../assets/images/exercises/legs_barbell_squat.png'),
  "walking lunge": require('../../assets/images/exercises/legs_walking_lunge.png'),
  "leg press": require('../../assets/images/exercises/legs_leg_press.png'),
  "romanian deadlift": require('../../assets/images/exercises/legs_romanian_deadlift.png'),
  "calf raise": require('../../assets/images/exercises/legs_calf_raise.png'),
};

export const getExerciseImageSource = (exercise: { name: string; image_url?: any; muscle_group: string }) => {
  const nameKey = exercise.name.toLowerCase().trim();
  if (nameToLocalAsset[nameKey]) {
    return nameToLocalAsset[nameKey];
  }

  const img = exercise.image_url;
  if (!img) {
    return { uri: getExerciseImageUrl(exercise.muscle_group) };
  }

  if (typeof img === 'string' && img.startsWith('http')) {
    return { uri: img };
  }

  return img;
};

const nameToLocalVideo: { [key: string]: any } = {
  // Chest
  "bench press": require('../../assets/videos/chest_bench_press.mp4'),
  "push-up": require('../../assets/videos/chest_pushup.mp4'),
  "incline dumbbell press": require('../../assets/videos/chest_incline_dumbbell_press.mp4'),
  "cable chest fly": require('../../assets/videos/chest_cable_fly.mp4'),
  "dips (chest focus)": require('../../assets/videos/chest_dips.mp4'),

  // Back
  "deadlift": require('../../assets/videos/back_deadlift.mp4'),
  "pull-up": require('../../assets/videos/back_pullup.mp4'),
  "bent-over barbell row": require('../../assets/videos/back_bent_over_row.mp4'),
  "lat pulldown": require('../../assets/videos/back_lat_pulldown.mp4'),
  "seated cable row": require('../../assets/videos/back_seated_cable_row.mp4'),

  // Shoulders
  "overhead press": require('../../assets/videos/shoulders_overhead_press.mp4'),
  "arnold press": require('../../assets/videos/shoulders_arnold_press.mp4'),
  "lateral raise": require('../../assets/videos/shoulders_lateral_raise.mp4'),
  "face pull": require('../../assets/videos/shoulders_face_pull.mp4'),
  "upright row": require('../../assets/videos/shoulders_upright_row.mp4'),

  // Biceps
  "barbell curl": require('../../assets/videos/biceps_barbell_curl.mp4'),
  "dumbbell hammer curl": require('../../assets/videos/biceps_hammer_curl.mp4'),
  "concentration curl": require('../../assets/videos/biceps_concentration_curl.mp4'),
  "preacher curl": require('../../assets/videos/biceps_preacher_curl.mp4'),
  "cable curl": require('../../assets/videos/biceps_cable_curl.mp4'),

  // Triceps
  "bench dip": require('../../assets/videos/triceps_bench_dip.mp4'),
  "close-grip bench press": require('../../assets/videos/triceps_close_grip_bench.mp4'),
  "tricep pushdown": require('../../assets/videos/triceps_pushdown.mp4'),
  "overhead tricep extension": require('../../assets/videos/triceps_overhead_extension.mp4'),
  "skull crusher": require('../../assets/videos/triceps_skull_crusher.mp4'),

  // Legs
  "barbell squat": require('../../assets/videos/legs_barbell_squat.mp4'),
  "walking lunge": require('../../assets/videos/legs_walking_lunge.mp4'),
  "leg press": require('../../assets/videos/legs_leg_press.mp4'),
  "romanian deadlift": require('../../assets/videos/legs_romanian_deadlift.mp4'),
  "calf raise": require('../../assets/videos/legs_calf_raise.mp4'),
  "standing calf raise": require('../../assets/videos/legs_calf_raise.mp4'),

  // Abs
  "plank": require('../../assets/videos/abs_plank.mp4'),
  "hanging leg raise": require('../../assets/videos/abs_hanging_leg_raise.mp4'),
  "cable crunch": require('../../assets/videos/abs_cable_crunch.mp4'),
  "russian twist": require('../../assets/videos/abs_russian_twist.mp4'),
  "bicycle crunch": require('../../assets/videos/abs_bicycle_crunch.mp4'),

  // Forearms
  "wrist curl": require('../../assets/videos/forearms_wrist_curl.mp4'),
  "reverse wrist curl": require('../../assets/videos/forearms_reverse_wrist_curl.mp4'),
  "farmer\'s carry": require('../../assets/videos/forearms_farmers_carry.mp4'),
  "dead hang": require('../../assets/videos/forearms_dead_hang.mp4'),
  "plate pinch hold": require('../../assets/videos/forearms_plate_pinch_hold.mp4'),
};

export const getExerciseVideoSource = (exercise: { name: string }) => {
  const nameKey = exercise.name.toLowerCase().trim();
  if (nameToLocalVideo[nameKey]) {
    return nameToLocalVideo[nameKey];
  }
  return null;
};

export const getLocalEquipmentRequiredTag = (name: string): 'gym_machine' | 'barbell' | 'dumbbell' | 'bodyweight' | 'resistance_band' | undefined => {
  const nameLower = name.toLowerCase().trim();
  const match = MOCK_EXERCISES.find(e => e.name.toLowerCase().trim() === nameLower);
  return match?.equipment_required;
};
