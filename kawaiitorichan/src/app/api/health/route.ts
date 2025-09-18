import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check if essential environment variables are set
    const checks = {
      database: !!process.env.DATABASE_URI,
      payload: !!process.env.PAYLOAD_SECRET,
      server: !!process.env.NEXT_PUBLIC_SERVER_URL,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }

    // Basic health check - return 200 if env vars are set
    const isHealthy = checks.database && checks.payload

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'unhealthy',
        checks,
      },
      { status: isHealthy ? 200 : 503 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}