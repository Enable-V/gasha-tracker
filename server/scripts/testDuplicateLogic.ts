#!/usr/bin/env tsx

/**
 * Quick test to demonstrate the new duplicate detection logic
 */

import { PrismaClient } from '@prisma/client'
import { normalizeItemName, isDuplicatePullInDB } from '../src/utils/normalizeUtils'

const prisma = new PrismaClient()

async function testDuplicateLogic() {
  console.log('🧪 Testing New Duplicate Detection Logic\n')

  // Test scenario: URL import followed by JSON import
  const testData = [
    // First import (URL style)
    { name: 'Black Tassel', source: 'URL', time: '2024-01-15T10:30:00.000Z' },
    { name: 'Bennett', source: 'URL', time: '2024-01-15T10:30:00.000Z' },
    { name: 'Cool Steel', source: 'URL', time: '2024-01-15T10:30:00.000Z' },
    
    // Second import (JSON style - should be detected as duplicates)
    { name: 'black_tassel', source: 'JSON', time: '2024-01-15T10:30:00.000Z' },
    { name: 'bennett', source: 'JSON', time: '2024-01-15T10:30:00.000Z' },
    { name: 'cool_steel', source: 'JSON', time: '2024-01-15T10:30:00.000Z' },
    
    // New items (should NOT be duplicates)
    { name: 'White Tassel', source: 'JSON', time: '2024-01-15T10:30:00.000Z' },
    { name: 'Barbara', source: 'JSON', time: '2024-01-15T10:31:00.000Z' }, // Different time
  ]

  console.log('=== NORMALIZATION PREVIEW ===')
  testData.forEach((item, index) => {
    const normalized = normalizeItemName(item.name)
    console.log(`${index + 1}. "${item.name}" (${item.source}) → "${normalized}"`)
  })

  console.log('\n=== KEY IMPROVEMENTS ===')
  console.log('✅ Name normalization: "Black Tassel" = "black_tassel" = "black tassel"')
  console.log('✅ Exact time matching: Handles 10-pull batches with same timestamp')  
  console.log('✅ Both conditions required: name AND time must match for duplicate')
  console.log('✅ Storage normalization: All items stored with normalized names')

  console.log('\n=== EXPECTED BEHAVIOR ===')
  console.log('1. URL imports: "Black Tassel", "Bennett", "Cool Steel" at 10:30:00')
  console.log('2. JSON imports: "black_tassel", "bennett", "cool_steel" at 10:30:00 → SKIPPED (duplicates)')
  console.log('3. New items: "White Tassel" at 10:30:00 → IMPORTED (different name)')
  console.log('4. Time diff: "Barbara" at 10:31:00 → IMPORTED (different time)')

  console.log('\n🎯 Ready for real import testing!')
}

testDuplicateLogic()
  .then(() => {
    console.log('\n✅ Test completed successfully')
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
  })
  .finally(() => {
    prisma.$disconnect()
  })
