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

/**
 * Get the correct rarity for an item from the database mapping
 * Falls back to provided rankType if no mapping found
 */
export async function getItemRarity(
  prisma: PrismaClient,
  itemName: string,
  game: 'GENSHIN' | 'HSR',
  fallbackRankType?: number | string
): Promise<number> {
  const normalizedName = normalizeItemName(itemName);

  // Try to find the item in our mapping database
  const mapping = await prisma.itemNameMapping.findFirst({
    where: {
      englishName: normalizedName,
      game: game
    }
  }) as any;

  if (mapping && mapping.rarity) {
    console.log(`✅ Found rarity mapping for "${itemName}" (${game}): ${mapping.rarity}★`);
    return mapping.rarity;
  }

  // If no mapping found, try alternative name matching
  const alternativeMapping = await prisma.itemNameMapping.findFirst({
    where: {
      OR: [
        {
          russianName: {
            contains: normalizedName
          },
          game: game
        },
        {
          englishName: {
            contains: normalizedName.split(' ')[0] // Try first word
          },
          game: game
        }
      ]
    }
  }) as any;

  if (alternativeMapping && alternativeMapping.rarity) {
    console.log(`✅ Found alternative rarity mapping for "${itemName}" (${game}): ${alternativeMapping.rarity}★`);
    return alternativeMapping.rarity;
  }

  // Fallback to provided rankType or default to 4★
  const fallbackRarity = fallbackRankType ? parseInt(String(fallbackRankType)) : 4;
  console.log(`⚠️ No rarity mapping found for "${itemName}" (${game}), using fallback: ${fallbackRarity}★`);
  return fallbackRarity;
}
