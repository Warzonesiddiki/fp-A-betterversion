/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GitCompare, CheckCircle2, AlertCircle, Wand2 } from 'lucide-react';
import { IntercompanyMatchingEngine } from '@/engines/IntercompanyMatchingEngine';

interface ICPair {
  id: string;
  fromEntityId: string;
  fromEntityName: string;
  toEntityId: string;
  toEntityName: string;
  accountCode: string;
  amount: number;
  status: 'Unmatched' | 'Matched' | 'Eliminated';
}

const mockPairs: ICPair[] = [
  {
    id: '1',
    fromEntityId: 'ent-1',
    fromEntityName: 'Global Corp',
    toEntityId: 'ent-2',
    toEntityName: 'US North',
    accountCode: '1100',
    amount: 50000,
    status: 'Unmatched',
  },
  {
    id: '2',
    fromEntityId: 'ent-2',
    fromEntityName: 'US North',
    toEntityId: 'ent-1',
    toEntityName: 'Global Corp',
    accountCode: '2100',
    amount: 50000,
    status: 'Unmatched',
  },
  {
    id: '3',
    fromEntityId: 'ent-1',
    fromEntityName: 'Global Corp',
    toEntityId: 'ent-3',
    toEntityName: 'EMEA HQ',
    accountCode: '1100',
    amount: 25000,
    status: 'Unmatched',
  },
  {
    id: '4',
    fromEntityId: 'ent-3',
    fromEntityName: 'EMEA HQ',
    toEntityId: 'ent-1',
    toEntityName: 'Global Corp',
    accountCode: '2100',
    amount: 24800,
    status: 'Unmatched',
  },
];

export default function ICEliminationPage() {
  const [pairs, setPairs] = useState<ICPair[]>(mockPairs);

  const autoMatch = () => {
    const matched = pairs.map((pair) => {
      const match = pairs.find(
        (m) =>
          m.id !== pair.id &&
          m.fromEntityId === pair.toEntityId &&
          m.toEntityId === pair.fromEntityId &&
          Math.abs(m.amount - pair.amount) / Math.max(m.amount, pair.amount) < 0.01
      );
      return { ...pair, status: (match ? 'Matched' : 'Unmatched') as ICPair['status'] };
    });
    setPairs(matched);
  };

  const handleEliminate = (id: string) => {
    setPairs(pairs.map((p) => (p.id === id ? { ...p, status: 'Eliminated' } : p)));
  };

  const stats = useMemo(
    () => ({
      total: pairs.length,
      matched: pairs.filter((p) => p.status === 'Matched').length,
      eliminated: pairs.filter((p) => p.status === 'Eliminated').length,
      unmatched: pairs.filter((p) => p.status === 'Unmatched').length,
    }),
    [pairs]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Intercompany Elimination
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Reconcile and eliminate intercompany balances across the group.
          </p>
        </div>
        <Button onClick={autoMatch} className="bg-blue-600 hover:bg-blue-700">
          <Wand2 className="h-4 w-4 mr-2" /> Auto-Match
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[var(--bg-surface)] border-[var(--border-subtle)]">
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-secondary)]">Total Pairs</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/10">
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-secondary)] text-emerald-400">Matched</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.matched}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/10">
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-secondary)] text-blue-400">Eliminated</div>
            <div className="text-2xl font-bold text-blue-400">{stats.eliminated}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/10">
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-secondary)] text-red-400">Unmatched</div>
            <div className="text-2xl font-bold text-red-400">{stats.unmatched}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle>Reconciliation Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm tabular-nums">
              <thead className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium">
                <tr>
                  <th className="py-3 px-4" scope="col">
                    From Entity
                  </th>
                  <th className="py-3 px-4 text-center" scope="col">
                    <GitCompare className="h-4 w-4 mx-auto opacity-40" />
                  </th>
                  <th className="py-3 px-4" scope="col">
                    To Entity
                  </th>
                  <th className="py-3 px-4" scope="col">
                    Account
                  </th>
                  <th className="py-3 px-4 text-right" scope="col">
                    Amount
                  </th>
                  <th className="py-3 px-4 text-center" scope="col">
                    Status
                  </th>
                  <th className="py-3 px-4 text-right" scope="col">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {pairs.map((pair) => (
                  <tr key={pair.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                    <td className="py-3 px-4 font-medium">{pair.fromEntityName}</td>
                    <td className="py-3 px-4 text-center">→</td>
                    <td className="py-3 px-4 font-medium">{pair.toEntityName}</td>
                    <td className="py-3 px-4 font-mono text-xs">{pair.accountCode}</td>
                    <td className="py-3 px-4 text-right font-bold">
                      ${pair.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {pair.status === 'Matched' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Matched
                        </Badge>
                      ) : pair.status === 'Eliminated' ? (
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                          Eliminated
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                          <AlertCircle className="h-3 w-3 mr-1" /> Unmatched
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {pair.status === 'Matched' && (
                        <Button size="sm" onClick={() => handleEliminate(pair.id)}>
                          Eliminate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
