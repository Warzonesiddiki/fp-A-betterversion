import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Search } from 'lucide-react';

export default function ApiReferencePage() {
  const [searchTerm, setSearchTerm] = useState('');

  const apis = [
    {
      group: 'Core Engines',
      items: [
        {
          name: 'FormulaEngine',
          desc: 'Parses and evaluates mathematical and financial formulas.',
          methods: [
            'evaluate(formula, context)',
            'parseFormula(formula)',
            'getDependencies(formula)',
          ],
        },
        {
          name: 'ConsolidationEngine',
          desc: 'Rolls up entity data using ownership percentages and IC elimination rules.',
          methods: ['consolidate(entities, ownerships)'],
        },
        {
          name: 'MonteCarloEngine',
          desc: 'Runs probabilistic simulations for scenario forecasting.',
          methods: ['run(assumptions, iterations)'],
        },
        {
          name: 'PivotTableEngine',
          desc: 'Slices and aggregates flat GL entries into pivot cubes.',
          methods: ['createPivot(data, config)'],
        },
      ],
    },
    {
      group: 'Storage & Stores',
      items: [
        {
          name: 'masterStorage',
          desc: 'AES-256-GCM encrypted persistence layer mapping to IndexedDB.',
          methods: ['get(key)', 'set(key, value)', 'remove(key)'],
        },
        {
          name: 'useGLStore',
          desc: 'Zustand store managing the core General Ledger immutable entries.',
          methods: ['addEntry(entry)', 'reconcile(id, matches)'],
        },
        {
          name: 'useBudgetStore',
          desc: 'Zustand store managing planning matrices and line items.',
          methods: ['createBudget(budget)', 'updateLineItem(id)'],
        },
      ],
    },
    {
      group: 'Enterprise Plugins',
      items: [
        {
          name: 'PluginEngine',
          desc: 'Manages the sandbox lifecycle for external connectors.',
          methods: ['loadPlugin(manifest)', 'executeHook(name, context)'],
        },
        {
          name: 'AuditTrailEngine',
          desc: 'Produces immutable, cryptographically verifiable SOX audit logs.',
          methods: ['log(action, payload)', 'verifyIntegrity(hash)'],
        },
      ],
    },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          API Reference & SDK
        </h1>
        <p className="text-[var(--text-secondary)] mt-2 text-lg">
          Developer documentation for FinPlan Pro's internal engines, stores, and plugin
          architecture.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search endpoints, engines, or stores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
        />
      </div>

      <div className="space-y-8">
        {apis.map((group, idx) => (
          <div key={idx} className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] border-b border-[var(--border-subtle)] pb-2">
              {group.group}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.items
                .filter(
                  (item) =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.desc.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((api, aIdx) => (
                  <Card key={aIdx} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between items-center text-lg">
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                          {api.name}
                        </span>
                        <Badge variant="outline">Class</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-[var(--text-secondary)] mb-4">{api.desc}</p>
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase text-gray-500">
                          Public Methods
                        </h4>
                        <ul className="space-y-1">
                          {api.methods.map((method, mIdx) => (
                            <li
                              key={mIdx}
                              className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                            >
                              {method}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
