import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({
        error: 'ANTHROPIC_API_KEY_MISSING',
        message: 'The Anthropic API key is not configured as a Supabase secret. Please configure it by running: supabase secrets set ANTHROPIC_API_KEY=your-api-key'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { message, conversationHistory } = await req.json()
    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Query user profile
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('weight_kg, height_cm, sex, gender, fitness_goal, experience_level, date_of_birth, dietary_preference, activity_level')
      .single()

    // Calculate age with fallbacks
    let age = 30
    if (profile?.date_of_birth) {
      const dob = new Date(profile.date_of_birth)
      if (!isNaN(dob.getTime())) {
        const today = new Date()
        age = today.getFullYear() - dob.getFullYear()
        const m = today.getMonth() - dob.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--
        }
      }
    }

    // Default calculations if profile is missing
    const weight = profile?.weight_kg || 70
    const height = profile?.height_cm || 175
    const sex = profile?.sex || profile?.gender || 'male'

    let bmr = 0
    if (sex === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161
    }

    const activity_level = profile?.activity_level || 'moderate'
    let multiplier = 1.2
    if (activity_level === 'sedentary') multiplier = 1.2
    else if (activity_level === 'light') multiplier = 1.375
    else if (activity_level === 'moderate') multiplier = 1.55
    else if (activity_level === 'active') multiplier = 1.725
    else if (activity_level === 'very_active') multiplier = 1.9

    const tdee = bmr * multiplier
    let daily_calorie_goal = tdee
    if (profile?.fitness_goal === 'lose') {
      daily_calorie_goal = tdee - 500
    } else if (profile?.fitness_goal === 'gain') {
      daily_calorie_goal = tdee + 300
    }

    const calorieGoal = Math.round(daily_calorie_goal)
    const protein_g = Math.round(weight * 1.8)
    const fat_g = Math.round((calorieGoal * 0.25) / 9)
    const carbs_g = Math.max(0, Math.round((calorieGoal - (protein_g * 4 + fat_g * 9)) / 4))

    // Fetch consumed foods today
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const { data: foodLogs } = await supabaseClient
      .from('food_logs')
      .select('quantity_grams, foods(calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)')
      .gte('logged_at', startOfDay.toISOString())

    let consumedCalories = 0
    let consumedProtein = 0
    let consumedCarbs = 0
    let consumedFat = 0

    if (foodLogs) {
      foodLogs.forEach((log: any) => {
        const factor = (log.quantity_grams || 0) / 100
        const food = log.foods
        if (food) {
          consumedCalories += (food.calories_per_100g || 0) * factor
          consumedProtein += (food.protein_per_100g || 0) * factor
          consumedCarbs += (food.carbs_per_100g || 0) * factor
          consumedFat += (food.fat_per_100g || 0) * factor
        }
      })
    }

    const remainingCalories = Math.max(0, Math.round(calorieGoal - consumedCalories))
    const remainingProtein = Math.max(0, Math.round(protein_g - consumedProtein))
    const remainingCarbs = Math.max(0, Math.round(carbs_g - consumedCarbs))
    const remainingFat = Math.max(0, Math.round(fat_g - consumedFat))

    // Construct System Prompt
    const systemPrompt = `You are a helpful, encouraging, and intelligent diet/nutrition assistant for a fitness app called Govio. 
Here is the user's fitness profile and today's tracked nutrition data to help you customize your response:
- Name: ${profile?.full_name || 'User'}
- Gender: ${profile?.gender || 'not specified'}
- Age: ${age} years
- Weight: ${weight} kg
- Height: ${height} cm
- Fitness Goal: ${profile?.fitness_goal || 'not specified'}
- Experience Level: ${profile?.experience_level || 'beginner'}
- Dietary Preference: ${profile?.dietary_preference || 'none'}

Today's Nutrition Summary:
- Target Calories: ${calorieGoal} kcal
- Consumed Calories: ${Math.round(consumedCalories)} kcal
- Remaining Calories: ${remainingCalories} kcal
- Target Protein: ${protein_g}g
- Consumed Protein: ${Math.round(consumedProtein)}g
- Remaining Protein: ${remainingProtein}g
- Remaining Carbs: ${remainingCarbs}g
- Remaining Fat: ${remainingFat}g

Provide practical, clear, and highly concise meal/diet advice. Keep answers conversational, helpful, and under 150 words.
IMPORTANT: You are a nutrition assistant, not a doctor. If the user asks about medical issues, injuries, or diagnosing health conditions, politely advise them to consult a qualified medical professional or registered dietitian. Do not provide medical advice or diagnoses.`

    // Construct messages array for Anthropic Claude (filtering history to keep last 6 messages)
    const formattedHistory = (conversationHistory || [])
      .slice(-6)
      .map((item: any) => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.content
      }))

    formattedHistory.push({ role: 'user', content: message })

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: formattedHistory,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API Error:', errText)
      throw new Error(`Anthropic API responded with status ${response.status}: ${errText}`)
    }

    const resJson = await response.json()
    const replyText = resJson.content?.[0]?.text || 'No response generated.'

    return new Response(JSON.stringify({ text: replyText }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('Edge Function Error:', err.message)
    return new Response(JSON.stringify({ error: 'INTERNAL_ERROR', message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
