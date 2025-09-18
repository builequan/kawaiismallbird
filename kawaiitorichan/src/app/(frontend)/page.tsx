import PageTemplate, { generateMetadata } from './[slug]/page'

// Force dynamic rendering to avoid build-time Payload initialization issues
export const dynamic = 'force-dynamic'

export default PageTemplate

export { generateMetadata }
