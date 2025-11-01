import { $fetch } from '@nuxt/test-utils';
import { describe, it, expect, beforeAll } from 'vitest';
import { setupTest } from './setup';

describe('Test API: POST /api/test', () => {

  beforeAll(async () => {
    await setupTest();
  });

  it('Testing', async () => {
    const response = await $fetch('/api/test');
    expect(response).toEqual({ message: 'Data fetched securely' });
  });
});