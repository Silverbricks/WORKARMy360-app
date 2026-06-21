import { HttpClient, type HttpClientOptions } from './http';
import { createAuthClient } from './endpoints/auth';

export type WorkArmyClientOptions = HttpClientOptions;

/** Build a typed WorkArmy API client. Apps use this — never raw fetch. */
export function createClient(opts: WorkArmyClientOptions) {
  const http = new HttpClient(opts);
  return {
    http,
    auth: createAuthClient(http),
  };
}

export type WorkArmyClient = ReturnType<typeof createClient>;
