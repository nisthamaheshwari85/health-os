// ============================================================================
// AI CHEF — pluggable generation engine
//
// Uses the app's real AI dispatcher (lib/aiClient.ts's callAI) instead of
// calling providers directly, so the Chef shares the same AI_PROVIDER
// switch (free | ollama | anthropic), the same timeout handling, and the
// same persona system as the nutrition/workout/mental_health agents.
//
// "free" mode (the default, $0) returns an empty string from callAI by
// design — that's the signal to fall back to the rule-based engine below.
// Any other failure (timeout, bad JSON, provider error) falls back the
// same way, so /chef never breaks in production.
// ============================================================================

import { callAI } from '@/lib/aiClient';
import { AGENT_PERSONAS } from '@/lib/agents/personas';
import type { ChefContext, GenerateRecipesResponse, Recipe } from './types';
import { generateRecipesWithRules } from './rules-engine';

function buildPrompt(ctx: ChefContext, count: number, excludeTitles: string[]): string {
  const lines: string[] = [];
  lines.push(
    `Generate ${count} distinct, realistic, cookable recipes for this person, tailored precisely to ` +
      `the context below. Prefer ingredients they already have. Never suggest anything containing a listed allergen.`
  );

  if (ctx.dietPlan) lines.push(`Diet plan: ${ctx.dietPlan}`);
  if (ctx.coachRecommendations?.length) lines.push(`Coach recommendations: ${ctx.coachRecommendations.join('; ')}`);
  if (ctx.healthGoals?.length) lines.push(`Health goals: ${ctx.healthGoals.join(', ')}`);
  if (ctx.caloriesRemaining != null) lines.push(`Calories remaining today: ${ctx.caloriesRemaining} kcal`);
  if (ctx.proteinTargetG != null) lines.push(`Remaining protein target: ${ctx.proteinTargetG} g`);
  if (ctx.micronutrientFocus?.length) lines.push(`Micronutrients to prioritize: ${ctx.micronutrientFocus.join(', ')}`);
  if (ctx.allergies?.length) lines.push(`STRICT allergen exclusions: ${ctx.allergies.join(', ')}`);
  if (ctx.medicalConditions?.length) lines.push(`Medical conditions to account for: ${ctx.medicalConditions.join(', ')}`);
  if (ctx.bloodMarkersOfNote && Object.keys(ctx.bloodMarkersOfNote).length) {
    lines.push(`Recent lab markers of note: ${JSON.stringify(ctx.bloodMarkersOfNote)}`);
  }
  if (ctx.preferredCuisine) lines.push(`Preferred cuisine: ${ctx.preferredCuisine}`);
  if (ctx.cookingSkill) lines.push(`Cooking skill: ${ctx.cookingSkill}`);
  if (ctx.equipment?.length) lines.push(`Available equipment: ${ctx.equipment.join(', ')}`);
  if (ctx.budgetMode && ctx.budgetMode !== 'none') lines.push(`Budget mode: ${ctx.budgetMode}${ctx.weeklyBudget ? ` (₹${ctx.weeklyBudget}/week)` : ''}`);
  if (ctx.dislikes?.length) lines.push(`Dislikes (avoid): ${ctx.dislikes.join(', ')}`);
  if (ctx.timeBudgetMinutes) lines.push(`Time available to cook: ${ctx.timeBudgetMinutes === 'meal_prep' ? 'batch meal-prep session' : `${ctx.timeBudgetMinutes} minutes`}`);
  if (ctx.healthFocus?.length) lines.push(`Recipe focus: ${ctx.healthFocus.join(', ')}`);
  if (ctx.weather) lines.push(`Current weather: ${ctx.weather}`);
  if (ctx.familyMembers) lines.push(`Cooking for ${ctx.familyMembers} people`);
  if (ctx.mode && ctx.mode !== 'normal') lines.push(`Mode: ${ctx.mode}`);
  if (ctx.mealHistory?.length) lines.push(`Recently eaten (avoid repeating): ${ctx.mealHistory.slice(0, 5).join(', ')}`);
  if (ctx.favoriteRecipeTitles?.length) lines.push(`Known favorites (bias style toward these): ${ctx.favoriteRecipeTitles.join(', ')}`);
  if (ctx.pantry?.length) {
    lines.push(`Pantry on hand: ${ctx.pantry.map((p) => p.name).join(', ')}`);
    if (ctx.pantryOnly) lines.push(`Constraint: use ONLY the pantry items listed above, no shopping trip.`);
  }
  if (excludeTitles.length) lines.push(`Do not repeat these titles: ${excludeTitles.join(', ')}`);

  lines.push(
    `Respond with ONLY a JSON array (no prose, no markdown fences) of ${count} objects, each matching exactly:\n` +
      `{"title": string, "description": string, "cuisine": string, "difficulty": "easy"|"medium"|"hard", ` +
      `"cookTimeMinutes": number, "prepTimeMinutes": number, "servings": number, ` +
      `"calories": number, "proteinG": number, "carbsG": number, "fatG": number, "fiberG": number, ` +
      `"micronutrients": {"<name_unit>": number}, ` +
      `"ingredients": [{"name": string, "quantity": number, "unit": string, "haveInPantry": boolean, "substitution": string|null}], ` +
      `"steps": [{"order": number, "title": string, "instruction": string, "durationMinutes": number|null}], ` +
      `"healthScore": number, "coachCompliance": {"aligned": boolean, "note": string}, ` +
      `"estimatedCost": number, "estimatedCostCurrency": "INR", "tags": [string]}`
  );

  return lines.join('\n');
}

