interface Entry {
  debit: number;
  credit: number;
  currency?: string;
  accountCode?: string;
  [key: string]: unknown;
}

interface TranslatedEntry extends Entry {
  localDebit: number;
  localCredit: number;
}

self.onmessage = (
  e: MessageEvent<{ entries: Entry[]; rates: Record<string, number>; eliminations: string[] }>
) => {
  const { entries, rates, eliminations } = e.data;
  try {
    const translated: TranslatedEntry[] = entries.map((entry) => {
      const rate = rates[entry.currency || 'USD'] || 1;
      return {
        ...entry,
        localDebit: entry.debit,
        localCredit: entry.credit,
        debit: entry.debit * rate,
        credit: entry.credit * rate,
      };
    });
    const eliminated = translated.filter((e) => !eliminations.includes(e.accountCode || ''));
    const totalDebit = eliminated.reduce((s, e) => s + e.debit, 0);
    const totalCredit = eliminated.reduce((s, e) => s + e.credit, 0);
    self.postMessage({
      result: eliminated,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    self.postMessage({ error: message });
  }
};
