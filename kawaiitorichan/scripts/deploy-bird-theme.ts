#!/usr/bin/env tsx
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

async function deployBirdTheme() {
  console.log('🦜 Starting Kawaii Bird Theme Deployment...\n')

  const scriptsDir = path.dirname(new URL(import.meta.url).pathname)

  const scripts = [
    {
      name: 'Homepage Update',
      file: 'update-homepage-bird.ts',
      description: 'Creating bird-themed homepage...',
    },
    {
      name: 'About Page Update',
      file: 'update-about-bird.ts',
      description: 'Updating about page with bird content...',
    },
    {
      name: 'Categories Setup',
      file: 'setup-bird-categories.ts',
      description: 'Setting up bird-related categories...',
    },
  ]

  for (const script of scripts) {
    console.log(`\n📌 ${script.name}`)
    console.log(`   ${script.description}`)

    try {
      const scriptPath = path.join(scriptsDir, script.file)
      const { stdout, stderr } = await execAsync(
        `pnpm tsx ${scriptPath}`,
        { cwd: path.join(scriptsDir, '..') }
      )

      if (stdout) console.log(stdout)
      if (stderr) console.error(stderr)

      console.log(`✅ ${script.name} completed successfully!`)
    } catch (error) {
      console.error(`❌ Failed to run ${script.name}:`, error)
      console.log('⚠️ Continuing with remaining scripts...')
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 Kawaii Bird Theme Deployment Complete!')
  console.log('='.repeat(50))
  console.log('\n📝 Next Steps:')
  console.log('1. Verify the homepage shows bird slideshow')
  console.log('2. Check that categories are bird-themed')
  console.log('3. Review the about page content')
  console.log('4. Test navigation and links')
  console.log('\n🌐 Your bird-themed website is ready!')
}

deployBirdTheme().catch(console.error)