import { describe, it, expect } from 'vitest';
import { PUBLIC_PAGES } from '../publicPages';

describe('PUBLIC_PAGES', () => {
  it('should include core public pages', () => {
    expect(PUBLIC_PAGES).toContain('Home');
    expect(PUBLIC_PAGES).toContain('Pricing');
    expect(PUBLIC_PAGES).toContain('Privacy');
    expect(PUBLIC_PAGES).toContain('Help');
  });

  it('should include payment result pages', () => {
    expect(PUBLIC_PAGES).toContain('PaymentSuccess');
    expect(PUBLIC_PAGES).toContain('PaymentCancel');
  });

  it('should include onboarding pages', () => {
    expect(PUBLIC_PAGES).toContain('JoinFamily');
    expect(PUBLIC_PAGES).toContain('RoleSelection');
  });

  it('should NOT include authenticated pages', () => {
    expect(PUBLIC_PAGES).not.toContain('Dashboard');
    expect(PUBLIC_PAGES).not.toContain('Chores');
    expect(PUBLIC_PAGES).not.toContain('Admin');
    expect(PUBLIC_PAGES).not.toContain('Account');
    expect(PUBLIC_PAGES).not.toContain('People');
  });

  it('should not contain duplicates', () => {
    const unique = [...new Set(PUBLIC_PAGES)];
    expect(PUBLIC_PAGES).toHaveLength(unique.length);
  });
});
