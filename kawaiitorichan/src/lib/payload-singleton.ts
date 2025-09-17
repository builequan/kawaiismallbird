import { getPayload, Payload } from 'payload'
import configPromise from '@payload-config'

let cached: Payload | null = null

export async function getCachedPayload(): Promise<Payload> {
  if (!cached) {
    cached = await getPayload({ config: configPromise })
  }
  return cached
}