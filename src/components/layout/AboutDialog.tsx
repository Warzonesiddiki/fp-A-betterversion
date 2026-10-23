import { useState, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Info, ExternalLink, Cpu, Monitor, Globe } from 'lucide-react';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const APP_VERSION = '1.0.0';
const APP_NAME = 'FinPlan Pro';
const APP_DESCRIPTION = 'Enterprise-grade Financial Planning & Analysis Platform';

interface TechStackItem {
  name: string;
  version: string;
  url: string;
}

const TECH_STACK: TechStackItem[] = [
  { name: 'Tauri', version: '2.x', url: 'https://tauri.app' },
  { name: 'React', version: '19.x', url: 'https://react.dev' },
  { name: 'TypeScript', version: '5.x', url: 'https://www.typescriptlang.org' },
  { name: 'Vite', version: '7.x', url: 'https://vitejs.dev' },
  { name: 'Tailwind CSS', version: '4.x', url: 'https://tailwindcss.com' },
  { name: 'Zustand', version: '5.x', url: 'https://zustand-demo.pmnd.rs' },
  { name: 'AG Grid', version: '33.x', url: 'https://www.ag-grid.com' },
  { name: 'Recharts', version: '2.x', url: 'https://recharts.org' },
];

export function AboutDialog({ isOpen, onClose }: AboutDialogProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleToggleDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="About FinPlan Pro" size="md">
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'var(--accent-primary)', color: 'var(--text-on-accent)' }}
          >
            <Monitor className="w-8 h-8" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {APP_NAME}
          </h2>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            {APP_DESCRIPTION}
          </p>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              background: 'var(--accent-primary-light, rgba(59,130,246,0.1))',
              color: 'var(--text-accent)',
            }}
          >
            v{APP_VERSION}
          </span>
        </div>

        {/* Platform info */}
        <div className="rounded-lg p-4 mb-4" style={{ background: 'var(--bg-secondary)' }}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
              <span style={{ color: 'var(--text-secondary)' }}>Platform:</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Desktop (Tauri)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Globe
                className="w-4 h-4"
                style={{ color: 'var(--text-muted)' }}
                aria-hidden="true"
              />
              <span style={{ color: 'var(--text-secondary)' }}>Mode:</span>
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                Offline-First
              </span>
            </div>
          </div>
        </div>

        {/* Tech stack toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleDetails}
          className="w-full mb-3 flex items-center justify-center gap-2"
          aria-expanded={showDetails}
          aria-controls="tech-stack-details"
        >
          <Info className="w-4 h-4" aria-hidden="true" />
          {showDetails ? 'Hide' : 'Show'} Technology Stack
        </Button>

        {/* Tech stack details */}
        {showDetails && (
          <div
            id="tech-stack-details"
            className="rounded-lg p-4 mb-4 space-y-2"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Built With
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TECH_STACK.map((tech) => (
                <a
                  key={tech.name}
                  href={tech.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <span className="font-medium">{tech.name}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {tech.version}
                    </span>
                    <ExternalLink
                      className="w-3 h-3"
                      style={{ color: 'var(--text-muted)' }}
                      aria-hidden="true"
                    />
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Copyright */}
        <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          Copyright 2026 FinPlan Pro. All rights reserved.
        </p>

        {/* Close button */}
        <div className="mt-6 flex justify-end">
          {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
          <Button variant="default" onClick={onClose} autoFocus>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
