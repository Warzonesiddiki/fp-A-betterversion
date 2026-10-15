/** Exact, staged GL ingestion contract. No financial posting or storage side effects. */
export type GLIngestField =
  | 'accountCode'
  | 'accountName'
  | 'postDate'
  | 'debit'
  | 'credit'
  | 'amount'
  | 'entityId'
  | 'currency'
  | 'journalId'
  | 'description'
  | 'reference';
export type GLIngestMappings = Partial<Record<GLIngestField, string>>;
export interface GLIngestInput {
  readonly headers: readonly string[];
  /** May be a generator; accepted/quarantined outputs are still materialized in this API. */
  readonly rows: Iterable<Readonly<Record<string, string>>>;
  readonly sourceId: string;
  readonly firstRowNumber?: number;
  readonly mappings?: Readonly<GLIngestMappings>;
  readonly knownAccountCodes: readonly string[];
  readonly knownEntityIds: readonly string[];
  /** This contract uses two decimal places and a single currency; translate separate batches later. */
  readonly expectedCurrency: string;
  readonly dateOrder: 'MDY' | 'DMY' | 'ISO_ONLY';
  /** Mandatory when using a signed amount column. Never infer from account type. */
  readonly amountConvention?: 'positive-debit' | 'positive-credit';
}
export interface GLIngestReason {
  readonly code:
    | 'SCHEMA_ERROR'
    | 'UNKNOWN_ACCOUNT'
    | 'INVALID_DATE'
    | 'INVALID_AMOUNT'
    | 'MISSING_ENTITY'
    | 'UNKNOWN_ENTITY'
    | 'CURRENCY_MISMATCH';
  readonly field: string;
  readonly message: string;
}
export interface StagedGLRow {
  readonly sourceId: string;
  readonly sourceRow: number;
  readonly accountCode: string;
  readonly postDate: string;
  readonly debit: string;
  readonly credit: string;
  readonly entityId: string;
  readonly currency: string;
  readonly journalId: string;
  readonly accountName: string;
  readonly description: string;
  readonly reference: string;
}
export interface QuarantinedGLRow {
  readonly sourceId: string;
  readonly sourceRow: number;
  readonly raw: Readonly<Record<string, string>>;
  readonly reasons: readonly GLIngestReason[];
}
export interface VoucherImbalance {
  readonly entityId: string;
  readonly currency: string;
  /** Empty means file-level grouping, not a fabricated source journal identifier. */
  readonly journalId: string;
  readonly debit: string;
  readonly credit: string;
  readonly imbalance: string;
  readonly sourceRows: readonly number[];
}
export interface GLIngestResult {
  readonly mappings: Readonly<GLIngestMappings>;
  readonly schemaErrors: readonly string[];
  readonly acceptedRows: readonly StagedGLRow[];
  readonly quarantinedRows: readonly QuarantinedGLRow[];
  readonly controlTotals: {
    readonly debit: string;
    readonly credit: string;
    readonly imbalance: string;
  };
  readonly unbalancedVouchers: readonly VoucherImbalance[];
  /** Staging eligibility only. The store must still check file identity, locks and transactional writes. */
  readonly canPost: boolean;
}
