import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEntityStore } from './entityStore';
import type { Entity } from '@/types';

// Mock the offline cache utilities
vi.mock('@/utils/offlineCache', () => ({
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheClearStore: vi.fn().mockResolvedValue(0),
  isOnline: vi.fn().mockReturnValue(true),
  markSynced: vi.fn(),
}));

describe('entityStore', () => {
  beforeEach(() => {
    useEntityStore.setState({
      entities: [],
      selectedEntityId: null,
      isLoading: false,
      error: null,
    });
  });

  const createEntity = (overrides: Partial<Entity> = {}): Entity => ({
    id: 'ent-1',
    name: 'Test Entity',
    code: 'TEST',
    currency: 'USD',
    country: 'United States',
    isParent: true,
    parentId: null,
    ...overrides,
  });

  // --- Initial State ---

  it('should have correct initial state', () => {
    const s = useEntityStore.getState();
    expect(s.entities).toEqual([]);
    expect(s.selectedEntityId).toBeNull();
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeNull();
  });

  // --- setEntities ---

  it('should set entities', () => {
    const entities = [
      createEntity(),
      createEntity({ id: 'ent-2', name: 'Entity 2', code: 'ENT2' }),
    ];
    useEntityStore.getState().setEntities(entities);

    expect(useEntityStore.getState().entities).toHaveLength(2);
  });

  // --- addEntity ---

  it('should add an entity with generated id', () => {
    const id = useEntityStore.getState().addEntity({
      name: 'New Entity',
      code: 'NEW',
      currency: 'EUR',
      country: 'Germany',
      isParent: false,
      parentId: 'ent-1',
    });

    expect(id).toMatch(/^ent-\d+$/);
    expect(useEntityStore.getState().entities).toHaveLength(1);
    expect(useEntityStore!.getState().entities[0]!.name).toBe('New Entity');
  });

  // --- updateEntity ---

  it('should update an existing entity', () => {
    useEntityStore.setState({ entities: [createEntity()] });

    useEntityStore.getState().updateEntity('ent-1', { name: 'Updated Name' });

    expect(useEntityStore!.getState().entities[0]!.name).toBe('Updated Name');
  });

  it('should not update if entity not found', () => {
    useEntityStore.setState({ entities: [createEntity()] });

    useEntityStore.getState().updateEntity('nonexistent', { name: 'Updated' });

    expect(useEntityStore!.getState().entities[0]!.name).toBe('Test Entity');
  });

  // --- deleteEntity ---

  it('should delete an entity', () => {
    useEntityStore.setState({ entities: [createEntity()] });

    useEntityStore.getState().deleteEntity('ent-1');

    expect(useEntityStore.getState().entities).toHaveLength(0);
  });

  it('should delete entity and its descendants', () => {
    const entities = [
      createEntity({ id: 'ent-parent', isParent: true, parentId: null }),
      createEntity({ id: 'ent-child1', isParent: false, parentId: 'ent-parent' }),
      createEntity({ id: 'ent-child2', isParent: false, parentId: 'ent-parent' }),
      createEntity({ id: 'ent-grandchild', isParent: false, parentId: 'ent-child1' }),
    ];
    useEntityStore.setState({ entities, selectedEntityId: 'ent-grandchild' });

    useEntityStore.getState().deleteEntity('ent-parent');

    expect(useEntityStore.getState().entities).toHaveLength(0);
    expect(useEntityStore.getState().selectedEntityId).toBeNull();
  });

  it('should clear selectedEntityId if deleted entity was selected', () => {
    useEntityStore.setState({
      entities: [createEntity()],
      selectedEntityId: 'ent-1',
    });

    useEntityStore.getState().deleteEntity('ent-1');

    expect(useEntityStore.getState().selectedEntityId).toBeNull();
  });

  // --- setSelectedEntity / getSelectedEntity ---

  it('should set selected entity', () => {
    useEntityStore.setState({ entities: [createEntity()] });

    useEntityStore.getState().setSelectedEntity('ent-1');

    expect(useEntityStore.getState().selectedEntityId).toBe('ent-1');
  });

  it('should get selected entity', () => {
    useEntityStore.setState({
      entities: [createEntity()],
      selectedEntityId: 'ent-1',
    });

    const selected = useEntityStore.getState().getSelectedEntity();

    expect(selected).not.toBeNull();
    expect(selected?.id).toBe('ent-1');
  });

  it('should return null when no entity is selected', () => {
    useEntityStore.setState({ entities: [createEntity()], selectedEntityId: null });

    const selected = useEntityStore.getState().getSelectedEntity();

    expect(selected).toBeNull();
  });

  it('should return null when selected entity does not exist', () => {
    useEntityStore.setState({ entities: [], selectedEntityId: 'nonexistent' });

    const selected = useEntityStore.getState().getSelectedEntity();

    expect(selected).toBeNull();
  });

  // --- getChildEntities ---

  it('should return child entities', () => {
    const entities = [
      createEntity({ id: 'ent-parent', parentId: null }),
      createEntity({ id: 'ent-child1', parentId: 'ent-parent' }),
      createEntity({ id: 'ent-child2', parentId: 'ent-parent' }),
      createEntity({ id: 'ent-other', parentId: null }),
    ];
    useEntityStore.setState({ entities });

    const children = useEntityStore.getState().getChildEntities('ent-parent');

    expect(children).toHaveLength(2);
    expect(children.map((c) => c.id)).toContain('ent-child1');
    expect(children.map((c) => c.id)).toContain('ent-child2');
  });

  it('should return empty array when no children', () => {
    useEntityStore.setState({ entities: [createEntity()] });

    const children = useEntityStore.getState().getChildEntities('ent-1');

    expect(children).toEqual([]);
  });

  // --- getParentEntity ---

  it('should return parent entity', () => {
    const entities = [
      createEntity({ id: 'ent-parent', parentId: null }),
      createEntity({ id: 'ent-child', parentId: 'ent-parent' }),
    ];
    useEntityStore.setState({ entities });

    const parent = useEntityStore.getState().getParentEntity('ent-child');

    expect(parent).not.toBeNull();
    expect(parent?.id).toBe('ent-parent');
  });

  it('should return null for root entity', () => {
    useEntityStore.setState({ entities: [createEntity({ parentId: null })] });

    const parent = useEntityStore.getState().getParentEntity('ent-1');

    expect(parent).toBeNull();
  });

  // --- getEntityTree ---

  it('should return full entity tree from root', () => {
    const entities = [
      createEntity({ id: 'ent-root', parentId: null }),
      createEntity({ id: 'ent-child1', parentId: 'ent-root' }),
      createEntity({ id: 'ent-child2', parentId: 'ent-root' }),
      createEntity({ id: 'ent-grandchild', parentId: 'ent-child1' }),
    ];
    useEntityStore.setState({ entities });

    const tree = useEntityStore.getState().getEntityTree();

    expect(tree).toHaveLength(4);
    // Root should be first
    expect(tree![0]!.id).toBe('ent-root');
  });

  it('should return subtree from specified root', () => {
    const entities = [
      createEntity({ id: 'ent-root', parentId: null }),
      createEntity({ id: 'ent-child1', parentId: 'ent-root' }),
      createEntity({ id: 'ent-grandchild', parentId: 'ent-child1' }),
      createEntity({ id: 'ent-other', parentId: null }),
    ];
    useEntityStore.setState({ entities });

    const subtree = useEntityStore.getState().getEntityTree('ent-child1');

    expect(subtree).toHaveLength(2);
    expect(subtree![0]!.id).toBe('ent-child1');
    expect(subtree![1]!.id).toBe('ent-grandchild');
  });

  // --- Offline cache ---

  it('should sync to cache', async () => {
    const { cacheSet, cacheClearStore, markSynced } = await import('@/utils/offlineCache');
    const entities = [createEntity()];
    useEntityStore.setState({ entities });

    await useEntityStore.getState().syncToCache();

    expect(cacheClearStore).toHaveBeenCalledWith('entities');
    expect(cacheSet).toHaveBeenCalledWith('entities', 'all', entities);
    expect(markSynced).toHaveBeenCalled();
  });

  it('should load from cache', async () => {
    const { cacheGet } = await import('@/utils/offlineCache');
    const cachedEntities = [createEntity({ id: 'ent-cached' })];
    (cacheGet as ReturnType<typeof vi.fn>).mockResolvedValue(cachedEntities);

    const result = await useEntityStore.getState().loadFromCache();

    expect(result).toBe(true);
    expect(useEntityStore.getState().entities).toEqual(cachedEntities);
  });

  it('should return false when cache is empty', async () => {
    const { cacheGet } = await import('@/utils/offlineCache');
    (cacheGet as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await useEntityStore.getState().loadFromCache();

    expect(result).toBe(false);
  });

  it('should clear cache', async () => {
    const { cacheClearStore } = await import('@/utils/offlineCache');

    await useEntityStore.getState().clearCache();

    expect(cacheClearStore).toHaveBeenCalledWith('entities');
  });

  // --- State management ---

  it('should set error', () => {
    useEntityStore.getState().setError('Something went wrong');
    expect(useEntityStore.getState().error).toBe('Something went wrong');
  });

  it('should clear error', () => {
    useEntityStore.setState({ error: 'Error' });
    useEntityStore.getState().clearError();
    expect(useEntityStore.getState().error).toBeNull();
  });

  it('should set loading state', () => {
    useEntityStore.getState().setLoading(true);
    expect(useEntityStore.getState().isLoading).toBe(true);

    useEntityStore.getState().setLoading(false);
    expect(useEntityStore.getState().isLoading).toBe(false);
  });
});
