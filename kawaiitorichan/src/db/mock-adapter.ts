/**
 * Mock database adapter for build phase
 * Provides all required methods without actual database connections
 */

const emptyResult = {
  docs: [],
  totalDocs: 0,
  totalPages: 0,
  page: 1,
  pagingCounter: 1,
  hasPrevPage: false,
  hasNextPage: false,
  prevPage: null,
  nextPage: null,
  limit: 10,
}

const mockGlobal = {
  id: '1',
  value: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export function createMockAdapter(baseAdapter: any) {
  return {
    ...baseAdapter,
    name: 'mock-postgres',

    // Connection methods
    connect: async () => {
      console.log('Mock adapter: Skipping database connection')
      return Promise.resolve()
    },

    init: async () => {
      console.log('Mock adapter: Skipping database init')
      return Promise.resolve()
    },

    close: async () => {
      console.log('Mock adapter: Skipping database close')
      return Promise.resolve()
    },

    // Transaction methods
    beginTransaction: async () => null,
    commitTransaction: async () => {},
    rollbackTransaction: async () => {},

    // Collection methods
    find: async () => emptyResult,
    findOne: async () => null,
    findByID: async () => null,
    create: async () => ({ id: '1' }),
    updateOne: async () => ({ id: '1' }),
    deleteOne: async () => ({ id: '1' }),
    deleteMany: async () => ({ deletedCount: 0 }),

    // Global methods
    findGlobal: async () => mockGlobal,
    updateGlobal: async () => mockGlobal,
    findGlobalVersions: async () => emptyResult,
    findGlobalByID: async () => mockGlobal,

    // Version methods
    findVersions: async () => emptyResult,
    findVersionByID: async () => null,
    deleteVersions: async () => ({ deletedCount: 0 }),

    // Query methods
    queryDrafts: async () => emptyResult,

    // Migration methods
    migrate: async () => {},
    migrateDown: async () => {},
    migrateFresh: async () => {},
    migrateRefresh: async () => {},
    migrateStatus: async () => ({}),

    // Schema methods
    createCollectionSchema: async () => {},
    createGlobalSchema: async () => {},
    dropDatabase: async () => {},

    // Ensure payload.db exists for build
    payload: {
      db: {
        findGlobal: async () => mockGlobal,
        updateGlobal: async () => mockGlobal,
        find: async () => emptyResult,
        findOne: async () => null,
        findByID: async () => null,
        create: async () => ({ id: '1' }),
        update: async () => ({ id: '1' }),
        delete: async () => ({ id: '1' }),
        queryDrafts: async () => emptyResult,
      }
    }
  }
}