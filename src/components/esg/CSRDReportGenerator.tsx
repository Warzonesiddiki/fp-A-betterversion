import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useESGStore, ESGMetric } from '@/store/esgStore';
import { FileText, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';

type CSRDSection = 'environmental' | 'social' | 'governance';
type ReportStatus = 'draft' | 'review' | 'approved';

interface CSRDRequirement {
  id: string;
  section: CSRDSection;
  standard: string;
  description: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-assessed';
  metricIds: string[];
}

const CSRD_REQUIREMENTS: CSRDRequirement[] = [
  {
    id: 'e1',
    section: 'environmental',
    standard: 'ESRS E1',
    description: 'Climate change mitigation and adaptation',
    status: 'compliant',
    metricIds: ['env-1', 'env-2'],
  },
  {
    id: 'e2',
    section: 'environmental',
    standard: 'ESRS E2',
    description: 'Pollution of air, water, and soil',
    status: 'partial',
    metricIds: ['env-3'],
  },
  {
    id: 'e3',
    section: 'environmental',
    standard: 'ESRS E3',
    description: 'Water and marine resources',
    status: 'partial',
    metricIds: ['env-4'],
  },
  {
    id: 'e4',
    section: 'environmental',
    standard: 'ESRS E4',
    description: 'Biodiversity and ecosystems',
    status: 'non-compliant',
    metricIds: [],
  },
  {
    id: 'e5',
    section: 'environmental',
    standard: 'ESRS E5',
    description: 'Resource use and circular economy',
    status: 'partial',
    metricIds: ['env-5'],
  },
  {
    id: 's1',
    section: 'social',
    standard: 'ESRS S1',
    description: 'Own workforce',
    status: 'compliant',
    metricIds: ['soc-1', 'soc-2'],
  },
  {
    id: 's2',
    section: 'social',
    standard: 'ESRS S2',
    description: 'Workers in the value chain',
    status: 'partial',
    metricIds: ['soc-3'],
  },
  {
    id: 's3',
    section: 'social',
    standard: 'ESRS S3',
    description: 'Affected communities',
    status: 'not-assessed',
    metricIds: [],
  },
  {
    id: 's4',
    section: 'social',
    standard: 'ESRS S4',
    description: 'Consumers and end-users',
    status: 'not-assessed',
    metricIds: [],
  },
  {
    id: 'g1',
    section: 'governance',
    standard: 'ESRS G1',
    description: 'Business conduct and ethics',
    status: 'compliant',
    metricIds: ['gov-1', 'gov-2'],
  },
];

const STATUS_CONFIG: Record<
  CSRDRequirement['status'],
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  compliant: { label: 'Compliant', color: 'text-green-400', icon: CheckCircle },
  partial: { label: 'Partial', color: 'text-yellow-400', icon: Clock },
  'non-compliant': { label: 'Non-Compliant', color: 'text-red-400', icon: AlertCircle },
  'not-assessed': { label: 'Not Assessed', color: 'text-slate-400', icon: Clock },
};

interface CSRDReportGeneratorProps {
  className?: string;
}

export function CSRDReportGenerator({ className }: CSRDReportGeneratorProps) {
  const { metrics } = useESGStore();
  const [activeSection, setActiveSection] = useState<CSRDSection>('environmental');
  const [reportStatus, setReportStatus] = useState<ReportStatus>('draft');

  const filteredRequirements = useMemo(
    () => CSRD_REQUIREMENTS.filter((r) => r.section === activeSection),
    [activeSection]
  );

  const complianceStats = useMemo(() => {
    const total = CSRD_REQUIREMENTS.length;
    const compliant = CSRD_REQUIREMENTS.filter((r) => r.status === 'compliant').length;
    const partial = CSRD_REQUIREMENTS.filter((r) => r.status === 'partial').length;
    const nonCompliant = CSRD_REQUIREMENTS.filter((r) => r.status === 'non-compliant').length;
    const notAssessed = CSRD_REQUIREMENTS.filter((r) => r.status === 'not-assessed').length;
    const score = Math.round((compliant / total) * 100);
    return { total, compliant, partial, nonCompliant, notAssessed, score };
  }, []);

  const linkedMetrics = useCallback(
    (metricIds: string[]): ESGMetric[] => {
      return metrics.filter((m) => metricIds.includes(m.id));
    },
    [metrics]
  );

  const handleExport = useCallback(() => {
    const report = {
      title: 'CSRD Compliance Report',
      generatedAt: new Date().toISOString(),
      status: reportStatus,
      complianceScore: complianceStats.score,
      requirements: CSRD_REQUIREMENTS.map((r) => ({
        standard: r.standard,
        description: r.description,
        status: r.status,
        linkedMetrics: linkedMetrics(r.metricIds).map((m) => ({
          name: m.name,
          value: m.value,
          unit: m.unit,
          target: m.target,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csrd-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [reportStatus, complianceStats.score, linkedMetrics]);

  const sections: { key: CSRDSection; label: string }[] = [
    { key: 'environmental', label: 'Environmental' },
    { key: 'social', label: 'Social' },
    { key: 'governance', label: 'Governance' },
  ];

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-slate-400 mb-1">Compliance Score</div>
          <div className="text-3xl font-bold text-white">{complianceStats.score}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-400 mb-1">Compliant</div>
          <div className="text-3xl font-bold text-green-400">{complianceStats.compliant}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-400 mb-1">Partial</div>
          <div className="text-3xl font-bold text-yellow-400">{complianceStats.partial}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-400 mb-1">Non-Compliant</div>
          <div className="text-3xl font-bold text-red-400" role="alert">
            {complianceStats.nonCompliant}
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {sections.map((s) => (
            <Button
              key={s.key}
              size="sm"
              variant={activeSection === s.key ? 'default' : 'ghost'}
              onClick={() => setActiveSection(s.key)}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={reportStatus}
            onChange={(e) => setReportStatus(e.target.value as ReportStatus)}
            className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white"
            aria-label="Report status"
          >
            <option value="draft">Draft</option>
            <option value="review">In Review</option>
            <option value="approved">Approved</option>
          </select>
          <Button size="sm" variant="ghost" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            ESRS Standards - {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequirements.map((req) => {
              const config = STATUS_CONFIG[req.status];
              const StatusIcon = config.icon;
              const metricsForReq = linkedMetrics(req.metricIds);

              return (
                <div key={req.id} className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-blue-400">
                          {req.standard}
                        </span>
                        <span className={`flex items-center gap-1 text-xs ${config.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mt-1">{req.description}</p>
                    </div>
                  </div>

                  {metricsForReq.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="text-xs text-slate-400 mb-2">Linked Metrics</div>
                      <div className="grid grid-cols-3 gap-2">
                        {metricsForReq.map((m) => (
                          <div key={m.id} className="text-xs">
                            <span className="text-slate-400">{m.name}: </span>
                            <span className="text-white font-medium">
                              {m.value} {m.unit}
                            </span>
                            <span className="text-slate-500">
                              {' '}
                              / {m.target} {m.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
