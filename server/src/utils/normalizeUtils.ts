/**
 * Utility functions for normalizing item names and checking duplicates
 */

/**
 * Normalize item name to a consistent format for duplicate checking and storage
 * Converts to lowercase, replaces underscores with spaces, removes extra spaces and punctuation
 */
export function normalizeItemName(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .replace(/_+/g, ' ')    // replace underscores with spaces
    .replace(/[^\w\s]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')   // normalize multiple spaces to single
    .trim();
}

import { PrismaClient } from '@prisma/client';

/**
 * Check if a pull is a duplicate in the database using normalized name and time
 * Important: This should only check for duplicates from PREVIOUS imports,
 * not within the current import session (to allow multiple items in 10-pull batches)
 */
export async function isDuplicatePullInDB(
  prisma: PrismaClient,
  userId: number,
  itemName: string,
  bannerId: string,
  time: Date,
  currentImportStartTime: Date = new Date() // When current import started
): Promise<boolean> {
  const normalizedName = normalizeItemName(itemName);
  
  // Check for exact time AND name match, but only in data imported BEFORE current session
  // This allows duplicate items within the same 10-pull batch (same time)
  // but prevents duplicates from previous imports
  const exactMatches = await prisma.gachaPull.findMany({
    where: {
      userId,
      bannerId,
      game: 'GENSHIN',
      time: time, // Exact time match
      // Only check records created before current import session
      // Use a smaller buffer (5 seconds) to allow cross-import duplicate detection
      // while still preventing within-session duplicates
      createdAt: {
        lt: new Date(currentImportStartTime.getTime() - 5000) // 5 second buffer
      }
    }
  });
  
  // A duplicate exists only if we find a pull with the same normalized name 
  // at the exact same time from a PREVIOUS import session
  for (const existingPull of exactMatches) {
    const existingNormalized = normalizeItemName(existingPull.itemName);
    if (existingNormalized === normalizedName) {
      console.log(`🔍 Cross-import duplicate found: ${normalizedName} at ${time.toISOString()}`);
      return true;
    }
  }
  
  return false;
}
