import { NextRequest, NextResponse } from 'next/server';
import { testDatabaseConnection } from '../../../../../scripts/content-db-migration/multi-database-connection';

export async function POST(request: NextRequest) {
  try {
    const { database } = await request.json();

    if (!database) {
      return NextResponse.json(
        { error: 'Database name is required' },
        { status: 400 }
      );
    }

    const result = await testDatabaseConnection(database);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to test connection' },
      { status: 500 }
    );
  }
}