#!/usr/bin/env tsx
/**
 * Run all affiliate link processing steps
 */

import { spawn } from 'child_process'
import * as path from 'path'

const SCRIPTS_DIR = path.join(process.cwd(), 'scripts', 'affiliate-links')

interface Step {
  name: string
  script: string
  description: string
}

const steps: Step[] = [
  {
    name: 'Import Products',
    script: 'import-products.ts',
    description: 'Import affiliate products from JSON file',
  },
  {
    name: 'Build Index',
    script: '01-build-index.ts',
    description: 'Build product and post indices',
  },
  {
    name: 'Generate Embeddings',
    script: '02-generate-embeddings.ts',
    description: 'Generate semantic embeddings',
  },
  {
    name: 'Compute Similarity',
    script: '03-compute-similarity.ts',
    description: 'Compute product-post similarity',
  },
  {
    name: 'Apply Links',
    script: '04-apply-links.ts',
    description: 'Apply affiliate links to posts',
  },
]

async function runStep(step: Step, args: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('\n' + '='.repeat(50))
    console.log(`🚀 ${step.name}`)
    console.log(`   ${step.description}`)
    console.log('='.repeat(50))
    
    const scriptPath = path.join(SCRIPTS_DIR, step.script)
    const child = spawn('tsx', [scriptPath, ...args], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'your-secret-key-here',
        DATABASE_URI: process.env.DATABASE_URI || 'postgres://postgres:2801@127.0.0.1:5432/golfer',
      },
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Step "${step.name}" failed with code ${code}`))
      }
    })
    
    child.on('error', (err) => {
      reject(err)
    })
  })
}

async function main() {
  try {
    console.log('🎯 Affiliate Link System - Full Pipeline')
    console.log('========================================')
    
    // Parse arguments
    const args = process.argv.slice(2)
    const dryRun = args.includes('--dry-run')
    const skipImport = args.includes('--skip-import')
    const skipIndex = args.includes('--skip-index')
    const limit = args.includes('--limit') 
      ? args[args.indexOf('--limit') + 1] 
      : undefined
    
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be saved')
    }
    
    // Determine which steps to run
    let stepsToRun = [...steps]
    
    if (skipImport) {
      console.log('⏭️  Skipping product import')
      stepsToRun = stepsToRun.filter(s => s.script !== 'import-products.ts')
    }
    
    if (skipIndex) {
      console.log('⏭️  Skipping index building')
      stepsToRun = stepsToRun.filter(s => 
        s.script !== '01-build-index.ts' && 
        s.script !== '02-generate-embeddings.ts' &&
        s.script !== '03-compute-similarity.ts'
      )
    }
    
    // Run steps
    for (const step of stepsToRun) {
      try {
        const stepArgs = []
        
        // Add arguments for specific steps
        if (step.script === '04-apply-links.ts') {
          if (dryRun) stepArgs.push('--dry-run')
          if (limit) stepArgs.push('--limit', limit)
        }
        
        await runStep(step, stepArgs)
        console.log(`✅ ${step.name} completed successfully`)
      } catch (error) {
        console.error(`❌ ${step.name} failed:`, error)
        process.exit(1)
      }
    }
    
    console.log('\n' + '🎉'.repeat(25))
    console.log('✅ All steps completed successfully!')
    console.log('🎉'.repeat(25))
    
    console.log('\n📊 Next Steps:')
    console.log('1. Review the applied links in the Payload admin')
    console.log('2. Check /admin/affiliate-links for management')
    console.log('3. Monitor product performance')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Pipeline failed:', error)
    process.exit(1)
  }
}

// Handle arguments
if (process.argv.includes('--help')) {
  console.log(`
Affiliate Link Processing Pipeline

Usage: tsx run-all.ts [options]

Options:
  --dry-run       Run without saving changes
  --skip-import   Skip product import step
  --skip-index    Skip index, embeddings, and similarity steps
  --limit <n>     Process only n posts
  --help          Show this help message

Examples:
  tsx run-all.ts                    # Run all steps
  tsx run-all.ts --dry-run          # Test without saving
  tsx run-all.ts --skip-import      # Skip import, run other steps
  tsx run-all.ts --limit 10         # Process only 10 posts
`)
  process.exit(0)
}

main().catch(console.error)