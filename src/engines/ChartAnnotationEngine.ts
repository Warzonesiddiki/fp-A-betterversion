/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * ChartAnnotationEngine — Annotations for financial charts
 * Add notes, markers, and highlights to chart data points
 */

interface ChartAnnotation {
  id: string;
  chartId: string;
  type: 'note' | 'marker' | 'range' | 'threshold' | 'trend';
  position: { x?: string | number; y?: number };
  content: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  createdBy: string;
  createdAt: string;
}

interface AnnotationConfig {
  showOnHover: boolean;
  showAlways: boolean;
  maxWidth: number;
  fontSize: number;
}

export class ChartAnnotationEngine {
  private static annotations = new Map<string, ChartAnnotation[]>();

  /**
   * Add annotation to a chart
   */
  static add(annotation: Omit<ChartAnnotation, 'id' | 'createdAt'>): ChartAnnotation {
    const full: ChartAnnotation = {
      ...annotation,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const existing = this.annotations.get(annotation.chartId) ?? [];
    existing.push(full);
    this.annotations.set(annotation.chartId, existing);

    return full;
  }

  /**
   * Remove annotation
   */
  static remove(annotationId: string): boolean {
    for (const [chartId, anns] of this.annotations) {
      const idx = anns.findIndex((a) => a.id === annotationId);
      if (idx !== -1) {
        anns.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  /**
   * Get all annotations for a chart
   */
  static getByChart(chartId: string): ChartAnnotation[] {
    return this.annotations.get(chartId) ?? [];
  }

  /**
   * Add threshold line annotation
   */
  static addThreshold(
    chartId: string,
    value: number,
    label: string,
    color?: string
  ): ChartAnnotation {
    return this.add({
      chartId,
      type: 'threshold',
      position: { y: value },
      content: label,
      color: color ?? '#EF4444',
      style: 'dashed',
      createdBy: 'system',
    });
  }

  /**
   * Add range highlight (e.g., budget period)
   */
  static addRange(
    chartId: string,
    startX: string,
    endX: string,
    label: string,
    color?: string
  ): ChartAnnotation {
    return this.add({
      chartId,
      type: 'range',
      position: { x: `${startX}-${endX}` },
      content: label,
      color: color ?? '#3B82F620',
      createdBy: 'system',
    });
  }

  /**
   * Auto-generate annotations from variance data
   */
  static autoAnnotate(
    chartId: string,
    data: Array<{ name: string; actual: number; budget: number }>
  ): ChartAnnotation[] {
    const annotations: ChartAnnotation[] = [];

    for (const item of data) {
      const variance = item.actual - item.budget;
      const pct = item.budget !== 0 ? (variance / Math.abs(item.budget)) * 100 : 0;

      if (Math.abs(pct) > 20) {
        annotations.push(
          this.add({
            chartId,
            type: 'marker',
            position: { x: item.name, y: item.actual },
            content: `${pct > 0 ? '+' : ''}${pct.toFixed(0)}% vs budget`,
            color: pct > 0 ? '#10B981' : '#EF4444',
            createdBy: 'auto',
          })
        );
      }
    }

    return annotations;
  }

  /**
   * Export annotations for persistence
   */
  static export(chartId: string): string {
    return JSON.stringify(this.annotations.get(chartId) ?? []);
  }

  /**
   * Import annotations from storage
   */
  static import(chartId: string, json: string): void {
    try {
      const parsed = JSON.parse(json) as ChartAnnotation[];
      this.annotations.set(chartId, parsed);
    } catch {
      // Invalid JSON — ignore
    }
  }
}
