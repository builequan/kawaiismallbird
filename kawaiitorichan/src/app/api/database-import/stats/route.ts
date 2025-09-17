import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseStats } from '../../../../../scripts/content-db-migration/multi-database-connection';

export async function POST(request: NextRequest) {
  try {
    const { database } = await request.json();

    if (!database) {
      return NextResponse.json(
        { error: 'Database name is required' },
        { status: 400 }
      );
    }

    const stats = await getDatabaseStats(database);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load database statistics' },
      { status: 500 }
    );
  }
}