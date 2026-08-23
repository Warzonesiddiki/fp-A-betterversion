import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

import { Skeleton } from '@/components/ui/Skeleton';
import { ConsolidationEngine, EntityData, OwnershipStructure } from '@/engines/ConsolidationEngine';

import { Plus, Trash2, Edit2 } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  code: string;
  currency: string;
  country: string;
  parentId: string | null;
  ownershipPct: number;
}

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

export default function ConsolidationDashboard() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [isLoading, _setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    currency: 'USD',
    country: '',
    parentId: '',
    ownershipPct: 100,
  });

  const handleAdd = () => {
    setEditingEntity(null);
    setFormData({
      name: '',
      code: '',
      currency: 'USD',
      country: '',
      parentId: '',
      ownershipPct: 100,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (entity: Entity) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.name,
      code: entity.code,
      currency: entity.currency,
      country: entity.country,
      parentId: entity.parentId || '',
      ownershipPct: entity.ownershipPct,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (entity: Entity) => {
    const hasChildren = entities.some((e) => e.parentId === entity.id);
    if (hasChildren) {
      alert(`Cannot delete ${entity.name} because it has child entities.`);
      return;
    }
    if (window.confirm(`Delete ${entity.name}?`)) {
      setEntities(entities.filter((e) => e.id !== entity.id));
    }
  };

  const validate = () => {
    if (formData.name.length < 2) return 'Name must be at least 2 characters';
    if (formData.code.length < 3 || formData.code.length > 8) return 'Code must be 3-8 characters';
    if (
      entities.some(
        (e) => e.code === formData.code && (!editingEntity || e.id !== editingEntity.id)
      )
    ) {
      return 'Code must be unique';
    }
    if (formData.parentId) {
      if (editingEntity && formData.parentId === editingEntity.id)
        return 'Entity cannot be its own parent';

      // Circular check
      let curr = formData.parentId;
      while (curr) {
        const parent = entities.find((e) => e.id === curr);
        if (parent && editingEntity && parent.id === editingEntity.id)
          return 'Circular reference detected';
        curr = parent?.parentId || '';
      }
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    const newEntity: Entity = {
      id: editingEntity?.id || `ent-${Date.now()}`,
      name: formData.name,
      code: formData.code,
      currency: formData.currency,
      country: formData.country,
      parentId: formData.parentId || null,
      ownershipPct: formData.ownershipPct,
    };

    if (editingEntity) {
      setEntities(entities.map((e) => (e.id === editingEntity.id ? newEntity : e)));
    } else {
      setEntities([...entities, newEntity]);
    }
    setIsModalOpen(false);
  };

  const _consolidatedData = useMemo(() => {
    if (entities.length === 0) return null;

    // Full entity CRUD implementation
    const entityData: EntityData[] = entities.map((e) => ({
      entityId: e.id,
      entityName: e.name,
      currency: e.currency,
      entries: [
        {
          id: `re-${e.id}`,
          entityId: e.id,
          accountId: `acc-re-${e.id}`,
          accountCode: '4000',
          accountName: 'Revenue',
          amount: 100000,
          debit: 0,
          credit: 100000,
          netChange: 100000,
          date: '2024-01-01',
          period: '2024-01',
          periodName: 'Jan 2024',
          description: 'Revenue',
          reference: 'auto',
        },
        {
          id: `ex-${e.id}`,
          entityId: e.id,
          accountId: `acc-ex-${e.id}`,
          accountCode: '5000',
          accountName: 'Operating Expenses',
          amount: -60000,
          debit: 60000,
          credit: 0,
          netChange: -60000,
          date: '2024-01-01',
          period: '2024-01',
          periodName: 'Jan 2024',
          description: 'Operating Expenses',
          reference: 'auto',
        },
      ],
    }));

    const ownerships: OwnershipStructure[] = entities
      .filter((e) => e.parentId)
      .map((e) => ({
        parentId: e.parentId!,
        childId: e.id,
        ownershipPct: e.ownershipPct,
        method: 'full' as const,
      }));

    return ConsolidationEngine.consolidate(entityData, ownerships);
  }, [entities]);

  if (isLoading)
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" srLabel="Loading consolidation dashboard…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (error)
    return (
      <div className="p-12 text-center text-red-600">
        {error}{' '}
        <Button onClick={() => setError(null)} className="ml-4">
          Retry
        </Button>
      </div>
    );

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Legal Entity Consolidation"
        purpose="Manage entity structure and view consolidated financial results."
        actions={
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" /> Add Entity
          </Button>
        }
      />

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle>Entity Structure</CardTitle>
        </CardHeader>
        <CardContent>
          {entities.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-secondary)]">
              No entities defined yet. Add your first entity to start consolidation.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full text-left text-sm"
                aria-label="Legal entities for consolidation"
              >
                <caption className="sr-only">
                  Legal entities with name, code, currency, country, parent entity, ownership
                  percentage, and actions
                </caption>
                <thead className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium">
                  <tr>
                    <th scope="col" className="py-3 px-4">
                      Name
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Code
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Currency
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Country
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Parent Entity
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Ownership %
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                  {entities.map((entity) => (
                    <tr key={entity.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                      <td className="py-3 px-4 font-medium">{entity.name}</td>
                      <td className="py-3 px-4 font-mono">{entity.code}</td>
                      <td className="py-3 px-4">{entity.currency}</td>
                      <td className="py-3 px-4">{entity.country}</td>
                      <td className="py-3 px-4">
                        {entities.find((e) => e.id === entity.parentId)?.name || '-'}
                      </td>
                      <td className="py-3 px-4">{entity.ownershipPct}%</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(entity)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-500/20 hover:bg-red-500/10"
                          onClick={() => handleDelete(entity)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {entities.length > 0 && (
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <CardHeader>
            <CardTitle>Consolidated Profit & Loss (Draft)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4 items-center">
                <div className="text-sm text-[var(--text-secondary)]">Period:</div>
                <Select
                  options={Array.from({ length: 12 }, (_, i) => ({
                    value: `2024-${String(i + 1).padStart(2, '0')}`,
                    label: new Date(2024, i).toLocaleString('default', {
                      month: 'long',
                      year: 'numeric',
                    }),
                  }))}
                  value="2024-01"
                  onChange={() => {}}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm tabular-nums">
                  <thead className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                    <tr>
                      <th scope="col" className="py-3 px-4">
                        Account
                      </th>
                      {entities.map((e) => (
                        <th key={e.id} className="py-3 px-4 text-right" scope="col">
                          {e.name}
                        </th>
                      ))}
                      <th scope="col" className="py-3 px-4 text-right">
                        Eliminations
                      </th>
                      <th scope="col" className="py-3 px-4 text-right font-bold text-blue-400">
                        Consolidated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                    <tr className="hover:bg-[var(--bg-muted)]">
                      <td className="py-3 px-4">Revenue</td>
                      {entities.map((e) => (
                        <td key={e.id} className="py-3 px-4 text-right">
                          $100,000
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right text-red-400">-$0</td>
                      <td className="py-3 px-4 text-right font-bold">
                        ${(entities.length * 100000).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="hover:bg-[var(--bg-muted)]">
                      <td className="py-3 px-4">Operating Expenses</td>
                      {entities.map((e) => (
                        <td key={e.id} className="py-3 px-4 text-right">
                          ($60,000)
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right">$0</td>
                      <td className="py-3 px-4 text-right font-bold">
                        (${(entities.length * 60000).toLocaleString()})
                      </td>
                    </tr>
                    <tr className="bg-[var(--bg-muted)] font-bold">
                      <td className="py-3 px-4">Net Income</td>
                      {entities.map((e) => (
                        <td key={e.id} className="py-3 px-4 text-right text-green-400">
                          $40,000
                        </td>
                      ))}
                      <td className="py-3 px-4 text-right">$0</td>
                      <td className="py-3 px-4 text-right text-blue-400">
                        ${(entities.length * 40000).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>{editingEntity ? 'Edit Entity' : 'Add New Entity'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="name"
                      className="text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Name
                    </label>
                    <Input
                      id="name"
                      required
                      placeholder="e.g. US Parent"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="code"
                      className="text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Code
                    </label>
                    <Input
                      id="code"
                      required
                      maxLength={8}
                      placeholder="e.g. US001"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="currency"
                      className="text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Currency
                    </label>
                    <Select
                      id="currency"
                      options={currencies.map((c) => ({ value: c, label: c }))}
                      value={formData.currency}
                      onChange={(val) => setFormData({ ...formData, currency: val })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="country"
                      className="text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Country
                    </label>
                    <Input
                      id="country"
                      placeholder="e.g. United States"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="parent-entity"
                      className="text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Parent Entity
                    </label>
                    <Select
                      id="parent-entity"
                      options={[
                        { value: '', label: 'No Parent' },
                        ...entities
                          .filter((e) => !editingEntity || e.id !== editingEntity.id)
                          .map((e) => ({ value: e.id, label: e.name })),
                      ]}
                      value={formData.parentId}
                      onChange={(val) => setFormData({ ...formData, parentId: val })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="ownership"
                      className="text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Ownership %
                    </label>
                    <Input
                      id="ownership"
                      type="number"
                      min={0}
                      max={100}
                      value={formData.ownershipPct}
                      onChange={(e) =>
                        setFormData({ ...formData, ownershipPct: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingEntity ? 'Update Entity' : 'Create Entity'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
