import '@testing-library/jest-dom';
import { vi } from 'vitest';

// JSDOM does not implement HTMLMediaElement.prototype.play and pause
if (typeof window !== 'undefined') {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
}
