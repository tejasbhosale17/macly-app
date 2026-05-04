import OpenAI from 'openai';

export type LLMParsedFood = {
  name: string;
  quantity_g: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
};

type LLMParseResponse = {
  foods: LLMParsedFood[];
};

type LLMSuggestionsResponse = {
  suggestions: string[];
};

function getClient(): OpenAI | null {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return null;
  }
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}

export function isOpenAIConfigured(): boolean {
  return getClient() !== null;
}

export async function parseFoodsWithLLM(userInput: string): Promise<LLMParsedFood[] | null> {
  const openai = getClient();
  if (!openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition expert. Parse user food input into structured JSON.
For each food item mentioned, return its name, the quantity consumed in grams, and estimated macros per 100g.
If quantity is unclear, use a sensible default (e.g. 1 serving).
Return ONLY valid JSON in this exact format:
{
  "foods": [
    {
      "name": "food name",
      "quantity_g": 200,
      "calories_per_100g": 150,
      "protein_per_100g": 10,
      "carbs_per_100g": 20,
      "fat_per_100g": 5
    }
  ]
}`,
        },
        {
          role: 'user',
          content: userInput,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 600,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as LLMParseResponse;
    if (!Array.isArray(parsed.foods)) return null;

    return parsed.foods;
  } catch {
    return null;
  }
}

export async function getMealSuggestionsFromLLM(params: {
  remainingCalories: number;
  remainingProteinG: number;
  remainingCarbsG: number;
  remainingFatG: number;
  goalType: string | null;
}): Promise<string[] | null> {
  const openai = getClient();
  if (!openai) return null;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a nutrition coach. Suggest 3 practical, specific meal ideas based on remaining daily macros.
Return ONLY valid JSON: { "suggestions": ["meal 1", "meal 2", "meal 3"] }
Each suggestion must be under 20 words and include specific foods and rough portions.`,
        },
        {
          role: 'user',
          content: `Remaining for today: ${params.remainingCalories} kcal, ${params.remainingProteinG}g protein, ${params.remainingCarbsG}g carbs, ${params.remainingFatG}g fat. Goal: ${params.goalType ?? 'maintenance'}.`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 250,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as LLMSuggestionsResponse;
    if (!Array.isArray(parsed.suggestions)) return null;

    return parsed.suggestions;
  } catch {
    return null;
  }
}
