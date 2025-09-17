#!/usr/bin/env tsx
/**
 * Main runner script for the internal linking pipeline
 * Runs all steps in sequence: index → embed → similarity → apply
 */

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface StepConfig {
  name: string
  script: string
  args?: string[]
}

/**
 * Run a script step
 */
async function runStep(step: StepConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📌 ${step.name}`)
    console.log(`${'='.repeat(60)}\n`)
    
    const scriptPath = path.join(__dirname, step.script)
    const args = step.args || []
    
    const child = spawn('tsx', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    
    child.on('error', (error) => {
      console.error(`❌ Failed to run ${step.name}:`, error)
      reject(error)
    })
    
    child.on('exit', (code) => {
      if (code === 0) {
        console.log(`✅ ${step.name} completed successfully`)
        resolve()
      } else {
        const error = new Error(`${step.name} failed with exit code ${code}`)
        reject(error)
      }
    })
  })
}

async function runPipeline(options: { dryRun?: boolean; skipIndex?: boolean } = {}) {
  const { dryRun = false, skipIndex = false } = options
  
  console.log('🚀 Starting Internal Linking Pipeline')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'FULL EXECUTION'}`)
  
  const startTime = Date.now()
  
  try {
    const steps: StepConfig[] = []
    
    if (!skipIndex) {
      steps.push(
        {
          name: 'Step 1: Build Post Index',
          script: '01-build-index.ts',
        },
        {
          name: 'Step 2: Generate Embeddings',
          script: '02-generate-embeddings.ts',
        },
        {
          name: 'Step 3: Compute Similarity Matrix',
          script: '03-compute-similarity.ts',
        }
      )
    }
    
    steps.push({
      name: `Step ${skipIndex ? '1' : '4'}: Apply Internal Backlinks`,
      script: '04-apply-backlinks.ts',
      args: dryRun ? ['--dry-run'] : [],
    })
    
    // Run each step sequentially
    for (const step of steps) {
      await runStep(step)
    }
    
    const duration = Math.round((Date.now() - startTime) / 1000)
    
    console.log(`\n${'='.repeat(60)}`)
    console.log('🎉 Pipeline completed successfully!')
    console.log(`⏱️  Total time: ${duration} seconds`)
    console.log(`${'='.repeat(60)}`)
    
    if (dryRun) {
      console.log('\n📝 Note: This was a dry run. No posts were modified.')
      console.log('Run without --dry-run to apply changes.')
    }
    
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error)
    process.exit(1)
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    skipIndex: args.includes('--skip-index'),
    help: args.includes('--help') || args.includes('-h'),
  }
}

// Main execution
const options = parseArgs()

if (options.help) {
  console.log(`
Internal Linking Pipeline Runner

Usage: tsx run-all.ts [options]

Options:
  --dry-run      Run in dry-run mode (preview changes without saving)
  --skip-index   Skip indexing steps (use existing index and embeddings)
  --help, -h     Show this help message

Examples:
  # Full pipeline with changes applied
  tsx run-all.ts
  
  # Preview changes without applying
  tsx run-all.ts --dry-run
  
  # Apply backlinks using existing index
  tsx run-all.ts --skip-index
  
  # Preview using existing index
  tsx run-all.ts --skip-index --dry-run
`)
  process.exit(0)
}

runPipeline(options)