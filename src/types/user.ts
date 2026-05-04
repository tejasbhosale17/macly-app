export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type GoalType = 'fat-loss' | 'maintenance' | 'lean-bulk' | 'muscle-gain';

export type UserProfile = {
  id: number;
  name: string;
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
  gender: Gender | null;
  activityLevel: ActivityLevel | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertUserProfileInput = {
  name: string;
  age?: number | null;
  weightKg?: number | null;
  heightCm?: number | null;
  gender?: Gender | null;
  activityLevel?: ActivityLevel | null;
};

export type MacroGoals = {
  id: number;
  userId: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  goalType: GoalType;
  updatedAt: string;
};

export type UpsertMacroGoalsInput = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  goalType?: GoalType;
};
