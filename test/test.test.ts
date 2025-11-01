import { $fetch } from '@nuxt/test-utils';
import { describe, it, expect, beforeAll } from 'vitest';
import { setupTest } from './setup';
import { Nuxt } from '@prisma/client';

describe('Test API: POST /api/test', () => {

  beforeAll(async () => {
    await setupTest();
  });

  it('Testing', async () => {
    const response: {message: string, data: Nuxt[] }= await $fetch('/api/nuxt');
    expect(response!.message).toEqual('Data fetched securely');
  });

  it('Testing2', async () => {
    const response: {message: string, data: Nuxt[] }= await $fetch('/api/nuxt');
    expect(response.data.length).toBeGreaterThan(1);
  });
});