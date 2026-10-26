import { afterEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { loadSecurityMode, saveSecurityMode, securityMode } from './security-mode';

afterEach(() => { localStorage.clear(); securityMode.set('secure'); });
describe('local security preference', () => {
  it('starts secure and restores an explicitly saved preference after refresh', () => {
    expect(get(securityMode)).toBe('secure');
    saveSecurityMode('vulnerable');
    expect(get(securityMode)).toBe('vulnerable');
    securityMode.set('secure');
    loadSecurityMode();
    expect(get(securityMode)).toBe('vulnerable');
    saveSecurityMode('secure');
    loadSecurityMode();
    expect(get(securityMode)).toBe('secure');
  });
  it('fails safely to secure for invalid or missing stored values', () => {
    localStorage.setItem('careprobe-security-mode', 'other');
    securityMode.set('vulnerable');
    loadSecurityMode();
    expect(get(securityMode)).toBe('secure');
    localStorage.clear();
    loadSecurityMode();
    expect(get(securityMode)).toBe('secure');
  });
});
