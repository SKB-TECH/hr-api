import { AsyncLocalStorage } from 'async_hooks';

export const langStore = new AsyncLocalStorage<string>();
