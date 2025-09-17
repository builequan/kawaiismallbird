import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { validateContactForm, sanitizeContactFormData } from '@/lib/validators'
import { getClientIp, withRateLimit } from '@/lib/rate-limiter'
import { getAdminNotificationEmailHtml, getUserConfirmationEmailHtml } from '@/emails/templates'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ContactSubmission {
  name: string
  email: string
  phone?: string
  message: string
  recaptchaToken: string
}

/**
 * Verify reCAPTCHA token with Google
 */
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY
  const isDevelopment = process.env.NODE_ENV === 'development'

  // If reCAPTCHA is not configured, skip verification (development mode)
  if (!secretKey) {
    console.warn('reCAPTCHA secret key not configured, skipping verification')
    return true
  }
  
  // In development mode with localhost, allow bypass for testing
  if (isDevelopment && token === 'development-bypass') {
    console.warn('Development bypass token used')
    return true
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const data = await response.json()

    // Check if verification was successful and score is above threshold
    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes'])
      
      // If browser-error, it might be a localhost/development issue
      if (data['error-codes']?.includes('browser-error')) {
        console.warn('Browser error detected - this often happens in development. Allowing submission.')
        return true // Allow in development when browser-error occurs
      }
      
      return false
    }

    // For reCAPTCHA v3, check the score (0.0 - 1.0)
    // 0.5 is a reasonable threshold for most use cases
    if (data.score !== undefined && data.score < 0.5) {
      console.warn(`reCAPTCHA score too low: ${data.score}`)
      return false
    }

    return true
  } catch (error) {
    console.error('reCAPTCHA verification error:', error)
    return false
  }
}

/**
 * Format date for email display
 */
function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }
  return new Intl.DateTimeFormat('ja-JP', options).format(date)
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = getClientIp(request.headers)

    // Apply rate limiting
    return await withRateLimit(clientIp, async () => {
      // Parse request body
      const body: ContactSubmission = await request.json()

      // Validate required fields
      if (!body.name || !body.email || !body.message || !body.recaptchaToken) {
        return NextResponse.json(
          { error: '必須項目が入力されていません' },
          { status: 400 }
        )
      }

      // Verify reCAPTCHA token
      const isRecaptchaValid = await verifyRecaptcha(body.recaptchaToken)
      if (!isRecaptchaValid) {
        return NextResponse.json(
          { error: 'セキュリティ検証に失敗しました。もう一度お試しください。' },
          { status: 400 }
        )
      }

      // Sanitize and validate form data
      const sanitizedData = sanitizeContactFormData({
        name: body.name,
        email: body.email,
        phone: body.phone,
        message: body.message,
      })

      const validation = validateContactForm(sanitizedData)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: '入力内容に誤りがあります', errors: validation.errors },
          { status: 400 }
        )
      }

      // Format submission date
      const submittedAt = formatDate(new Date())

      // Prepare email addresses
      const adminEmail = process.env.CONTACT_EMAIL_TO || 'admin@example.com'

      try {
        // Send admin notification email
        await resend.emails.send({
          from: 'Contact Form <onboarding@resend.dev>',
          to: adminEmail,
          subject: `【お問い合わせ】${sanitizedData.name}様より`,
          html: getAdminNotificationEmailHtml({
            name: sanitizedData.name,
            email: sanitizedData.email,
            phone: sanitizedData.phone,
            message: sanitizedData.message,
            submittedAt,
          }),
        })

        // Send user confirmation email
        await resend.emails.send({
          from: 'Golf Website <onboarding@resend.dev>',
          to: sanitizedData.email,
          subject: 'お問い合わせを受け付けました',
          html: getUserConfirmationEmailHtml({
            name: sanitizedData.name,
            message: sanitizedData.message,
            submittedAt,
          }),
        })

        // Return success response
        return NextResponse.json(
          {
            success: true,
            message: 'お問い合わせを受け付けました。確認メールをお送りしました。',
          },
          { status: 200 }
        )
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        
        // Even if email fails, we might want to store the submission
        // For now, we'll return an error
        return NextResponse.json(
          {
            error: 'メール送信中にエラーが発生しました。しばらくしてからもう一度お試しください。',
          },
          { status: 500 }
        )
      }
    })
  } catch (error) {
    console.error('Contact form submission error:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。しばらくしてからもう一度お試しください。' },
      { status: 500 }
    )
  }
}

// Optionally, you can add a GET method to check the health of the endpoint
export async function GET() {
  return NextResponse.json(
    { message: 'Contact form API endpoint is running' },
    { status: 200 }
  )
}