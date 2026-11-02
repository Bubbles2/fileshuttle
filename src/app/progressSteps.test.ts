import { describe, expect, it } from 'vitest';
import { progressSteps } from './progressSteps';

const states = (input: Parameters<typeof progressSteps>[0]) => progressSteps(input).map((step) => step.state);

describe('progressSteps', () => {
  it('follows the load → pick → copy flow', () => {
    expect(states({ hasInventory: false, basketCount: 0, copyDone: false })).toEqual(['current', 'todo', 'todo']);
    expect(states({ hasInventory: true, basketCount: 0, copyDone: false })).toEqual(['done', 'current', 'todo']);
    expect(states({ hasInventory: true, basketCount: 2, copyDone: false })).toEqual(['done', 'done', 'current']);
    expect(states({ hasInventory: true, basketCount: 2, copyDone: true })).toEqual(['done', 'done', 'done']);
  });
});
