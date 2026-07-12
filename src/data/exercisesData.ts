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
}

export const MOCK_EXERCISES: Exercise[] = [
  {
    "id": "ex-1",
    "name": "Bench Press",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major",
    "secondary_muscles": [
      "Triceps",
      "Anterior Deltoids"
    ],
    "instructions": [
      "Lie flat on the bench with your feet flat on the floor.",
      "Grip the barbell slightly wider than shoulder-width.",
      "Unrack the bar and lower it slowly to your mid-chest.",
      "Push the bar back up powerfully while keeping your elbows tucked at a 45-degree angle."
    ],
    "form_tips": [
      "Keep your shoulder blades retracted and depressed throughout the lift.",
      "Drive your feet into the floor to stay tight and stable.",
      "Avoid bouncing the bar off your chest."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/chest_bench_press.png')
  },
  {
    "id": "ex-2",
    "name": "Barbell Squat",
    "muscle_group": "Legs",
    "primary_muscle": "Quadriceps",
    "secondary_muscles": [
      "Glutes",
      "Hamstrings"
    ],
    "instructions": [
      "Position the bar on your upper back and stand with feet shoulder-width apart.",
      "Brace your core and bend your knees and hips to lower down.",
      "Descend until your thighs are at least parallel to the floor.",
      "Drive through your heels to return to standing."
    ],
    "form_tips": [
      "Keep your chest up and back flat throughout the movement.",
      "Track your knees in line with your toes.",
      "Avoid letting your heels lift off the floor."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/legs_barbell_squat.png')
  },
  {
    "id": "ex-3",
    "name": "Deadlift",
    "muscle_group": "Back",
    "primary_muscle": "Erector Spinae",
    "secondary_muscles": [
      "Glutes",
      "Hamstrings",
      "Traps"
    ],
    "instructions": [
      "Stand with feet hip-width apart, bar over mid-foot.",
      "Hinge at the hips and grip the bar just outside your knees.",
      "Keep your back flat and chest up as you drive through your heels to stand.",
      "Lower the bar back down with control by hinging at the hips first."
    ],
    "form_tips": [
      "Keep the bar close to your shins and thighs throughout the lift.",
      "Brace your core hard before initiating the pull.",
      "Avoid rounding your lower back."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/back_deadlift.png')
  },
  {
    "id": "ex-4",
    "name": "Overhead Press",
    "muscle_group": "Shoulders",
    "primary_muscle": "Anterior Deltoids",
    "secondary_muscles": [
      "Triceps",
      "Upper Chest"
    ],
    "instructions": [
      "Stand with feet shoulder-width apart, bar racked at shoulder height.",
      "Brace your core and press the bar straight overhead.",
      "Fully lock out your arms at the top.",
      "Lower the bar back down to shoulder level with control."
    ],
    "form_tips": [
      "Avoid arching your lower back excessively.",
      "Keep your glutes and core tight throughout the press.",
      "Move your head slightly back as the bar passes your face."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/shoulders_overhead_press.png')
  },
  {
    "id": "ex-5",
    "name": "Pull-Up",
    "muscle_group": "Back",
    "primary_muscle": "Latissimus Dorsi",
    "secondary_muscles": [
      "Biceps",
      "Rear Deltoids"
    ],
    "instructions": [
      "Hang from a bar with an overhand grip, slightly wider than shoulders.",
      "Pull your body up until your chin clears the bar.",
      "Focus on driving your elbows down and back.",
      "Lower yourself back down with control to a full hang."
    ],
    "form_tips": [
      "Avoid excessive swinging or kipping.",
      "Initiate the pull by depressing your shoulder blades first.",
      "Fully extend your arms at the bottom of each rep."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/back_pullup.png')
  },
  {
    "id": "ex-6",
    "name": "Bent-Over Barbell Row",
    "muscle_group": "Back",
    "primary_muscle": "Latissimus Dorsi",
    "secondary_muscles": [
      "Rhomboids",
      "Biceps",
      "Rear Deltoids"
    ],
    "instructions": [
      "Hinge at the hips with a flat back, holding the bar with an overhand grip.",
      "Let the bar hang at arm's length below your shoulders.",
      "Pull the bar toward your lower ribcage, squeezing your shoulder blades.",
      "Lower the bar back down with control."
    ],
    "form_tips": [
      "Keep your torso angle fixed throughout the set.",
      "Avoid using momentum or jerking the weight up.",
      "Keep your neck neutral, not looking up."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/back_bent_over_row.png')
  },
  {
    "id": "ex-7",
    "name": "Walking Lunge",
    "muscle_group": "Legs",
    "primary_muscle": "Quadriceps",
    "secondary_muscles": [
      "Glutes",
      "Hamstrings"
    ],
    "instructions": [
      "Stand tall holding dumbbells at your sides.",
      "Step forward with one leg and lower your hips until both knees are bent 90 degrees.",
      "Push through your front heel to step forward into the next lunge.",
      "Continue alternating legs as you move forward."
    ],
    "form_tips": [
      "Keep your torso upright throughout each step.",
      "Avoid letting your front knee travel past your toes.",
      "Take controlled, deliberate steps rather than rushing."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/legs_walking_lunge.png')
  },
  {
    "id": "ex-8",
    "name": "Plank",
    "muscle_group": "Abs",
    "primary_muscle": "Rectus Abdominis",
    "secondary_muscles": [
      "Obliques",
      "Lower Back"
    ],
    "instructions": [
      "Get into a forearm plank position with elbows under your shoulders.",
      "Keep your body in a straight line from head to heels.",
      "Brace your core and hold the position.",
      "Breathe steadily while maintaining the hold."
    ],
    "form_tips": [
      "Avoid letting your hips sag or pike up.",
      "Squeeze your glutes to help stabilize your lower back.",
      "Keep your neck neutral, looking at the floor."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/abs_plank.png')
  },
  {
    "id": "ex-9",
    "name": "Barbell Curl",
    "muscle_group": "Biceps",
    "primary_muscle": "Biceps Brachii",
    "secondary_muscles": [
      "Forearms"
    ],
    "instructions": [
      "Stand holding a barbell with an underhand, shoulder-width grip.",
      "Keep your elbows pinned to your sides.",
      "Curl the bar up toward your shoulders.",
      "Lower it back down slowly to full extension."
    ],
    "form_tips": [
      "Avoid swinging your torso to generate momentum.",
      "Keep your wrists straight throughout the curl.",
      "Squeeze the biceps at the top of the movement."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/biceps_barbell_curl.png')
  },
  {
    "id": "ex-10",
    "name": "Bench Dip",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii",
    "secondary_muscles": [
      "Anterior Deltoids"
    ],
    "instructions": [
      "Sit on the edge of a bench with hands gripping the edge beside your hips.",
      "Walk your feet forward and lower your body by bending your elbows.",
      "Lower until your upper arms are roughly parallel to the floor.",
      "Push back up to the starting position."
    ],
    "form_tips": [
      "Keep your elbows pointing backward, not out to the sides.",
      "Don't let your shoulders shrug up toward your ears.",
      "Add weight on your lap for extra resistance once bodyweight gets easy."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/triceps_bench_dip.png')
  },
  {
    "id": "ex-11",
    "name": "Leg Press",
    "muscle_group": "Legs",
    "primary_muscle": "Quadriceps",
    "secondary_muscles": [
      "Glutes",
      "Hamstrings"
    ],
    "instructions": [
      "Sit in the leg press machine with feet shoulder-width apart on the platform.",
      "Lower the platform by bending your knees toward your chest.",
      "Stop when your knees reach about a 90-degree angle.",
      "Push through your heels to extend your legs back out."
    ],
    "form_tips": [
      "Avoid locking your knees completely at the top.",
      "Keep your lower back pressed against the seat.",
      "Don't let your knees cave inward during the press."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/legs_leg_press.png')
  },
  {
    "id": "ex-12",
    "name": "Lat Pulldown",
    "muscle_group": "Back",
    "primary_muscle": "Latissimus Dorsi",
    "secondary_muscles": [
      "Biceps",
      "Rhomboids"
    ],
    "instructions": [
      "Sit at the machine and grip the bar wider than shoulder-width.",
      "Lean back slightly and pull the bar down to your upper chest.",
      "Squeeze your shoulder blades together at the bottom.",
      "Slowly release the bar back to the starting position."
    ],
    "form_tips": [
      "Avoid pulling with your arms alone; drive with your lats.",
      "Don't lean back excessively to cheat the weight down.",
      "Keep your chest up throughout the movement."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/back_lat_pulldown.png')
  },
  {
    "id": "ex-13",
    "name": "Push-Up",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major",
    "secondary_muscles": [
      "Triceps",
      "Core"
    ],
    "instructions": [
      "Start in a plank position with hands slightly wider than shoulders.",
      "Keep your body in a straight line from head to heels.",
      "Lower your chest toward the floor by bending your elbows.",
      "Push back up to the starting position."
    ],
    "form_tips": [
      "Keep your core braced to prevent hips from sagging.",
      "Lower until your chest is a few inches from the floor.",
      "Exhale as you push up."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/chest_pushup.png')
  },
  {
    "id": "ex-14",
    "name": "Romanian Deadlift",
    "muscle_group": "Legs",
    "primary_muscle": "Hamstrings",
    "secondary_muscles": [
      "Glutes",
      "Lower Back"
    ],
    "instructions": [
      "Hold a barbell in front of your thighs with a shoulder-width grip.",
      "Push your hips back while keeping a slight bend in your knees.",
      "Lower the bar along your legs until you feel a hamstring stretch.",
      "Drive your hips forward to return to standing."
    ],
    "form_tips": [
      "Keep the bar close to your legs throughout the movement.",
      "Maintain a flat back and avoid rounding your spine.",
      "Stop the descent once you feel a deep hamstring stretch."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/legs_romanian_deadlift.png')
  },
  {
    "id": "ex-15",
    "name": "Arnold Press",
    "muscle_group": "Shoulders",
    "primary_muscle": "Anterior & Lateral Deltoids",
    "secondary_muscles": [
      "Triceps"
    ],
    "instructions": [
      "Sit holding dumbbells in front of your shoulders, palms facing you.",
      "Press the dumbbells overhead while rotating your palms to face forward.",
      "Fully extend your arms at the top.",
      "Reverse the rotation as you lower back to the start."
    ],
    "form_tips": [
      "Control the rotation smoothly rather than rushing it.",
      "Keep your core braced to avoid excessive back arch.",
      "Don't let the dumbbells drift forward or behind your head."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/shoulders_arnold_press.png')
  },
  {
    "id": "ex-16",
    "name": "Incline Dumbbell Press",
    "muscle_group": "Chest",
    "primary_muscle": "Upper Pectoralis Major",
    "secondary_muscles": [
      "Anterior Deltoids",
      "Triceps"
    ],
    "instructions": [
      "Set the bench to a 30-45 degree incline.",
      "Hold a dumbbell in each hand at shoulder level, palms facing forward.",
      "Press the dumbbells up until your arms are extended.",
      "Lower slowly back to the starting position with control."
    ],
    "form_tips": [
      "Don't let the incline exceed 45 degrees or shoulders take over.",
      "Keep wrists straight and stacked over elbows.",
      "Squeeze your chest at the top of each rep."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/chest_incline_dumbbell_press.png')
  },
  {
    "id": "ex-17",
    "name": "Cable Chest Fly",
    "muscle_group": "Chest",
    "primary_muscle": "Pectoralis Major",
    "secondary_muscles": [
      "Anterior Deltoids"
    ],
    "instructions": [
      "Stand centered between two cable stacks with handles set at chest height.",
      "Step forward with a slight bend in your elbows.",
      "Bring your hands together in front of your chest in an arcing motion.",
      "Slowly return to the starting position, feeling a stretch across the chest."
    ],
    "form_tips": [
      "Keep a slight, fixed bend in the elbows throughout.",
      "Focus on squeezing the chest rather than pulling with the arms.",
      "Avoid letting the weights slam at the stretch position."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/chest_cable_fly.png')
  },
  {
    "id": "ex-18",
    "name": "Dips (Chest Focus)",
    "muscle_group": "Chest",
    "primary_muscle": "Lower Pectoralis Major",
    "secondary_muscles": [
      "Triceps",
      "Anterior Deltoids"
    ],
    "instructions": [
      "Grip the parallel bars and support your body with arms extended.",
      "Lean your torso forward and bend your knees.",
      "Lower your body until your shoulders are below your elbows.",
      "Push back up to the starting position."
    ],
    "form_tips": [
      "Leaning forward shifts emphasis onto the chest.",
      "Avoid flaring elbows out too wide to protect the shoulders.",
      "Control the descent instead of dropping quickly."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/chest_dips.png')
  },
  {
    "id": "ex-19",
    "name": "Seated Cable Row",
    "muscle_group": "Back",
    "primary_muscle": "Middle Back (Rhomboids)",
    "secondary_muscles": [
      "Latissimus Dorsi",
      "Biceps"
    ],
    "instructions": [
      "Sit with knees slightly bent, gripping the handle with arms extended.",
      "Keep your back straight and pull the handle toward your torso.",
      "Squeeze your shoulder blades together at the end of the pull.",
      "Extend your arms back out with control."
    ],
    "form_tips": [
      "Avoid rounding your back or using excessive body swing.",
      "Keep your elbows close to your body during the pull.",
      "Pause briefly at full contraction for better activation."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/back_seated_cable_row.png')
  },
  {
    "id": "ex-20",
    "name": "Lateral Raise",
    "muscle_group": "Shoulders",
    "primary_muscle": "Lateral Deltoids",
    "secondary_muscles": [
      "Traps"
    ],
    "instructions": [
      "Stand holding a dumbbell in each hand at your sides.",
      "Raise your arms out to the sides until they reach shoulder height.",
      "Keep a slight bend in your elbows throughout.",
      "Lower the dumbbells back down slowly."
    ],
    "form_tips": [
      "Avoid using momentum or swinging the weights up.",
      "Lead with your elbows, not your hands.",
      "Stop at shoulder height to keep tension on the delts."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/shoulders_lateral_raise.png')
  },
  {
    "id": "ex-21",
    "name": "Face Pull",
    "muscle_group": "Shoulders",
    "primary_muscle": "Rear Deltoids",
    "secondary_muscles": [
      "Rhomboids",
      "Rotator Cuff"
    ],
    "instructions": [
      "Set a cable pulley to face height with a rope attachment.",
      "Pull the rope toward your face, splitting it apart at the end.",
      "Keep your elbows high and in line with your shoulders.",
      "Slowly return to the starting position."
    ],
    "form_tips": [
      "Focus on squeezing your rear delts, not your traps.",
      "Keep your torso upright throughout the movement.",
      "Use a lighter weight to prioritize form over load."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/shoulders_face_pull.png')
  },
  {
    "id": "ex-22",
    "name": "Upright Row",
    "muscle_group": "Shoulders",
    "primary_muscle": "Lateral Deltoids",
    "secondary_muscles": [
      "Traps",
      "Biceps"
    ],
    "instructions": [
      "Hold a barbell or dumbbells in front of your thighs.",
      "Pull the weight straight up toward your chin, leading with your elbows.",
      "Raise until your elbows reach shoulder height.",
      "Lower back down with control."
    ],
    "form_tips": [
      "Keep the bar close to your body throughout the pull.",
      "Avoid raising it above shoulder height to protect the shoulder joint.",
      "Use a moderate grip width to reduce joint strain."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/shoulders_upright_row.png')
  },
  {
    "id": "ex-23",
    "name": "Dumbbell Hammer Curl",
    "muscle_group": "Biceps",
    "primary_muscle": "Brachialis",
    "secondary_muscles": [
      "Biceps Brachii",
      "Forearms"
    ],
    "instructions": [
      "Hold a dumbbell in each hand with palms facing your body.",
      "Curl the weights up while keeping your palms neutral.",
      "Bring the dumbbells up to shoulder level.",
      "Lower back down with control."
    ],
    "form_tips": [
      "Keep your elbows stationary throughout the movement.",
      "Avoid rotating your wrists during the curl.",
      "Move at a controlled tempo to maximize tension."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/biceps_hammer_curl.png')
  },
  {
    "id": "ex-24",
    "name": "Concentration Curl",
    "muscle_group": "Biceps",
    "primary_muscle": "Biceps Brachii",
    "secondary_muscles": [
      "Forearms"
    ],
    "instructions": [
      "Sit on a bench and brace your elbow against your inner thigh.",
      "Hold a dumbbell with your arm fully extended.",
      "Curl the weight up toward your shoulder.",
      "Lower it back down slowly with full control."
    ],
    "form_tips": [
      "Keep your upper arm completely still throughout.",
      "Focus on a strong peak contraction at the top.",
      "Avoid using your shoulder to assist the lift."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/biceps_concentration_curl.png')
  },
  {
    "id": "ex-25",
    "name": "Preacher Curl",
    "muscle_group": "Biceps",
    "primary_muscle": "Biceps Brachii",
    "secondary_muscles": [
      "Forearms"
    ],
    "instructions": [
      "Sit at a preacher bench with your upper arms resting on the pad.",
      "Hold the bar or dumbbells with an underhand grip.",
      "Curl the weight up toward your shoulders.",
      "Lower back down slowly without fully relaxing at the bottom."
    ],
    "form_tips": [
      "Avoid locking out and relaxing completely at the bottom.",
      "Keep your movements slow and controlled to reduce elbow strain.",
      "Don't let your shoulders round forward during the curl."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/biceps_preacher_curl.png')
  },
  {
    "id": "ex-26",
    "name": "Cable Curl",
    "muscle_group": "Biceps",
    "primary_muscle": "Biceps Brachii",
    "secondary_muscles": [
      "Forearms"
    ],
    "instructions": [
      "Stand facing a low cable pulley with a straight or EZ bar attached.",
      "Hold the bar with an underhand grip, arms extended.",
      "Curl the bar up toward your shoulders.",
      "Lower back down under control, maintaining tension."
    ],
    "form_tips": [
      "Keep constant tension on the biceps throughout the set.",
      "Avoid leaning back to help lift the weight.",
      "Keep elbows close to your torso."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/biceps_cable_curl.png')
  },
  {
    "id": "ex-27",
    "name": "Close-Grip Bench Press",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii",
    "secondary_muscles": [
      "Pectoralis Major",
      "Anterior Deltoids"
    ],
    "instructions": [
      "Lie on a bench and grip the bar with hands shoulder-width apart.",
      "Lower the bar to your lower chest, keeping elbows tucked.",
      "Press the bar back up, focusing on triceps extension.",
      "Lock out your arms at the top."
    ],
    "form_tips": [
      "Keep your elbows close to your body throughout the press.",
      "Avoid flaring elbows out to protect your shoulders.",
      "Control the bar on the way down."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/triceps_close_grip_bench.png')
  },
  {
    "id": "ex-28",
    "name": "Tricep Pushdown",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii",
    "secondary_muscles": [],
    "instructions": [
      "Stand facing a high cable pulley with a straight or rope attachment.",
      "Keep your elbows pinned to your sides.",
      "Push the attachment down until your arms are fully extended.",
      "Slowly return to the starting position."
    ],
    "form_tips": [
      "Avoid letting your elbows drift away from your body.",
      "Keep your torso upright and avoid leaning into the movement.",
      "Fully extend at the bottom for maximum contraction."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/triceps_pushdown.png')
  },
  {
    "id": "ex-29",
    "name": "Overhead Tricep Extension",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii (Long Head)",
    "secondary_muscles": [],
    "instructions": [
      "Hold a dumbbell with both hands overhead, arms fully extended.",
      "Lower the weight behind your head by bending your elbows.",
      "Keep your upper arms stationary and close to your ears.",
      "Extend back up to the starting position."
    ],
    "form_tips": [
      "Avoid flaring your elbows out to the sides.",
      "Keep your core braced to protect your lower back.",
      "Use a controlled tempo to avoid shoulder strain."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/triceps_overhead_extension.png')
  },
  {
    "id": "ex-30",
    "name": "Skull Crusher",
    "muscle_group": "Triceps",
    "primary_muscle": "Triceps Brachii",
    "secondary_muscles": [],
    "instructions": [
      "Lie on a bench holding an EZ bar with arms extended above your chest.",
      "Bend your elbows to lower the bar toward your forehead.",
      "Keep your upper arms stationary throughout.",
      "Extend your arms back up to the starting position."
    ],
    "form_tips": [
      "Keep your elbows pointed forward, not flared out.",
      "Lower the bar slowly to avoid hitting your head.",
      "Avoid moving your upper arms during the rep."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/triceps_skull_crusher.png')
  },
  {
    "id": "ex-31",
    "name": "Standing Calf Raise",
    "muscle_group": "Legs",
    "primary_muscle": "Gastrocnemius",
    "secondary_muscles": [
      "Soleus"
    ],
    "instructions": [
      "Stand on a raised platform with your heels hanging off the edge.",
      "Lower your heels below the platform to feel a calf stretch.",
      "Rise up onto your toes as high as possible.",
      "Lower back down slowly with control."
    ],
    "form_tips": [
      "Pause briefly at the top for a strong contraction.",
      "Avoid bouncing at the bottom of the movement.",
      "Use a full range of motion for best results."
    ],
    "common_mistakes": [],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  },
  {
    "id": "ex-32",
    "name": "Hanging Leg Raise",
    "muscle_group": "Abs",
    "primary_muscle": "Lower Rectus Abdominis",
    "secondary_muscles": [
      "Hip Flexors"
    ],
    "instructions": [
      "Hang from a pull-up bar with arms fully extended.",
      "Keep your legs straight and raise them until parallel to the floor.",
      "Lower your legs back down slowly with control.",
      "Avoid swinging your body during the movement."
    ],
    "form_tips": [
      "Engage your core before initiating the raise.",
      "Avoid using momentum to swing your legs up.",
      "Control the descent instead of dropping quickly."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/abs_hanging_leg_raise.png')
  },
  {
    "id": "ex-33",
    "name": "Cable Crunch",
    "muscle_group": "Abs",
    "primary_muscle": "Rectus Abdominis",
    "secondary_muscles": [
      "Obliques"
    ],
    "instructions": [
      "Kneel below a high cable pulley holding a rope attachment near your head.",
      "Crunch your torso down, bringing your elbows toward your knees.",
      "Focus on rounding your spine rather than bending at the hips.",
      "Slowly return to the starting position."
    ],
    "form_tips": [
      "Keep your hips stationary throughout the crunch.",
      "Focus on contracting your abs, not pulling with your arms.",
      "Use a moderate weight to maintain proper form."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/abs_cable_crunch.png')
  },
  {
    "id": "ex-34",
    "name": "Russian Twist",
    "muscle_group": "Abs",
    "primary_muscle": "Obliques",
    "secondary_muscles": [
      "Rectus Abdominis"
    ],
    "instructions": [
      "Sit on the floor with your knees bent and lean back slightly.",
      "Hold a weight with both hands in front of your chest.",
      "Rotate your torso to bring the weight to one side of your hips.",
      "Rotate back through center to the opposite side."
    ],
    "form_tips": [
      "Keep your chest up and avoid rounding your back.",
      "Move with control rather than twisting quickly.",
      "Lift your feet off the floor for an added challenge."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/abs_russian_twist.png')
  },
  {
    "id": "ex-35",
    "name": "Bicycle Crunch",
    "muscle_group": "Abs",
    "primary_muscle": "Rectus Abdominis",
    "secondary_muscles": [
      "Obliques"
    ],
    "instructions": [
      "Lie on your back with hands behind your head and knees bent.",
      "Bring one knee toward your chest while rotating the opposite elbow to meet it.",
      "Extend the other leg out straight as you rotate.",
      "Alternate sides in a smooth pedaling motion."
    ],
    "form_tips": [
      "Avoid pulling on your neck with your hands.",
      "Keep the movement slow and controlled rather than rushed.",
      "Exhale as you crunch toward each knee."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/abs_bicycle_crunch.png')
  },
  {
    "id": "ex-36",
    "name": "Wrist Curl",
    "muscle_group": "Forearms",
    "primary_muscle": "Wrist Flexors",
    "secondary_muscles": [],
    "instructions": [
      "Sit and rest your forearms on your thighs, palms facing up, holding a barbell.",
      "Let your wrists hang off your knees.",
      "Curl the bar up by flexing your wrists.",
      "Lower back down slowly to full stretch."
    ],
    "form_tips": [
      "Keep your forearms stationary throughout the movement.",
      "Use a light weight and focus on full range of motion.",
      "Avoid using your arms or shoulders to assist the curl."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/forearms_wrist_curl.png')
  },
  {
    "id": "ex-37",
    "name": "Reverse Wrist Curl",
    "muscle_group": "Forearms",
    "primary_muscle": "Wrist Extensors",
    "secondary_muscles": [],
    "instructions": [
      "Rest your forearms on your thighs with palms facing down, holding a barbell.",
      "Let your wrists hang off your knees.",
      "Extend your wrists to lift the bar upward.",
      "Lower back down slowly with control."
    ],
    "form_tips": [
      "Use a lighter weight than standard wrist curls.",
      "Keep the movement slow to avoid straining the wrist joint.",
      "Maintain full forearm contact with your thighs."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/forearms_reverse_wrist_curl.png')
  },
  {
    "id": "ex-38",
    "name": "Farmer's Carry",
    "muscle_group": "Forearms",
    "primary_muscle": "Forearm Flexors (Grip)",
    "secondary_muscles": [
      "Traps",
      "Core"
    ],
    "instructions": [
      "Hold a heavy dumbbell or kettlebell in each hand at your sides.",
      "Stand tall with shoulders back and core braced.",
      "Walk forward for a set distance or time.",
      "Set the weights down with control at the end."
    ],
    "form_tips": [
      "Keep your shoulders pulled back, not shrugged up.",
      "Take controlled, steady steps rather than rushing.",
      "Grip the handles as hard as possible throughout the carry."
    ],
    "common_mistakes": [],
    "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600"
  },
  {
    "id": "ex-39",
    "name": "Dead Hang",
    "muscle_group": "Forearms",
    "primary_muscle": "Forearm Flexors (Grip)",
    "secondary_muscles": [
      "Latissimus Dorsi"
    ],
    "instructions": [
      "Grip a pull-up bar with hands shoulder-width apart.",
      "Hang with your arms fully extended and feet off the floor.",
      "Keep your shoulders slightly engaged, not fully relaxed.",
      "Hold the position for the desired duration."
    ],
    "form_tips": [
      "Avoid swinging your body during the hold.",
      "Breathe steadily rather than holding your breath.",
      "Build up hang time gradually to avoid grip fatigue injuries."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/forearms_dead_hang.png')
  },
  {
    "id": "ex-40",
    "name": "Plate Pinch Hold",
    "muscle_group": "Forearms",
    "primary_muscle": "Forearm Flexors (Grip)",
    "secondary_muscles": [],
    "instructions": [
      "Pinch two weight plates together, smooth sides facing out.",
      "Hold the plates at your sides with straight arms.",
      "Maintain the pinch grip for the desired duration.",
      "Set the plates down with control when finished."
    ],
    "form_tips": [
      "Keep your wrists straight, not bent, during the hold.",
      "Start with lighter plates to build up grip strength safely.",
      "Avoid letting your shoulders shrug up during the hold."
    ],
    "common_mistakes": [],
    "image_url": require('../../assets/images/exercises/forearms_plate_pinch_hold.png')
  },
  {
    "id": "ex-hip-thrust",
    "name": "Hip Thrust",
    "muscle_group": "Glutes",
    "primary_muscle": "Gluteus Maximus",
    "secondary_muscles": [
      "Hamstrings",
      "Core"
    ],
    "instructions": [
      "Sit on the floor with your upper back resting against a sturdy bench.",
      "Roll a barbell over your hips, using a pad for comfort.",
      "Place feet flat on the floor, hip-width apart.",
      "Drive through your heels to lift your hips until thighs are parallel to floor.",
      "Squeeze glutes at lockout, then lower hips back down."
    ],
    "form_tips": [
      "Keep your chin tucked and look forward, not up at the ceiling.",
      "Ensure shins are vertical at the top of the lift."
    ],
    "common_mistakes": [
      "Hyperextending the lower back at the top.",
      "Pushing through the toes instead of the heels."
    ],
    "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600"
  },
  {
    "id": "ex-calf-raise",
    "name": "Calf Raise",
    "muscle_group": "Calves",
    "primary_muscle": "Gastrocnemius",
    "secondary_muscles": [
      "Soleus"
    ],
    "instructions": [
      "Stand with the balls of your feet on an elevated step or block.",
      "Hold onto a support for balance if needed.",
      "Lower your heels below the step level to feel a stretch.",
      "Push up high onto your toes, contracting the calves.",
      "Hold the contraction for a second, then lower slowly."
    ],
    "form_tips": [
      "Keep your knees straight but not completely locked out.",
      "Pause at the bottom stretch and top contraction."
    ],
    "common_mistakes": [
      "Bouncing quickly at the bottom using Achilles tendon elasticity.",
      "Not using a full range of motion."
    ],
    "image_url": require('../../assets/images/exercises/legs_calf_raise.png')
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
  if (muscle === 'legs' || muscle === 'glutes' || muscle === 'calves') {
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
  "farmer's carry": require('../../assets/videos/forearms_farmers_carry.mp4'),
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
