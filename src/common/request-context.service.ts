import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextStore {
  userId?: string;
  username?: string;
  roles?: string[];
}

@Injectable()
export class RequestContextService {
  private readonly als = new AsyncLocalStorage<RequestContextStore>();

  run(callback: () => void) {
    this.als.run({}, callback);
  }

  setUser(userId?: string, username?: string, roles?: string[]) {
    const store = this.als.getStore();
    if (store) {
      store.userId = userId;
      store.username = username;
      store.roles = roles;
    }
  }

  getUserId(): string | undefined {
    return this.als.getStore()?.userId;
  }

  getUsername(): string | undefined {
    return this.als.getStore()?.username;
  }

  getRoles(): string[] | undefined {
    return this.als.getStore()?.roles;
  }
}
