import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, RefreshCw, Pencil, Check, X } from 'lucide-react';
import { AutoCommentaryEngine } from '@/engines/AutoCommentaryEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface CommentaryLineItem {
  name: string;
  actual: number;
  budget: number;
  priorYear?: number;
  drivers?: string[];
}

interface CommentaryPanelProps {
  section: string;
  period: string;
  lineItems: CommentaryLineItem[];
  className?: string;
}

export function CommentaryPanel({
  section = '',
  period = '',
  lineItems = [],
  className,
}: CommentaryPanelProps) {
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draftText, setDraftText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingIdx !== null && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editingIdx]);

  const generated = useMemo(() => {
    if (lineItems.length === 0) return [];

    const sectionNarrative = AutoCommentaryEngine.generateSectionNarrative(
      section,
      lineItems,
      period
    );

    const itemCommentaries = lineItems.map((item) =>
      AutoCommentaryEngine.generateVarianceCommentary(item.actual, item.budget, item.name, period, {
        priorYear: item.priorYear,
        drivers: item.drivers,
      })
    );

    return [sectionNarrative, ...itemCommentaries];
  }, [section, period, lineItems]);

  const displayTexts = useMemo(
    () => generated.map((text, i) => overrides[i] ?? text),
    [generated, overrides]
  );

  const handleEdit = useCallback(
    (idx: number) => {
      setEditingIdx(idx);
      setDraftText(displayTexts[idx] ?? '');
    },
    [displayTexts]
  );

  const handleSave = useCallback(() => {
    if (editingIdx !== null) {
      setOverrides((prev) => ({ ...prev, [editingIdx]: draftText }));
      setEditingIdx(null);
    }
  }, [editingIdx, draftText]);

  const handleCancel = useCallback(() => {
    setEditingIdx(null);
    setDraftText('');
  }, []);

  const handleRegenerate = useCallback(() => {
    setOverrides({});
    setEditingIdx(null);
  }, []);

  if (lineItems.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-blue-400" />
          Auto-Generated Commentary
        </CardTitle>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRegenerate}
          aria-label="Regenerate commentary"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Regenerate
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayTexts.map((text, idx) => (
            <div
              key={idx}
              className="group relative rounded-lg border border-slate-700 bg-slate-800/50 p-3"
            >
              {editingIdx === idx ? (
                <div className="space-y-2">
                  <textarea
                    ref={textareaRef}
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500"
                    rows={3}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Check className="h-3 w-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-300 leading-relaxed pr-8">{text}</p>
                  <button
                    type="button"
                    onClick={() => handleEdit(idx)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-700 transition-opacity"
                    aria-label="Edit commentary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {overrides[idx] !== undefined && (
                    <span className="inline-block mt-1 text-[10px] text-amber-700/70 italic">
                      Edited
                    </span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
