#!/usr/bin/env tsx

/**
 * Test script for item name normalization and duplicate detection logic
 */

import { normalizeItemName } from '../src/utils/normalizeUtils'

// Test cases from the logs
const testCases = [
  // URL vs JSON format differences
  { url: 'Black Tassel', json: 'black_tassel' },
  { url: 'White Tassel', json: 'white_tassel' },
  { url: 'Cool Steel', json: 'cool_steel' },
  { url: 'Debate Club', json: 'debate_club' },
  { url: 'Favonius Sword', json: 'favonius_sword' },
  { url: 'The Bell', json: 'the_bell' },
  { url: 'Eye of Perception', json: 'eye_of_perception' },
  
  // Character names
  { url: 'Bennett', json: 'bennett' },
  { url: 'Fischl', json: 'fischl' },
  { url: 'Xiangling', json: 'xiangling' },
  { url: 'Barbara', json: 'barbara' },
  
  // Edge cases with punctuation
  { url: "Traveler's Handy Sword", json: 'travelers_handy_sword' },
  { url: 'The Stringless', json: 'the_stringless' }
]

console.log('🧪 Testing Item Name Normalization\n')

console.log('=== NORMALIZATION TESTS ===')
testCases.forEach(({ url, json }, index) => {
  const normalizedUrl = normalizeItemName(url)
  const normalizedJson = normalizeItemName(json)
  
  const match = normalizedUrl === normalizedJson
  const status = match ? '✅' : '❌'
  
  console.log(`${index + 1}. ${status}`)
  console.log(`   URL:  "${url}" → "${normalizedUrl}"`)
  console.log(`   JSON: "${json}" → "${normalizedJson}"`)
  console.log(`   Match: ${match}`)
  console.log('')
})

// Summary
const totalTests = testCases.length
const passedTests = testCases.filter(({ url, json }) => 
  normalizeItemName(url) === normalizeItemName(json)
).length

console.log(`\n=== SUMMARY ===`)
console.log(`Total tests: ${totalTests}`)
console.log(`Passed: ${passedTests}`)
console.log(`Failed: ${totalTests - passedTests}`)
console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)

// Test 10-pull scenario timing
console.log(`\n=== 10-PULL TIME SCENARIO ===`)
const tenPullTime = new Date('2024-01-15T10:30:00.000Z')
const items = ['Bennett', 'Cool Steel', 'barbara', 'debate_club', 'The Bell']

console.log(`Simulating 10-pull at: ${tenPullTime.toISOString()}`)
items.forEach((item, i) => {
  const normalized = normalizeItemName(item)
  console.log(`  ${i + 1}. "${item}" → "${normalized}" at ${tenPullTime.toISOString()}`)
})

console.log(`\nKey insight: All items in a 10-pull have the EXACT same timestamp.`)
console.log(`Duplicate detection must check: normalized_name === normalized_name AND time === time`)
console.log(`This prevents false duplicates within the same 10-pull batch.`)
