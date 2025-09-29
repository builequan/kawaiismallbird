import * as migration_20250920_032655 from './20250920_032655';
import * as migration_20250930_insert_categories from './20250930_insert_categories';

export const migrations = [
  {
    up: migration_20250920_032655.up,
    down: migration_20250920_032655.down,
    name: '20250920_032655'
  },
  {
    up: migration_20250930_insert_categories.up,
    down: migration_20250930_insert_categories.down,
    name: '20250930_insert_categories'
  },
];
