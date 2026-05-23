/**
 * XBRLEngine — XBRL Tagging for SEC Reporting
 * Maps financial data to XBRL taxonomy for regulatory filing
 */

interface XBRLTag {
  id: string;
  name: string;
  namespace: string;
  dataType: 'monetary' | 'percentage' | 'text' | 'date' | 'shares';
  balance?: 'debit' | 'credit';
  periodType: 'instant' | 'duration';
}

interface XBRLFact {
  tag: XBRLTag;
  value: number | string;
  unit?: string;
  decimals?: number;
  period: { start?: string; end: string };
  entity: string;
  segment?: string;
}

interface XBRLMapping {
  accountId: string;
  tagName: string;
  taxonomy: 'us-gaap' | 'ifrs';
}

const US_GAAP_TAGS: Record<string, XBRLTag> = {
  revenue: {
    id: 'us-gaap:Revenues',
    name: 'Revenues',
    namespace: 'us-gaap',
    dataType: 'monetary',
    balance: 'credit',
    periodType: 'duration',
  },
  cogs: {
    id: 'us-gaap:CostOfGoodsAndServicesSold',
    name: 'COGS',
    namespace: 'us-gaap',
    dataType: 'monetary',
    balance: 'debit',
    periodType: 'duration',
  },
  grossProfit: {
    id: 'us-gaap:GrossProfit',
    name: 'Gross Profit',
    namespace: 'us-gaap',
    dataType: 'monetary',
    balance: 'credit',
    periodType: 'duration',
  },
  operatingExpense: {
    id: 'us-gaap:OperatingExpenses',
    name: 'Operating Expenses',
    namespace: 'us-gaap',
    dataType: 'monetary',
    balance: 'debit',
    periodType: 'duration',
  },
  netIncome: {
    id: 'us-gaap:NetIncomeLoss',
    name: 'Net Income',
    namespace: 'us-gaap',
    dataType: 'monetary',
    balance: 'credit',
    periodType: 'duration',
  },
  totalAssets: {
    id: 'us-gaap:Assets',
    name: 'Total Assets',
    namespace: 'us-gaap',
    dataType: 'monetary',
    balance: 'debit',
    periodType: 'instant',
  },
  totalLiabilities: {
    id: 'us-gaap:Liabilities',
    name: 'Total Liabilities',
    namespace: 'us-gaap',
    dataType: 'monetary',
    balance: 'credit',
    periodType: 'instant',
  },
  equity: {
    id: 'us-gaap:StockholdersEquity',
    name: 'Equity',
    namespace: 'us-gaap',
    dataType: 'monetary',
    balance: 'credit',
    periodType: 'instant',
  },
  cash: {
    id: 'us-gaap:CashAndCashEquivalents',
    name: 'Cash',
    namespace: 'us-gaap',
    dataType: 'monetary',
    balance: 'debit',
    periodType: 'instant',
  },
  debt: {
    id: 'us-gaap:LongTermDebt',
    name: 'Long-term Debt',
    namespace: 'us-gaap',
    dataType: 'monetary',
    balance: 'credit',
    periodType: 'instant',
  },
};

export class XBRLEngine {
  private static mappings: XBRLMapping[] = [];
  private static facts: XBRLFact[] = [];

  /**
   * Map GL account to XBRL tag
   */
  static mapAccount(
    accountId: string,
    tagName: string,
    taxonomy: 'us-gaap' | 'ifrs' = 'us-gaap'
  ): void {
    const existing = this.mappings.find((m) => m.accountId === accountId);
    if (existing) {
      existing.tagName = tagName;
      existing.taxonomy = taxonomy;
    } else {
      this.mappings.push({ accountId, tagName, taxonomy });
    }
  }

