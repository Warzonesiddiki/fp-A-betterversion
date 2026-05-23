// DataCatalogEngine — Searchable inventory of all data assets
// Pure TypeScript, deterministic, no external dependencies

export type AssetType = 'table' | 'view' | 'report' | 'dashboard' | 'dataset' | 'file' | 'api';

export interface DataAsset {
  id: string;
  name: string;
  type: AssetType;
  description: string;
  owner: string;
  tags: string[];
  schema: SchemaField[];
  source: string;
  refreshSchedule?: string;
  rowCount?: number;
  sizeBytes?: number;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface SchemaField {
  name: string;
  type: string;
  nullable: boolean;
  description?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: { asset: string; field: string };
}

export interface CatalogSearchResult {
  asset: DataAsset;
  relevance: number;
  matchedFields: string[];
}

export interface LineageNode {
  assetId: string;
  assetName: string;
  type: AssetType;
  direction: 'upstream' | 'downstream';
}

export interface LineageEdge {
  source: string;
  target: string;
  transformation?: string;
}

export class DataCatalogEngine {
  private assets = new Map<string, DataAsset>();
  private lineage: LineageEdge[] = [];

  addAsset(asset: DataAsset): void {
    this.assets.set(asset.id, asset);
  }

  removeAsset(id: string): boolean {
    this.lineage = this.lineage.filter((e) => e.source !== id && e.target !== id);
    return this.assets.delete(id);
  }

  getAsset(id: string): DataAsset | undefined {
    return this.assets.get(id);
  }

  listAssets(filter?: { type?: AssetType; owner?: string; tags?: string[] }): DataAsset[] {
    let assets = Array.from(this.assets.values());
    if (filter?.type) assets = assets.filter((a) => a.type === filter.type);
    if (filter?.owner) assets = assets.filter((a) => a.owner === filter.owner);
    if (filter?.tags?.length) {
      assets = assets.filter((a) => filter.tags!.some((t) => a.tags.includes(t)));
    }
    return assets;
  }

  search(query: string): CatalogSearchResult[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const results: CatalogSearchResult[] = [];
    for (const asset of this.assets.values()) {
      let relevance = 0;
      const matched: string[] = [];
      const name = asset.name.toLowerCase();
      const desc = asset.description.toLowerCase();
      for (const term of terms) {
        if (name.includes(term)) {
          relevance += 3;
          matched.push('name');
        }
        if (desc.includes(term)) {
          relevance += 2;
          matched.push('description');
        }
        if (asset.tags.some((t) => t.toLowerCase().includes(term))) {
          relevance += 2;
          matched.push('tags');
        }
        for (const field of asset.schema) {
          if (field.name.toLowerCase().includes(term)) {
            relevance += 1;
            matched.push(`schema.${field.name}`);
          }
          if (field.description?.toLowerCase().includes(term)) {
            relevance += 1;
            matched.push(`schema.${field.name}.description`);
          }
        }
      }
      if (relevance > 0) {
        results.push({ asset, relevance, matchedFields: [...new Set(matched)] });
      }
    }
    return results.sort((a, b) => b.relevance - a.relevance);
  }

  addLineage(source: string, target: string, transformation?: string): void {
    this.lineage.push({ source, target, transformation });
  }

  removeLineage(source: string, target: string): boolean {
    const idx = this.lineage.findIndex((e) => e.source === source && e.target === target);
    if (idx === -1) return false;
    this.lineage.splice(idx, 1);
    return true;
  }

  getLineage(assetId: string): { upstream: LineageNode[]; downstream: LineageNode[] } {
    const upstream: LineageNode[] = [];
    const downstream: LineageNode[] = [];

    const visitedUp = new Set<string>();
    const queueUp = [assetId];
    while (queueUp.length > 0) {
      const current = queueUp.shift()!;
      for (const edge of this.lineage) {
        if (edge.target === current && !visitedUp.has(edge.source)) {
          visitedUp.add(edge.source);
          const asset = this.assets.get(edge.source);
          if (asset)
            upstream.push({
              assetId: asset.id,
              assetName: asset.name,
              type: asset.type,
              direction: 'upstream',
            });
          queueUp.push(edge.source);
        }
      }
    }

    const visitedDown = new Set<string>();
    const queueDown = [assetId];
    while (queueDown.length > 0) {
      const current = queueDown.shift()!;
      for (const edge of this.lineage) {
        if (edge.source === current && !visitedDown.has(edge.target)) {
          visitedDown.add(edge.target);
          const asset = this.assets.get(edge.target);
          if (asset)
            downstream.push({
              assetId: asset.id,
              assetName: asset.name,
              type: asset.type,
              direction: 'downstream',
            });
          queueDown.push(edge.target);
        }
      }
    }

    return { upstream, downstream };
  }

  getLineageGraph(): { nodes: DataAsset[]; edges: LineageEdge[] } {
    const nodeIds = new Set<string>();
    for (const edge of this.lineage) {
      nodeIds.add(edge.source);
      nodeIds.add(edge.target);
    }
    const nodes = Array.from(nodeIds)
      .map((id) => this.assets.get(id))
      .filter(Boolean) as DataAsset[];
    return { nodes, edges: [...this.lineage] };
  }

  serialize(): string {
    return JSON.stringify({
      assets: Array.from(this.assets.entries()),
      lineage: this.lineage,
    });
  }

  deserialize(data: string): void {
    const p = JSON.parse(data);
    this.assets = new Map(p.assets);
    this.lineage = p.lineage || [];
  }
}
