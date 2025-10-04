import PageTemplate, { generateMetadata } from './[slug]/page'

// Enable ISR for better SEO and Core Web Vitals
export const revalidate = 600 // Revalidate every 10 minutes

export default PageTemplate

export { generateMetadata }