function parseLLMRecipes(raw: string): Recipe[] {
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('LLM did not return a JSON array');

  return parsed.map((r: any): Recipe => ({
    id: crypto.randomUUID(),
    title: r.title,
    description: r.description,
    cuisine: r.cuisine,
    difficulty: r.difficulty,
    cookTimeMinutes: r.cookTimeMinutes,
    prepTimeMinutes: r.prepTimeMinutes ?? 0,
    servings: r.servings ?? 2,
    calories: r.calories,
    proteinG: r.proteinG,
    carbsG: r.carbsG,
    fatG: r.fatG,
    fiberG: r.fiberG,
    micronutrients: r.micronutrients ?? {},
    ingredients: r.ingredients ?? [],
    steps: r.steps ?? [],
    shoppingList: (r.ingredients ?? []).filter((i: any) => !i.haveInPantry),
    healthScore: r.healthScore ?? 70,
    coachCompliance: r.coachCompliance ?? { aligned: true, note: '' },
    estimatedCost: r.estimatedCost,
    estimatedCostCurrency: r.estimatedCostCurrency ?? 'INR',
    tags: r.tags ?? [],
    generatedBy: 'llm',
  }));
}

// A full recipe (ingredients + steps + micronutrients) runs noticeably
// bigger than a chat reply. Scale the token budget with recipe count
// rather than reusing callAI's 600-token chat default, capped so a
// careless "give me 10" doesn't blow past provider limits.
function tokenBudgetFor(count: number): number {
  return Math.min(4000, 500 + count * 700);
}

export async function generateRecipes(
  ctx: ChefContext,
  count = 3,
  excludeTitles: string[] = []
): Promise<GenerateRecipesResponse> {
  try {
    const prompt = buildPrompt(ctx, count, excludeTitles);
    const raw = await callAI(AGENT_PERSONAS.chef.systemPrompt, prompt, tokenBudgetFor(count));

    // "free" provider (no AI configured) — callAI returns "" by design.
    if (!raw) {
      return { recipes: generateRecipesWithRules(ctx, count, excludeTitles), generatedBy: 'rules' };
    }

    const recipes = parseLLMRecipes(raw);
    if (recipes.length === 0) throw new Error('LLM returned zero recipes');
    return { recipes, generatedBy: 'llm' };
  } catch (err) {
    console.error('[ai-chef] LLM generation failed, falling back to rules engine:', err);
    return {
      recipes: generateRecipesWithRules(ctx, count, excludeTitles),
      generatedBy: 'rules',
      warning: 'The smart chef is briefly unavailable — showing curated recipes instead.',
    };
  }
}
