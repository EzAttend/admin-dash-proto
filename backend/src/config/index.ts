export { ENV, IS_DEV, IS_PROD } from './env';
export { connectDatabase, disconnectDatabase } from './database';
export {
  COLLECTIONS,
  OWNERSHIP_MATRIX,
  ADMIN_OWNED_COLLECTIONS,
  ADMIN_READONLY_COLLECTIONS,
  RELATION_MAP,
  IMPORT_PRECONDITIONS,
  assertAdminOwned,
  isAdminReadonly,
} from './domain';
export type {
  Permission,
  CollectionName,
  AdminOwnedCollection,
  AdminReadonlyCollection,
} from './domain';
