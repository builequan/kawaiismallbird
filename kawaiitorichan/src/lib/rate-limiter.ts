/**
 * Simple in-memory rate limiter for contact form submissions
 * In production, consider using Redis for distributed rate limiting
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 3, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Check if a request from the given identifier is allowed
   */
  async checkLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now()
    const entry = this.limits.get(identifier)

    // If no entry exists or the window has expired, allow the request
    if (!entry || now > entry.resetTime) {
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return { allowed: true }
    }

    // If within the window, check the count
    if (entry.count < this.maxRequests) {
      entry.count++
      return { allowed: true }
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
      }
    }
  }

  /**
   * Reset the limit for a specific identifier
   */
  reset(identifier: string): void {
    this.limits.delete(identifier)
  }

  /**
   * Get current limit status for an identifier
   */
  getStatus(identifier: string): { remaining: number; resetTime: number | null } {
    const entry = this.limits.get(identifier)
    if (!entry) {
      return { remaining: this.maxRequests, resetTime: null }
    }
    
    const now = Date.now()
    if (now > entry.resetTime) {
      return { remaining: this.maxRequests, resetTime: null }
    }
    
    return {
      remaining: Math.max(0, this.maxRequests - entry.count),
      resetTime: entry.resetTime,
    }
  }
}

// Create a singleton instance for contact form submissions
// 3 requests per minute per IP
export const contactFormLimiter = new RateLimiter(3, 60000)

/**
 * Extract client IP from request headers
 * Handles various proxy configurations
 */
export function getClientIp(headers: Headers): string {
  // Check various headers that might contain the real IP
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for may contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback to a default if no IP can be determined
  return 'unknown'
}

/**
 * Rate limit middleware for API routes
 */
export async function withRateLimit(
  identifier: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const { allowed, retryAfter } = await contactFormLimiter.checkLimit(identifier)

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: 'リクエストが多すぎます。しばらくしてからもう一度お試しください。',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter?.toString() || '60',
        },
      }
    )
  }

  return handler()
}