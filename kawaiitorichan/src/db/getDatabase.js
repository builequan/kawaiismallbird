"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseAdapter = getDatabaseAdapter;
const db_postgres_1 = require("@payloadcms/db-postgres");
const mock_adapter_1 = require("./mock-adapter");
/**
 * Get database configuration dynamically at runtime
 * This ensures Docker deployments can override DATABASE_URI properly
 */
function getDatabaseAdapter() {
    // During build phase, use a dummy adapter that won't try to connect
    const isBuildPhase = process.env.NODE_ENV === 'production' &&
        (process.env.SKIP_DB_PUSH === 'true' ||
            process.env.SKIP_BUILD_STATIC_GENERATION === 'true' ||
            process.argv.includes('build'));
    // Get DATABASE_URI at runtime, not build time
    const connectionString = process.env.DATABASE_URI;
    if (isBuildPhase) {
        console.log('Build phase detected - using mock database configuration');
        // Create base adapter
        const baseAdapter = (0, db_postgres_1.postgresAdapter)({
            pool: {
                connectionString: 'postgresql://noconnect:noconnect@noconnect:5432/noconnect',
                max: 0,
                min: 0,
            },
            push: false,
        });
        // Use comprehensive mock adapter
        return (0, mock_adapter_1.createMockAdapter)(baseAdapter);
    }
    if (!connectionString) {
        console.error('DATABASE_URI is not set!');
        // Don't throw error immediately, use a dummy connection
        console.error('WARNING: Using dummy database connection - app may not work fully');
        return (0, db_postgres_1.postgresAdapter)({
            pool: {
                connectionString: 'postgres://dummy:dummy@dummy-db-host:5432/dummy',
            },
        });
    }
    console.log('Database connection configured:', connectionString.replace(/:[^@]+@/, ':****@'));
    return (0, db_postgres_1.postgresAdapter)({
        pool: {
            connectionString,
        },
    });
}
