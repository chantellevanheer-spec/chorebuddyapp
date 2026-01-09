
import { Gamepad2, Film, IceCream, DollarSign, Gift, Star, Heart, Trophy, Sparkles, Zap, Coffee, Pizza } from 'lucide-react';

export const AVATAR_COLORS = {
  lavender: "border-[#C3B1E1] bg-purple-50",
  mint: "border-green-400 bg-green-50",
  blue: "border-[#2B59C3] bg-blue-50",
  peach: "border-[#FF6B35] bg-orange-50",
  pink: "border-[#F7A1C4] bg-pink-50"
};

export const CHORE_CATEGORY_COLORS = {
  kitchen: "border-[#FF6B35] bg-orange-50",
  bathroom: "border-[#2B59C3] bg-blue-50",
  living_room: "border-[#C3B1E1] bg-purple-50",
  bedroom: "border-[#F7A1C4] bg-pink-50",
  outdoor: "border-green-400 bg-green-50",
  other: "border-gray-400 bg-gray-50"
};

export const REWARD_CATEGORY_COLORS = {
  privileges: "border-blue-400 bg-blue-50",
  treats: "border-pink-400 bg-pink-50",
  activities: "border-green-400 bg-green-50",
  other: "border-purple-400 bg-purple-50"
};

export const DIFFICULTY_STARS = {
  easy: 1,
  medium: 2,
  hard: 3
};

export const SUBSCRIPTION_LIMITS = {
  free: {
    family_members: 2,
    redeemable_items: 3
  },
  basic: {
    family_members: 6,
    redeemable_items: 10
  },
  premium: {
    family_members: -1, // unlimited
    redeemable_items: -1 // unlimited
  }
};

export const REWARD_ICONS = {
  Gamepad2, Film, IceCream, DollarSign, Gift, Star,
  Heart, Trophy, Sparkles, Zap, Coffee, Pizza
};

export const REWARD_ICON_NAMES = Object.keys(REWARD_ICONS);
