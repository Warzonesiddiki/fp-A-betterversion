// =============================================================================
// RBAC Enforcer unit tests
// =============================================================================
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';
import {
  PermissionError,
  Permissions,
  enforce,
  enforceMany,
  getCurrentUser,
  withAudit,
  withRBAC,
} from './rbacEnforcer';

function makeUser(permissions: readonly string[] = []): User {
  return {
    id: 'user-1',
    email: 'controller@acme.test',
    firstName: 'Ada',
    lastName: 'Controller',
    avatarUrl: null,
    role: 'controller',
    departmentId: 'd1',
    departmentName: 'Finance',
    entityId: 'e1',
    status: 'Active',
    lastLoginAt: '2026-01-01T00:00:00.000Z',
    mfaEnabled: true,
    permissions,
  };
}

beforeEach(() => {
  useAuthStore.setState({ user: null });
});

describe('getCurrentUser', () => {
  it('returns null when no user is logged in', () => {
    expect(getCurrentUser()).toBeNull();
  });

  it('returns the current user from authStore', () => {
    const user = makeUser(['budget:create']);
    useAuthStore.setState({ user });
    expect(getCurrentUser()?.id).toBe('user-1');
  });
});

describe('PermissionError', () => {
  it('carries permission, action and user id', () => {
    const err = new PermissionError('budget:create', 'createBudget', 'user-1');
    expect(err.permission).toBe('budget:create');
    expect(err.action).toBe('createBudget');
    expect(err.userId).toBe('user-1');
    expect(err.name).toBe('PermissionError');
    expect(err.message).toContain('budget:create');
    expect(err.message).toContain('user-1');
    expect(err.timestamp).toBeDefined();
  });

  it('omits user suffix when userId is null', () => {
    const err = new PermissionError('budget:create', 'createBudget');
    expect(err.message).toContain('(no user)');
    expect(err.message).not.toContain('(user:');
  });
});

describe('enforce', () => {
  it('invokes the action when the user has the permission', () => {
    useAuthStore.setState({ user: makeUser(['budget:create']) });
    const fn = vi.fn((budget) => budget.id);
    const wrapped = enforce('budget:create', 'createBudget', fn);
    const result = wrapped({ id: 'b1' });
    expect(result).toBe('b1');
    expect(fn).toHaveBeenCalledWith({ id: 'b1' });
  });

  it('throws PermissionError when permission is missing and throwOnDeny=true (default)', () => {
    useAuthStore.setState({ user: makeUser([]) });
    const wrapped = enforce('budget:create', 'createBudget', vi.fn());
    expect(() => wrapped()).toThrow(PermissionError);
  });

  it('grants access when ANY permission in an array matches (any-of)', () => {
    useAuthStore.setState({ user: makeUser(['forecast:run']) });
    const fn = vi.fn(() => 'ok');
    const wrapped = enforce(['forecast:read', 'forecast:run'], 'runForecast', fn);
    expect(wrapped()).toBe('ok');
  });

  it('denies when none of an array of permissions match', () => {
    useAuthStore.setState({ user: makeUser(['forecast:read']) });
    const wrapped = enforce(['budget:update', 'budget:delete'], 'updateBudget', vi.fn());
    expect(() => wrapped()).toThrow(PermissionError);
  });

  it('silently no-ops (returns undefined) when throwOnDeny=false', () => {
    useAuthStore.setState({ user: makeUser([]) });
    const wrapped = enforce('budget:create', 'createBudget', vi.fn(), { throwOnDeny: false });
    expect(wrapped()).toBeUndefined();
  });

  it('denies when no user is logged in', () => {
    const wrapped = enforce('budget:create', 'createBudget', vi.fn());
    expect(() => wrapped()).toThrow(PermissionError);
  });

  it('emits an onCheck audit event for both allow and deny', () => {
    useAuthStore.setState({ user: makeUser(['budget:create']) });
    const onCheck = vi.fn();
    const allow = enforce('budget:create', 'createBudget', vi.fn(), { onCheck });
    allow();
    expect(onCheck).toHaveBeenCalledTimes(1);
    expect(onCheck).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: 'createBudget',
        permission: 'budget:create',
        granted: true,
      })
    );

    useAuthStore.setState({ user: makeUser([]) });
    const deny = enforce('budget:create', 'createBudget', vi.fn(), { onCheck });
    expect(() => deny()).toThrow(PermissionError);
    expect(onCheck).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: 'createBudget', granted: false })
    );
  });

  it('passes the original args through to the wrapped function', () => {
    useAuthStore.setState({ user: makeUser(['budget:update']) });
    const fn = vi.fn((a, b) => a + b);
    const wrapped = enforce('budget:update', 'updateBudget', fn);
    expect(wrapped(2, 3)).toBe(5);
  });
});

describe('enforceMany', () => {
  it('wraps only handlers that have a mapped permission', () => {
    useAuthStore.setState({ user: makeUser(['budget:create']) });
    const wrapped = enforceMany(
      () => undefined,
      () => ({}),
      { createBudget: 'budget:create', deleteBudget: 'budget:delete' },
      {
        createBudget: () => 'created',
        deleteBudget: () => 'deleted',
        passthrough: () => 'plain',
      }
    );
    expect((wrapped as unknown as { createBudget: () => string }).createBudget()).toBe('created');
    expect((wrapped as unknown as { passthrough: () => string }).passthrough()).toBe('plain');
    // deleteBudget is mapped but the user lacks it -> throw
    expect(() => (wrapped as unknown as { deleteBudget: () => string }).deleteBudget()).toThrow(
      PermissionError
    );
  });

  it('passthrough when permission is undefined or handler is not a function', () => {
    const wrapped = enforceMany(
      () => undefined,
      () => ({}),
      {},
      { plain: () => 'x', nonFn: 42 }
    ) as unknown as { plain: () => string; nonFn: number };
    expect(wrapped.plain()).toBe('x');
    expect(wrapped.nonFn).toBe(42);
  });
});

describe('withAudit', () => {
  it('returns an onCheck option wired to the provided logger', () => {
    const logger = vi.fn();
    const opts = withAudit(logger);
    expect(opts.onCheck).toBeDefined();
    opts.onCheck!({ action: 'a', permission: 'p', granted: true, user: null, timestamp: 't' });
    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'a', permission: 'p', granted: true })
    );
  });
});

describe('Permissions constants', () => {
  it('defines canonical permission strings', () => {
    expect(Permissions.BUDGET_CREATE).toBe('budget:create');
    expect(Permissions.PERIOD_CLOSE).toBe('period:close');
    expect(Permissions.AUDIT_EXPORT).toBe('audit:export');
    expect(Permissions.CUBE_WRITE).toBe('cube:write');
  });
});

describe('withRBAC', () => {
  it('wraps write actions declared in the permission map', () => {
    useAuthStore.setState({ user: makeUser(['budget:create']) });
    const creator = () => ({
      value: 0,
      createBudget: () => 'created',
      destroy: () => 'destroyed',
    });
    const wrappedCreator = withRBAC({
      createBudget: 'budget:create',
      destroy: 'budget:delete',
    })(creator as never);
    const state = wrappedCreator(
      () => undefined,
      () => ({}),
      {} as never
    ) as unknown as {
      value: number;
      createBudget: () => string;
      destroy: () => string;
    };
    expect(state.createBudget()).toBe('created');
    expect(() => state.destroy()).toThrow(PermissionError);
    // non-mapped values pass through untouched
    expect(state.value).toBe(0);
  });
});
