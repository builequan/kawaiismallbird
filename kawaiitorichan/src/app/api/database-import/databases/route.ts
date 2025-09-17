import { NextResponse } from 'next/server';
import { listDatabaseProfiles } from '../../../../../scripts/content-db-migration/multi-database-connection';

export async function GET() {
  try {
    const profiles = listDatabaseProfiles();
    return NextResponse.json({ profiles });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load database profiles' },
      { status: 500 }
    );
  }
}