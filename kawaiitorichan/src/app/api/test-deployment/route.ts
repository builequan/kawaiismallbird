import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Deployment is working!',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
      DATABASE_URI: process.env.DATABASE_URI ? 'Set' : 'Not set',
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ? 'Set' : 'Not set',
    },
    timestamp: new Date().toISOString(),
  })
}