// src/components/audit/AuditRow.tsx
// Clio (Audit Muse) — Part 141 P0A-17 — Row with click-to-expand 3-col detail

import { useState, type JSX } from 'react';
import { ChevronDown, ChevronRight, RotateCcw, Network, FileJson } from 'lucide-react';
import {
  useAuditTrailStore,
  type ExtendedAuditEntry,
  type AuditOperation,
} from '@/store/auditTrailStore';
import { AuditDiff } from './AuditDiff';
import { Button } from '@/components/ui/Button';
import {
  auditOpBadges,
  auditApprovalBadges,
  auditOpAriaLabels,
  auditApprovalAriaLabels,
} from './auditTokens';

const formatTimestamp = (ms: number): string => {
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ms);
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface AuditRowProps {
  entry: ExtendedAuditEntry;
}

export function AuditRow({ entry }: AuditRowProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const selectedEntryId = useAuditTrailStore((s) => s.selectedEntryId);
  const selectEntry = useAuditTrailStore((s) => s.selectEntry);
  const revertToState = useAuditTrailStore((s) => s.revertToState);

  const isSelected = selectedEntryId === entry.id;
  const cellKey = `${entry.cellId.sectorId}/${entry.cellId.scenarioId}/${entry.cellId.periodId}/${entry.cellId.lineItemId}`;

  return (
    <li className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        type="button"
        onClick={() => {
          setExpanded(!expanded);
          selectEntry(isSelected ? null : entry.id);
        }}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-start gap-3"
        aria-expanded={expanded}
        aria-label={`Audit entry ${entry.id}`}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 mt-1 flex-shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 mt-1 flex-shrink-0 text-gray-400" />
        )}
        <div className="flex-1 min-w-0 grid grid-cols-12 gap-3 text-sm">
          <div className="col-span-2">
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${auditOpBadges[entry.operation]}`}
              aria-label={auditOpAriaLabels[entry.operation]}
            >
              {entry.operation}
            </span>
          </div>
          <div className="col-span-3 truncate text-gray-700 dark:text-gray-300 font-mono text-xs">
            {cellKey}
          </div>
          <div className="col-span-2 truncate text-gray-600 dark:text-gray-400 text-xs">
            {entry.userId}
          </div>
          <div className="col-span-2 text-gray-500 dark:text-gray-500 text-xs">
            {formatTimestamp(entry.timestamp)}
          </div>
          <div className="col-span-3">
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${auditApprovalBadges[entry.approvalStatus]}`}
              aria-label={auditApprovalAriaLabels[entry.approvalStatus]}
            >
              {entry.approvalStatus}
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-12 py-4 bg-gray-50 dark:bg-gray-800/50 grid grid-cols-3 gap-4 text-sm">
          {/* Column 1: Full Metadata */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Full Metadata</h4>
            <dl className="space-y-1 text-xs">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">ID</dt>
                <dd className="font-mono text-gray-700 dark:text-gray-300">{entry.id}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Cell ID</dt>
                <dd className="font-mono text-gray-700 dark:text-gray-300 break-all">{cellKey}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">User</dt>
                <dd className="text-gray-700 dark:text-gray-300">{entry.userId}</dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Source</dt>
                <dd className="text-gray-700 dark:text-gray-300">{entry.source}</dd>
              </div>
              {entry.transactionId && (
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Transaction ID</dt>
                  <dd className="font-mono text-gray-700 dark:text-gray-300 break-all">
                    {entry.transactionId}
                  </dd>
                </div>
              )}
              {entry.metadata && (
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Metadata</dt>
                  <dd>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Column 2: Approval + Diff */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Approval + Diff</h4>
            <dl className="space-y-1 text-xs mb-3">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                <dd>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${auditApprovalBadges[entry.approvalStatus]}`}
                    aria-label={auditApprovalAriaLabels[entry.approvalStatus]}
                  >
                    {entry.approvalStatus}
                  </span>
                </dd>
              </div>
              {entry.approvalUserId && (
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Approver</dt>
                  <dd className="text-gray-700 dark:text-gray-300">{entry.approvalUserId}</dd>
                </div>
              )}
              {entry.approvalTimestamp && (
                <div>
                  <dt className="text-gray-500 dark:text-gray-400">Approved At</dt>
                  <dd className="text-gray-700 dark:text-gray-300">
                    {formatTimestamp(entry.approvalTimestamp)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Timestamp</dt>
                <dd className="text-gray-700 dark:text-gray-300">
                  {formatTimestamp(entry.timestamp)}
                </dd>
              </div>
            </dl>
            <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-xs">Diff</h5>
            <AuditDiff
              previousValue={entry.previousValue}
              newValue={entry.newValue}
              dataType={entry.dataType}
            />
          </div>

          {/* Column 3: Actions + Cross-refs */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Actions</h4>
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => revertToState(entry.id)}
                className="w-full justify-start"
                aria-label={`Revert to state of entry ${entry.id}`}
              >
                <RotateCcw className="h-3 w-3 mr-1" /> Revert to this state
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => alert('View Lineage (Part 141 TBD)')}
                className="w-full justify-start"
                aria-label="View lineage"
              >
                <Network className="h-3 w-3 mr-1" /> View Lineage
              </Button>
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-600 dark:text-gray-400 flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100">
                  <FileJson className="h-3 w-3" /> Raw JSON
                </summary>
                <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 overflow-auto max-h-48 text-xs">
                  {JSON.stringify(entry, null, 2)}
                </pre>
              </details>
            </div>

            {/* Cross-references */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs space-y-1">
              <h5 className="font-semibold text-gray-700 dark:text-gray-300">Cross-references</h5>
              {entry.versionId && (
                <div>
                  <span className="text-gray-500">Part 140 Version: </span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {entry.versionId}
                  </span>
                </div>
              )}
              {entry.consentId && (
                <div>
                  <span className="text-gray-500">GDPR Consent: </span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {entry.consentId}
                  </span>
                </div>
              )}
              {entry.breachEventId && (
                <div>
                  <span className="text-gray-500">Breach Event: </span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {entry.breachEventId}
                  </span>
                </div>
              )}
              {entry.rbacEnforceId && (
                <div>
                  <span className="text-gray-500">RBAC Enforce: </span>
                  <span className="font-mono text-gray-700 dark:text-gray-300">
                    {entry.rbacEnforceId}
                  </span>
                </div>
              )}
              {!entry.versionId &&
                !entry.consentId &&
                !entry.breachEventId &&
                !entry.rbacEnforceId && (
                  <div className="text-gray-400 italic">No cross-references</div>
                )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
