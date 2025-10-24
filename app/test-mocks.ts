/**
 * Mock API Test Suite
 * Tests all 15 endpoints to verify they work correctly
 */

// Simulate auth token
const AUTH_TOKEN = 'test-token-123'
const API_BASE = 'http://localhost:5173/api'

interface TestResult {
  endpoint: string
  method: string
  status: 'PASS' | 'FAIL'
  statusCode?: number
  error?: string
  responseTime?: number
  notes?: string
}

const results: TestResult[] = []

// Helper function to make API calls
async function apiCall(
  method: string,
  endpoint: string,
  body?: any,
  requiresAuth: boolean = true
): Promise<TestResult> {
  const startTime = Date.now()
  const url = `${API_BASE}${endpoint}`

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(requiresAuth && { Authorization: `Bearer ${AUTH_TOKEN}` })
      },
      body: body ? JSON.stringify(body) : undefined
    })

    const responseTime = Date.now() - startTime
    const data = await response.json()

    return {
      endpoint,
      method,
      status: response.ok ? 'PASS' : 'FAIL',
      statusCode: response.status,
      responseTime,
      notes: JSON.stringify(data).slice(0, 100)
    }
  } catch (error) {
    return {
      endpoint,
      method,
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    }
  }
}

// Test suite
async function runTests() {
  console.log('🚀 Starting Mock API Test Suite...\n')
  console.log('=' .repeat(80))

  // ONBOARDING TESTS (3 endpoints)
  console.log('\n📝 ONBOARDING SERVICE TESTS\n')

  // Test 1: Get questions
  const test1 = await apiCall('GET', '/onboarding/questions')
  results.push(test1)
  console.log(`${test1.status === 'PASS' ? '✅' : '❌'} GET /onboarding/questions - ${test1.status} (${test1.statusCode})`)

  // Test 2: Submit answers
  const test2 = await apiCall('POST', '/onboarding/answers', {
    answers: [
      { questionId: 'q1', answer: 'John' },
      { questionId: 'q2', answer: 28 }
    ]
  })
  results.push(test2)
  console.log(`${test2.status === 'PASS' ? '✅' : '❌'} POST /onboarding/answers - ${test2.status} (${test2.statusCode})`)

  // Test 3: Complete onboarding
  const test3 = await apiCall('POST', '/onboarding/complete')
  results.push(test3)
  console.log(`${test3.status === 'PASS' ? '✅' : '❌'} POST /onboarding/complete - ${test3.status} (${test3.statusCode})`)

  // MATCHING TESTS (6 endpoints)
  console.log('\n❤️  MATCHING SERVICE TESTS\n')

  // Test 4: Get discover profiles
  const test4 = await apiCall('GET', '/matching/discover')
  results.push(test4)
  console.log(`${test4.status === 'PASS' ? '✅' : '❌'} GET /matching/discover - ${test4.status} (${test4.statusCode})`)

  // Test 5: Like a profile
  const test5 = await apiCall('POST', '/matching/like/discover-1')
  results.push(test5)
  console.log(`${test5.status === 'PASS' ? '✅' : '❌'} POST /matching/like/:userId - ${test5.status} (${test5.statusCode})`)

  // Test 6: Pass a profile
  const test6 = await apiCall('POST', '/matching/pass/discover-2')
  results.push(test6)
  console.log(`${test6.status === 'PASS' ? '✅' : '❌'} POST /matching/pass/:userId - ${test6.status} (${test6.statusCode})`)

  // Test 7: Get matches
  const test7 = await apiCall('GET', '/matching/matches')
  results.push(test7)
  console.log(`${test7.status === 'PASS' ? '✅' : '❌'} GET /matching/matches - ${test7.status} (${test7.statusCode})`)

  // Test 8: Get interested users
  const test8 = await apiCall('GET', '/matching/interested')
  results.push(test8)
  console.log(`${test8.status === 'PASS' ? '✅' : '❌'} GET /matching/interested - ${test8.status} (${test8.statusCode})`)

  // Test 9: Unmatch
  // First get a match ID
  const matchesResponse = await fetch(`${API_BASE}/matching/matches`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
  })
  const matches = await matchesResponse.json()
  const matchId = matches[0]?.id || 'test-match-id'

  const test9 = await apiCall('DELETE', `/matching/matches/${matchId}`)
  results.push(test9)
  console.log(`${test9.status === 'PASS' ? '✅' : '❌'} DELETE /matching/matches/:matchId - ${test9.status} (${test9.statusCode})`)

  // CHAT TESTS (6 endpoints)
  console.log('\n💬 CHAT SERVICE TESTS\n')

  // Get a valid match ID for chat tests
  const matchesResponse2 = await fetch(`${API_BASE}/matching/matches`, {
    headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
  })
  const matches2 = await matchesResponse2.json()
  const chatMatchId = matches2[0]?.id || 'test-match-id'

  // Test 10: Get messages for a match
  const test10 = await apiCall('GET', `/chat/matches/${chatMatchId}/messages`)
  results.push(test10)
  console.log(`${test10.status === 'PASS' ? '✅' : '❌'} GET /chat/matches/:matchId/messages - ${test10.status} (${test10.statusCode})`)

  // Test 11: Send a message
  const test11 = await apiCall('POST', `/chat/matches/${chatMatchId}/messages`, {
    content: 'Hello! This is a test message.'
  })
  results.push(test11)
  console.log(`${test11.status === 'PASS' ? '✅' : '❌'} POST /chat/matches/:matchId/messages - ${test11.status} (${test11.statusCode})`)

  // Test 12: Mark messages as read
  const test12 = await apiCall('POST', `/chat/matches/${chatMatchId}/read`)
  results.push(test12)
  console.log(`${test12.status === 'PASS' ? '✅' : '❌'} POST /chat/matches/:matchId/read - ${test12.status} (${test12.statusCode})`)

  // Test 13: Get AI chat history
  const test13 = await apiCall('GET', '/chat/ai/messages')
  results.push(test13)
  console.log(`${test13.status === 'PASS' ? '✅' : '❌'} GET /chat/ai/messages - ${test13.status} (${test13.statusCode})`)

  // Test 14: Send message to AI
  const test14 = await apiCall('POST', '/chat/ai/messages', {
    content: 'Hello AI! Tell me about matching.'
  })
  results.push(test14)
  console.log(`${test14.status === 'PASS' ? '✅' : '❌'} POST /chat/ai/messages - ${test14.status} (${test14.statusCode})`)

  // Test 15: Answer AI question
  const test15 = await apiCall('POST', '/chat/ai/answer', {
    questionId: 'q-test',
    answer: 'Test answer'
  })
  results.push(test15)
  console.log(`${test15.status === 'PASS' ? '✅' : '❌'} POST /chat/ai/answer - ${test15.status} (${test15.statusCode})`)

  // ERROR SCENARIO TESTS
  console.log('\n🔒 AUTH & ERROR TESTS\n')

  // Test 16: Unauthorized request (no token)
  const test16 = await apiCall('GET', '/onboarding/questions', undefined, false)
  results.push({ ...test16, endpoint: '/onboarding/questions (no auth)' })
  console.log(`${test16.statusCode === 401 ? '✅' : '❌'} Auth test - Should return 401 - Got ${test16.statusCode}`)

  // Test 17: Invalid request body
  const test17 = await apiCall('POST', '/onboarding/answers', { invalid: 'data' })
  results.push({ ...test17, endpoint: '/onboarding/answers (invalid body)' })
  console.log(`${test17.statusCode === 400 ? '✅' : '❌'} Invalid body test - Should return 400 - Got ${test17.statusCode}`)

  // SUMMARY
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 TEST SUMMARY\n')

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const avgResponseTime = results.reduce((acc, r) => acc + (r.responseTime || 0), 0) / results.length

  console.log(`Total Tests: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚡ Avg Response Time: ${avgResponseTime.toFixed(2)}ms`)
  console.log(`\n${passed === results.length ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'}`)

  // Detailed failures
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:\n')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.method} ${r.endpoint}`)
      console.log(`    Error: ${r.error || 'Status ' + r.statusCode}`)
      if (r.notes) console.log(`    Response: ${r.notes}`)
    })
  }

  return { passed, failed, total: results.length, avgResponseTime }
}

// Run tests
runTests().then(summary => {
  process.exit(summary.failed > 0 ? 1 : 0)
})