import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PageHeader } from '@/components/ui/PageHeader';

import { useNavigate } from 'react-router-dom';
import { useDataStore } from '@/store/dataStore';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { parseCSV } from '@/utils/csv';
import {
  getDescendantAccountIds,
  getNormalBalance,
  normalizeAccountType,
  rowValue,
  validateChartAccountDraft,
} from '@/domain/chartOfAccounts';

import type { AccountType, GLAccount } from '@/types';

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  FolderTree,
  List,
} from 'lucide-react';

const accountTypes = [
  { value: 'Revenue', label: 'Revenue' },
  { value: 'COGS', label: 'COGS' },
  { value: 'OpEx', label: 'OpEx' },
  { value: 'CapEx', label: 'CapEx' },
  { value: 'Asset', label: 'Asset' },
  { value: 'Liability', label: 'Liability' },
  { value: 'Equity', label: 'Equity' },
];

const accountRanges = [
  { label: '1000-1999', desc: 'Assets' },
  { label: '2000-2999', desc: 'Liabilities' },
  { label: '3000-3999', desc: 'Equity' },
  { label: '4000-4999', desc: 'Revenue' },
  { label: '5000-5999', desc: 'COGS' },
  { label: '6000-6999', desc: 'Expenses' },
];

export default function ChartOfAccountsPage() {
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Chart Of Accounts';
  }, []);

  const { accounts, addAccount, updateAccount, deleteAccount, toggleAccountActive } = useDataStore(
    useShallow((s) => ({
      accounts: s.accounts,
      addAccount: s.addAccount,
      updateAccount: s.updateAccount,
      deleteAccount: s.deleteAccount,
      toggleAccountActive: s.toggleAccountActive,
    }))
  );
  const entries = useGLStore((s) => s.entries); // to check usage for soft-delete warning
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'flat' | 'tree'>('flat');
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'Revenue' as AccountType,
    category: '',
    subCategory: '',
    parentId: null as string | null,
    isActive: true,
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setForm({
      code: '',
      name: '',
      type: 'Revenue',
      category: '',
      subCategory: '',
      parentId: null,
      isActive: true,
    });
    setEditingId(null);
  }, []);

  const formErrors = useMemo(
    () => validateChartAccountDraft(form, accounts, editingId).errors,
    [form, accounts, editingId]
  );

  const filteredAccounts = useMemo(() => {
    // Never mutate the store's (frozen, immer-managed) array in place — copy
    // before filtering/sorting so re-renders cannot throw on a frozen entry.
    let list = [...accounts];
    if (filterType !== 'all') list = list.filter((a) => a.type === filterType);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts, filterType, search]);

  const parentOptions = useMemo(() => {
    const blockedIds = editingId ? getDescendantAccountIds(accounts, editingId) : new Set<string>();
    if (editingId) blockedIds.add(editingId);
    return [
      { value: '', label: 'None (Top Level)' },
      ...accounts
        .filter((a) => a.level < 3 && !blockedIds.has(a.id))
        .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` })),
    ];
  }, [accounts, editingId]);

  const handleSubmit = useCallback(() => {
    if (Object.keys(formErrors).length > 0) return;
    if (editingId) {
      updateAccount(editingId, {
        code: form.code.toUpperCase(),
        name: form.name,
        type: form.type,
        category: form.category || '-',
        subCategory: form.subCategory,
        parentId: form.parentId,
        isActive: form.isActive,
      });
    } else {
      addAccount({
        code: form.code.toUpperCase(),
        name: form.name,
        type: form.type,
        category: form.category || '-',
        subCategory: form.subCategory,
        parentId: form.parentId,
        level: 0,
        sortOrder: 0,
        isActive: form.isActive,
        entityId: 'default',
        departmentId: null,
        isCalculated: false,
        formula: null,
      });
    }
    setShowModal(false);
    resetForm();
  }, [form, formErrors, editingId, addAccount, updateAccount, resetForm]);

  const handleEdit = useCallback((acct: (typeof accounts)[number]) => {
    setEditingId(acct.id);
    setForm({
      code: acct.code,
      name: acct.name,
      type: acct.type,
      category: acct.category,
      subCategory: acct.subCategory,
      parentId: acct.parentId,
      isActive: acct.isActive,
    });
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      // B1 Enhancement: soft-delete warning based on GL usage
      const hasGL = entries.some((e) => e.accountCode === accounts.find((a) => a.id === id)?.code);
      if (hasGL) {
        if (!confirm('This account has GL entries. Deactivate instead of delete? (recommended)')) {
          deleteAccount(id);
        } else {
          toggleAccountActive(id);
        }
      } else {
        deleteAccount(id);
      }
      setDeleteConfirmId(null);
    },
    [deleteAccount, entries, accounts, toggleAccountActive]
  );

  const handleToggle = useCallback(
    (id: string, _current: boolean) => {
      toggleAccountActive(id);
    },
    [toggleAccountActive]
  );

  // B1 Enhancement: CSV Import for Chart of Accounts
  const handleCSVImport = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const { headers, rows } = parseCSV(text);
        if (headers.length === 0 || rows.length === 0) return;

        const newAccounts: GLAccount[] = [];
        let skippedRows = 0;
        const importedCodes = new Set(accounts.map((a) => a.code.toUpperCase()));

        rows.forEach((row, idx) => {
          const code = rowValue(row, headers, 'code', 0).trim().toUpperCase();
          const name = rowValue(row, headers, 'name', 1).trim();
          const type = normalizeAccountType(rowValue(row, headers, 'type', -1)) ?? 'OpEx';
          const validation = validateChartAccountDraft({ code, name, type }, [
            ...accounts,
            ...newAccounts,
          ]);

          if (!validation.valid || importedCodes.has(code)) {
            skippedRows++;
            return;
          }

          importedCodes.add(code);
          newAccounts.push({
            id: `acct-csv-${Date.now()}-${idx}`,
            code,
            name,
            type,
            category: rowValue(row, headers, 'category', -1) || '-',
            subCategory: rowValue(row, headers, 'subcategory', -1) || '',
            parentId: null,
            level: 0,
            sortOrder: accounts.length + newAccounts.length,
            isActive: true,
            entityId: 'default',
            departmentId: null,
            isCalculated: false,
            formula: null,
            children: [],
          });
        });

        if (newAccounts.length > 0) {
          // Use dataStore if available, otherwise fall back
          newAccounts.forEach((acc) => addAccount(acc));
          alert(
            `Imported ${newAccounts.length} new accounts from CSV${skippedRows ? ` (${skippedRows} skipped)` : ''}`
          );
        }
      } catch (e) {
        alert('Failed to import CSV: ' + (e as Error).message);
      }
    },
    [accounts, addAccount]
  );

  // B1 Enhancement: Export CSV
  const exportCSV = useCallback(() => {
    const header = 'code,name,type,category,subCategory,parentId,isActive\n';
    const rows = accounts
      .map((a) =>
        [
          a.code,
          `"${a.name}"`,
          a.type,
          a.category || '',
          a.subCategory || '',
          a.parentId || '',
          a.isActive,
        ].join(',')
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chart-of-accounts.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [accounts]);

  if (accounts.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-2">No Accounts Defined</h2>
        <p className="text-[var(--text-muted)] mb-6">
          The Chart of Accounts is the foundation of financial reporting. Define your accounts
          manually, or import from a CSV file.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Account
          </Button>
          <Button variant="secondary" onClick={() => navigate('/data')}>
            Import from CSV
          </Button>
        </div>
        <div className="mt-8 p-4 bg-slate-900 rounded-lg border border-slate-800">
          <p className="text-xs font-semibold text-slate-400 mb-2">Common Account Ranges</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-[var(--text-muted)]">
            {accountRanges.map((r) => (
              <div key={r.label}>
                <span className="font-mono text-slate-400">{r.label}</span>
                <span className="ml-1">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            title="Chart of Accounts"
            actions={
              <button
                onClick={() => setHelpOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
                aria-label="Help"
              ></button>
            }
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {accounts.length} accounts defined
            {filterType !== 'all' && ` · ${filteredAccounts.length} filtered`}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'flat' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <List className="h-3.5 w-3.5 inline mr-1" />
              Flat
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'tree' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <FolderTree className="h-3.5 w-3.5 inline mr-1" />
              Tree
            </button>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
          <Button variant="secondary" onClick={exportCSV}>
            Export CSV
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCSVImport(f);
                e.target.value = '';
              }}
            />
            <span className="inline-flex items-center px-3 py-1.5 rounded bg-slate-800 text-xs font-medium hover:bg-slate-700">
              Import CSV
            </span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
          <input
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => startTransition(() => setSearch(e.target.value))}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['all', 'Revenue', 'COGS', 'OpEx', 'CapEx', 'Asset', 'Liability', 'Equity'].map((t) => (
            <button
              key={t}
              onClick={() => startTransition(() => setFilterType(t))}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${filterType === t ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--text-muted)] ml-auto">
          {filteredAccounts.length} accounts
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Chart of accounts hierarchy">
              <caption className="sr-only">
                Detailed breakdown of chart of accounts hierarchy
              </caption>
              <thead>
                <tr className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-slate-800">
                  <th scope="col" className="px-4 py-3 w-24">
                    Code
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 w-20">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3 w-28">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3 text-right w-28">
                    Normal Balance
                  </th>
                  <th scope="col" className="px-4 py-3 w-20">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 w-28 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-800 ${isPending ? 'opacity-60' : ''}`}>
                {filteredAccounts.map((acct) => (
                  <tr
                    key={acct.id}
                    className={`hover:bg-slate-900/50 transition-colors ${!acct.isActive ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-300">
                      {acct.code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {acct.level > 0 && (
                          <span className="text-slate-600 text-xs mr-1">
                            {'└'.padEnd(acct.level * 2, '─')}
                          </span>
                        )}
                        {acct.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default" className="text-[10px]">
                        {acct.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{acct.category}</td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-[var(--text-muted)]">
                      {getNormalBalance(acct.type)}
                    </td>
                    <td className="px-4 py-3">
                      {acct.isActive ? (
                        <Badge variant="default" className="text-[10px]">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => handleEdit(acct)}
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          title="Edit account"
                          aria-label="Edit account"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggle(acct.id, acct.isActive)}
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          title={acct.isActive ? 'Deactivate' : 'Activate'}
                          aria-label={acct.isActive ? 'Deactivate account' : 'Activate account'}
                        >
                          {acct.isActive ? (
                            <ToggleRight className="h-3.5 w-3.5" />
                          ) : (
                            <ToggleLeft className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(acct.id)}
                          className="p-1.5 rounded hover:bg-red-700/30 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete account"
                          aria-label="Delete account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredAccounts.length === 0 && (
            <div
              className="text-center py-8 text-[var(--text-muted)] text-sm"
              role="status"
              aria-live="polite"
            >
              No accounts match your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Account' : 'Add Account'}
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="account-code"
                className="block text-xs font-medium text-[var(--text-muted)] mb-1"
              >
                Account Code
              </label>
              <Input
                id="account-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. 4100"
                className={formErrors.code ? 'border-red-500' : ''}
              />
              {formErrors.code && <p className="text-xs text-red-400 mt-1">{formErrors.code}</p>}
            </div>
            <div>
              <label
                htmlFor="account-name"
                className="block text-xs font-medium text-[var(--text-muted)] mb-1"
              >
                Account Name
              </label>
              <Input
                id="account-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Subscription Revenue"
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label
                htmlFor="account-type"
                className="block text-xs font-medium text-[var(--text-muted)] mb-1"
              >
                Account Type
              </label>
              <Select
                id="account-type"
                options={accountTypes}
                value={form.type}
                onChange={(val) => setForm({ ...form, type: val as AccountType })}
              />
            </div>
            <div>
              <label
                htmlFor="category"
                className="block text-xs font-medium text-[var(--text-muted)] mb-1"
              >
                Category
              </label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Operating Revenue"
              />
            </div>
            <div>
              <label
                htmlFor="parent-account-optional"
                className="block text-xs font-medium text-[var(--text-muted)] mb-1"
              >
                Parent Account (optional)
              </label>
              <Select
                id="parent-account-optional"
                options={parentOptions}
                value={form.parentId || ''}
                onChange={(val) => setForm({ ...form, parentId: val || null })}
              />
              {formErrors.parentId && (
                <p className="text-xs text-red-400 mt-1">{formErrors.parentId}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={Object.keys(formErrors).length > 0}>
              {editingId ? 'Save Changes' : 'Add Account'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Delete Account</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Are you sure you want to delete this account? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
