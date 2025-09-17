/**
 * Test script for contact form
 * Note: This simulates form submission for testing purposes
 */

async function testContactForm() {
  console.log('🧪 Testing Contact Form Submission...\n')

  const testData = {
    name: 'テスト太郎',
    email: 'test@example.com',
    phone: '090-1234-5678',
    message: 'これはテストメッセージです。フォームが正しく動作しているか確認しています。',
    recaptchaToken: 'test-token-for-development'
  }

  console.log('📝 Sending test data:')
  console.log(JSON.stringify(testData, null, 2))

  try {
    const response = await fetch('http://localhost:3000/api/contact-submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    })

    const result = await response.json()
    
    console.log('\n📨 Response Status:', response.status)
    console.log('📬 Response Data:')
    console.log(JSON.stringify(result, null, 2))

    if (response.ok) {
      console.log('\n✅ Test PASSED: Contact form submission successful!')
      console.log('Check your email at:', process.env.CONTACT_EMAIL_TO || 'builequan89@gmail.com')
    } else {
      console.log('\n❌ Test FAILED:', result.error || 'Unknown error')
      
      if (result.error?.includes('セキュリティ検証')) {
        console.log('\n💡 Note: reCAPTCHA validation failed. This is expected in test environment.')
        console.log('To fully test, please use the actual form at http://localhost:3000/contact')
      }
    }
  } catch (error) {
    console.error('\n❌ Test ERROR:', error)
  }
}

// Test rate limiting
async function testRateLimiting() {
  console.log('\n🚦 Testing Rate Limiting...\n')

  const testData = {
    name: 'レート制限テスト',
    email: 'ratelimit@example.com',
    phone: '',
    message: 'Rate limiting test message',
    recaptchaToken: 'test-token'
  }

  // Send 4 requests rapidly (limit is 3 per minute)
  for (let i = 1; i <= 4; i++) {
    console.log(`Request ${i}:`)
    
    try {
      const response = await fetch('http://localhost:3000/api/contact-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      })

      const result = await response.json()
      
      if (response.status === 429) {
        console.log(`  ✅ Rate limit enforced after ${i - 1} requests`)
        console.log(`  Retry after: ${result.retryAfter} seconds`)
        break
      } else {
        console.log(`  Response: ${response.status}`)
      }
    } catch (error) {
      console.error(`  Error:`, error)
    }
  }
}

// Run tests
console.log('========================================')
console.log('   Contact Form Test Suite')
console.log('========================================\n')

testContactForm().then(() => {
  // Uncomment to test rate limiting
  // return testRateLimiting()
})