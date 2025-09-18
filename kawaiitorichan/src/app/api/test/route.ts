import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URI: process.env.DATABASE_URI ? 'SET' : 'NOT SET',
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'not set',
      PORT: process.env.PORT || 'not set',
    },
    versions: {
      node: process.version,
    }
  })
}