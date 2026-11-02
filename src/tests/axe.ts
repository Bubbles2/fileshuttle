import axe from 'axe-core';
import { expect } from 'vitest';

/** Runs axe-core on a rendered tree. Colour contrast is checked against the tokens by hand, since jsdom cannot render. */
export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}
