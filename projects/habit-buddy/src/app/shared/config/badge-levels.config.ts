import { BadgeLevel } from '../models/habit.model';

/**
 * Centralized Badge Level Configuration
 * 
 * This file contains all badge level definitions, thresholds, and styling.
 * Update this file to modify the badge system across the entire application.
 */

export interface BadgeConfig {
  level: BadgeLevel;
  name: string;
  description: string;
  icon: string;
  daysRequired: number;
  colors: {
    background: string;
    text: string;
    border: string;
  };
}

/**
 * Badge Level Definitions
 * 
 * Each badge level defines:
 * - Minimum days required to achieve
 * - Display name and description
 * - Icon to use (Lucide icon name)
 * - Color scheme for UI styling
 */
export const BADGE_LEVELS: BadgeConfig[] = [
  {
    level: BadgeLevel.NOVICE,
    name: 'Novice',
    description: 'Starting your journey!',
    icon: 'Sparkles',
    daysRequired: 0,
    colors: {
      background: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-200'
    }
  },
  {
    level: BadgeLevel.BEGINNER,
    name: 'Beginner',
    description: '7+ days completed!',
    icon: 'Sprout',
    daysRequired: 7,
    colors: {
      background: 'bg-green-100',
      text: 'text-green-600',
      border: 'border-green-200'
    }
  },
  {
    level: BadgeLevel.INTERMEDIATE,
    name: 'Intermediate',
    description: '21+ days completed!',
    icon: 'Target',
    daysRequired: 21,
    colors: {
      background: 'bg-blue-100',
      text: 'text-blue-600',
      border: 'border-blue-200'
    }
  },
  {
    level: BadgeLevel.ADVANCED,
    name: 'Advanced',
    description: '50+ days completed!',
    icon: 'Star',
    daysRequired: 50,
    colors: {
      background: 'bg-purple-100',
      text: 'text-purple-600',
      border: 'border-purple-200'
    }
  },
  {
    level: BadgeLevel.EXPERT,
    name: 'Expert',
    description: '75+ days completed!',
    icon: 'Trophy',
    daysRequired: 75,
    colors: {
      background: 'bg-orange-100',
      text: 'text-orange-600',
      border: 'border-orange-200'
    }
  },
  {
    level: BadgeLevel.MASTER,
    name: 'Master',
    description: '100+ days completed!',
    icon: 'Crown',
    daysRequired: 100,
    colors: {
      background: 'bg-yellow-100',
      text: 'text-yellow-600',
      border: 'border-yellow-200'
    }
  }
];

/**
 * Helper Functions
 */

/**
 * Get badge configuration for a specific level
 */
export function getBadgeConfig(level: BadgeLevel): BadgeConfig | undefined {
  return BADGE_LEVELS.find(badge => badge.level === level);
}

/**
 * Get badge configuration based on completed days
 */
export function getBadgeConfigForDays(completedDays: number): BadgeConfig {
  // Find the highest badge level the user has achieved
  for (let i = BADGE_LEVELS.length - 1; i >= 0; i--) {
    if (completedDays >= BADGE_LEVELS[i].daysRequired) {
      return BADGE_LEVELS[i];
    }
  }
  // Fallback to novice if somehow no match
  return BADGE_LEVELS[0];
}

/**
 * Get next badge level to work towards
 */
export function getNextBadgeConfig(completedDays: number): BadgeConfig | null {
  const currentBadge = getBadgeConfigForDays(completedDays);
  const currentIndex = BADGE_LEVELS.findIndex(badge => badge.level === currentBadge.level);
  
  // Return next badge or null if already at max level
  return currentIndex < BADGE_LEVELS.length - 1 ? BADGE_LEVELS[currentIndex + 1] : null;
}

/**
 * Calculate progress percentage towards next badge level
 */
export function calculateProgressToNextLevel(completedDays: number): number {
  const nextBadge = getNextBadgeConfig(completedDays);
  if (!nextBadge) return 100; // Already at max level
  
  const currentBadge = getBadgeConfigForDays(completedDays);
  const progressRange = nextBadge.daysRequired - currentBadge.daysRequired;
  const currentProgress = completedDays - currentBadge.daysRequired;
  
  return Math.round(Math.min(100, (currentProgress / progressRange) * 100));
}

/**
 * Get all badge levels as filter options for UI
 */
export function getBadgeFilterOptions() {
  return [
    { value: 'all', label: 'All Goals', count: 0, icon: 'Grid3X3' },
    ...BADGE_LEVELS.map(badge => ({
      value: badge.level,
      label: badge.name,
      count: 0,
      icon: badge.icon
    }))
  ];
}
