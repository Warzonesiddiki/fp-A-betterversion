/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Entity } from '../types';
import { masterStorage } from '../utils/masterStorage';
import { cacheSet, cacheGet, cacheClearStore, isOnline, markSynced } from '../utils/offlineCache';
import { enforce, Permissions } from '../utils/rbacEnforcer';

// =============================================================================
// ENTITY STORE — Multi-entity management with offline caching
// =============================================================================

interface EntityState {
  entities: Entity[];
  selectedEntityId: string | null;
  isLoading: boolean;
  error: string | null;

  // CRUD
  setEntities: (entities: Entity[]) => void;
  addEntity: (entity: Omit<Entity, 'id'>) => string;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;

  // Selection
  setSelectedEntity: (id: string | null) => void;
  getSelectedEntity: () => Entity | null;

  // Hierarchy
  getChildEntities: (parentId: string) => Entity[];
  getParentEntity: (childId: string) => Entity | null;
  getEntityTree: (rootId?: string) => Entity[];

  // Offline cache
  syncToCache: () => Promise<void>;
  loadFromCache: () => Promise<boolean>;
  clearCache: () => Promise<void>;

  // State
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useEntityStore = create<EntityState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        entities: [],
        selectedEntityId: null,
        isLoading: false,
        error: null,

        // --- CRUD ---

        setEntities: enforce(Permissions.ENTITY_UPDATE, 'setEntities', (entities) => {
          set((state) => {
            state.entities = entities;
          });
        }),

        addEntity: enforce(Permissions.ENTITY_CREATE, 'addEntity', (entity) => {
          const newId = `ent-${Date.now()}`;
          const newEntity: Entity = {
            ...entity,
            id: newId,
          } as Entity;
          set((state) => {
            state.entities.push(newEntity);
          });
          return newId;
        }),

        updateEntity: enforce(Permissions.ENTITY_UPDATE, 'updateEntity', (id, updates) => {
          set((state) => {
            const idx = state.entities.findIndex((e) => e.id === id);
            if (idx !== -1) {
              Object.assign(state.entities[idx]!, updates);
            }
          });
        }),

        deleteEntity: enforce(Permissions.ENTITY_DELETE, 'deleteEntity', (id) => {
          set((state) => {
            // Remove the entity and all its descendants
            const idsToRemove = new Set<string>();
            const collectDescendants = (parentId: string) => {
              idsToRemove.add(parentId);
              state.entities
                .filter((e) => e.parentId === parentId)
                .forEach((child) => collectDescendants(child.id));
            };
            collectDescendants(id);

            state.entities = state.entities.filter((e) => !idsToRemove.has(e.id));
            if (state.selectedEntityId && idsToRemove.has(state.selectedEntityId)) {
              state.selectedEntityId = null;
            }
          });
        }),

        // --- Selection ---

        setSelectedEntity: enforce(Permissions.UI_UPDATE, 'setSelectedEntity', (id) => {
          set((state) => {
            state.selectedEntityId = id;
          });
        }),

        getSelectedEntity: () => {
          const { entities, selectedEntityId } = get();
          return entities.find((e) => e.id === selectedEntityId) ?? null;
        },

        // --- Hierarchy ---

        getChildEntities: (parentId) => {
          return get().entities.filter((e) => e.parentId === parentId);
        },

        getParentEntity: (childId) => {
          const child = get().entities.find((e) => e.id === childId);
          if (!child?.parentId) return null;
          return get().entities.find((e) => e.id === child.parentId) ?? null;
        },

        getEntityTree: (rootId) => {
          const { entities } = get();
          const result: Entity[] = [];

          // Find root: either specified or top-level (parentId === null)
          const roots = rootId
            ? entities.filter((e) => e.id === rootId)
            : entities.filter((e) => e.parentId === null);

          const traverse = (parentId: string) => {
            const children = entities.filter((e) => e.parentId === parentId);
            for (const child of children) {
              result.push(child);
              traverse(child.id);
            }
          };

          for (const root of roots) {
            result.push(root);
            traverse(root.id);
          }

          return result;
        },

        // --- Offline Cache ---

        syncToCache: enforce(Permissions.ENTITY_UPDATE, 'syncToCache', async () => {
          const { entities } = get();
          try {
            await cacheClearStore('entities');
            await cacheSet('entities', 'all', entities);
            markSynced();
          } catch {
            // Cache sync is best-effort
          }
        }),

        loadFromCache: enforce(Permissions.ENTITY_READ, 'loadFromCache', async () => {
          try {
            const cached = await cacheGet<Entity[]>('entities', 'all');
            if (cached && cached.length > 0) {
              set((state) => {
                state.entities = cached;
              });
              return true;
            }
            return false;
          } catch {
            return false;
          }
        }),

        clearCache: enforce(Permissions.ENTITY_DELETE, 'clearCache', async () => {
          try {
            await cacheClearStore('entities');
          } catch {
            // Cache clear is best-effort
          }
        }),

        // --- State ---

        setError: (error) => {
          set((state) => {
            state.error = error;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },
      })),
      {
        name: 'entity-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
