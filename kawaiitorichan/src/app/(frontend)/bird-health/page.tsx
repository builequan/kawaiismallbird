import { Metadata } from 'next'
import { redirect } from 'next/navigation'

// Redirect to the proper category page
export default function BirdHealthRedirect() {
  redirect('/categories/bird-health')
}