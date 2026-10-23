/**
 * HelpPanel - Layout wrapper that resolves help content for the current route
 * Built by HERMES (P1-A HelpPanel Integration, 2026-06-15)
 *
 * This wrapper sits in src/components/layout/ (alongside Navbar, Sidebar, etc.)
 * and connects the route-aware MergedHelpResolver to the existing UI HelpPanel
 * component in src/components/ui/HelpPanel.tsx.
 *
 * Usage in AppLayout.tsx:
 *   const location = useLocation();
 *   const helpOpen = useUIStore((s) => s.helpPanelOpen);
 *   const toggleHelp = useUIStore((s) => s.toggleHelpPanel);
 *   <HelpPanel
 *     pathname={location.pathname}
 *     isOpen={helpOpen}
 *     onClose={toggleHelp}
 *   />
 *
 * Why a wrapper (not just using HelpPanel directly)?
 *  - Centralizes the pathname -> MergedHelp resolution
 *  - Keeps AppLayout.tsx free of help-related business logic
 *  - Single place to add loading states, error boundaries, telemetry
 *  - Single place to evolve the merge contract without touching the layout
 */

import { useMemo } from 'react';
import { HelpPanel as HelpPanelBase } from '@/components/ui/HelpPanel';
import { getMergedHelp } from '../help/MergedHelpResolver';

export interface HelpPanelProps {
  /** Current pathname (e.g. '/budgets/create') */
  pathname: string;
  /** Whether the panel is visible */
  isOpen: boolean;
  /** Close handler (called on Esc, outside-click, X button) */
  onClose: () => void;
}

export const HelpPanel = ({ pathname, isOpen, onClose }: HelpPanelProps) => {
  // Resolve help content for the current route.
  // useMemo avoids re-resolving on every render unless pathname changes.
  const help = useMemo(() => getMergedHelp(pathname), [pathname]);

  // getMergedHelp returns:
  //  - MergedHelp with rich content (from PAGE_HELP)
  //  - MergedHelp synthesized (from ROUTE_HELP_DOCS)
  //  - MergedHelp "No help available" synthetic (unknown route)
  //  - null (auth route with part=null, no PAGE_HELP — should not render)
  if (!help) return null;

  return (
    <HelpPanelBase title={help.title} sections={help.sections} isOpen={isOpen} onClose={onClose} />
  );
};

export default HelpPanel;