  /**
   * Auto-map accounts based on account type
   */
  static autoMap(accounts: Array<{ id: string; type: string; name: string }>): number {
    let mapped = 0;
    for (const account of accounts) {
      const lowerName = account.name.toLowerCase();
      let tag = '';

      if (lowerName.includes('revenue') || lowerName.includes('sales')) tag = 'revenue';
      else if (lowerName.includes('cost of') || lowerName.includes('cogs')) tag = 'cogs';
      else if (lowerName.includes('gross profit')) tag = 'grossProfit';
      else if (lowerName.includes('operating expense')) tag = 'operatingExpense';
      else if (lowerName.includes('net income')) tag = 'netIncome';
      else if (lowerName.includes('total asset')) tag = 'totalAssets';
      else if (lowerName.includes('total liabilit')) tag = 'totalLiabilities';
      else if (lowerName.includes('equity') || lowerName.includes('retained earnings'))
        tag = 'equity';
      else if (lowerName.includes('cash')) tag = 'cash';
      else if (lowerName.includes('debt') || lowerName.includes('loan')) tag = 'debt';

      if (tag) {
        this.mapAccount(account.id, tag);
        mapped++;
      }
    }
    return mapped;
  }

  /**
   * Generate XBRL facts from financial data
   */
  static generateFacts(
    data: Array<{ accountId: string; value: number; period: string; entity: string }>
  ): XBRLFact[] {
    const facts: XBRLFact[] = [];

    for (const item of data) {
      const mapping = this.mappings.find((m) => m.accountId === item.accountId);
      if (!mapping) continue;

      const tag = US_GAAP_TAGS[mapping.tagName];
      if (!tag) continue;

      facts.push({
        tag,
        value: item.value,
        unit: 'iso4217:USD',
        decimals: 2,
        period: { end: item.period },
        entity: item.entity,
      });
    }

    this.facts = facts;
    return facts;
  }

  /**
   * Export facts as XBRL XML snippet
   */
  static exportXML(facts: XBRLFact[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<xbrli:xbrl xmlns:xbrli="http://www.xbrl.org/2003/instance"\n';
    xml += '  xmlns:us-gaap="http://xbrl.sec.gov/us-gaap/2024"\n';
    xml += '  xmlns:iso4217="http://www.xbrl.org/2003/iso4217"\n';
    xml += '  xmlns:dei="http://xbrl.sec.gov/dei/2024">\n\n';

    for (const fact of facts) {
      const attrs = [
        `contextRef="${fact.entity}_${fact.period.end}"`,
        `unitRef="${fact.unit ?? 'iso4217:USD'}"`,
        `decimals="${fact.decimals ?? 2}"`,
      ].join(' ');

      if (typeof fact.value === 'number') {
        xml += `  <us-gaap:${fact.tag.name} ${attrs}>${fact.value}</us-gaap:${fact.tag.name}>\n`;
      } else {
        xml += `  <us-gaap:${fact.tag.name} ${attrs}>${fact.value}</us-gaap:${fact.tag.name}>\n`;
      }
    }

    // Contexts
    xml += '\n  <!-- Contexts -->\n';
    const entities = [...new Set(facts.map((f) => f.entity))];
    const periods = [...new Set(facts.map((f) => f.period.end))];

    for (const entity of entities) {
      for (const period of periods) {
        xml += `  <xbrli:context id="${entity}_${period}">\n`;
        xml += `    <xbrli:entity><xbrli:identifier scheme="http://www.sec.gov/CIK">${entity}</xbrli:identifier></xbrli:entity>\n`;
        xml += `    <xbrli:period><xbrli:endDate>${period}</xbrli:endDate></xbrli:period>\n`;
        xml += `  </xbrli:context>\n`;
      }
    }

    // Units
    xml +=
      '\n  <xbrli:unit id="iso4217:USD"><xbrli:measure>iso4217:USD</xbrli:measure></xbrli:unit>\n';
    xml += '</xbrli:xbrl>';

    return xml;
  }

  /**
   * Validate mapping completeness
   */
  static validateMappings(accounts: Array<{ id: string }>): { mapped: number; unmapped: string[] } {
    const mapped = accounts.filter((a) => this.mappings.some((m) => m.accountId === a.id));
    const unmapped = accounts.filter((a) => !this.mappings.some((m) => m.accountId === a.id));
    return { mapped: mapped.length, unmapped: unmapped.map((a) => a.id) };
  }

  /**
   * Get all mappings
   */
  static getMappings(): XBRLMapping[] {
    return [...this.mappings];
  }

  /**
   * Clear all data
   */
  static reset(): void {
    this.mappings = [];
    this.facts = [];
  }
}
