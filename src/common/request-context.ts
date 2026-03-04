import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextStore {
  userId?: string;
  username?: string;
  roles?: string[];
}

const als = new AsyncLocalStorage<RequestContextStore>();

export function runWithContext<T>(fn: () => T): T {
  return als.run({}, fn) as unknown as T;
}

export function setUserInContext(userId?: string, username?: string, roles?: string[]) {
  const store = als.getStore();
  if (store) {
    store.userId = userId;
    store.username = username;
    store.roles = roles;
  }
}

export function getUserIdFromContext(): string | undefined {
  return als.getStore()?.userId;
}

export function getUsernameFromContext(): string | undefined {
  return als.getStore()?.username;
}

export function getRolesFromContext(): string[] | undefined {
  return als.getStore()?.roles;
}
