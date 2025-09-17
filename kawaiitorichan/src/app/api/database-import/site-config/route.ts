import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try to load site configuration
    const configPath = path.join(process.cwd(), 'scripts/content-db-migration/site-config.json');

    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return NextResponse.json(configData);
    }

    // Return default configuration if file doesn't exist
    return NextResponse.json({
      sites: {
        '15': {
          name: 'Golf Blog JP',
          description: 'Japanese golf blog content',
          primaryLanguage: 'ja',
          url: 'https://golfblog.jp'
        },
        '17': {
          name: 'Golf Tips EN',
          description: 'English golf tips and tutorials',
          primaryLanguage: 'en',
          url: 'https://golftips.com'
        },
        '18': {
          name: 'Golf Academy',
          description: 'Golf training and education content',
          primaryLanguage: 'en',
          url: 'https://golfacademy.com'
        },
        '19': {
          name: 'Golf Masters',
          description: 'Professional golf content and analysis',
          primaryLanguage: 'ja',
          url: 'https://golfmasters.jp'
        }
      }
    });
  } catch (error) {
    console.error('Error loading site config:', error);
    return NextResponse.json(
      { error: 'Failed to load site configuration' },
      { status: 500 }
    );
  }
}