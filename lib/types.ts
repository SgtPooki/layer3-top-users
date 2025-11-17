/**
 * Domain type definitions
 *
 * This module contains shared type definitions used across the application.
 * Keeping types separate from components ensures clean architecture and
 * prevents circular dependencies.
 *
 * @module lib/types
 */

/**
 * Represents a Layer3 user with their leaderboard information
 */
export interface UserData {
  rank: number;
  address: string;
  avatarCid: string;
  username: string;
  gmStreak: number;
  xp: number;
  level: number;
}

/**
 * Response interface from the Layer3 users API endpoint
 */
export interface UsersApiResponse {
  users: UserData[];
  error?: string;
}
