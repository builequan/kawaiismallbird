import { Metadata } from 'next'
import { redirect } from 'next/navigation'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Redirect to the proper category page
export default function BirdHealthRedirect() {
  redirect('/categories/bird-health')
}