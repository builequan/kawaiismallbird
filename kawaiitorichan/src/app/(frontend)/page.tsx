import PageTemplate, { generateMetadata } from './[slug]/page'

// Skip pre-rendering during build, but cache at runtime
export const dynamic = 'force-dynamic'
export const revalidate = 600 // Revalidate every 10 minutes

export default PageTemplate

export { generateMetadata }
