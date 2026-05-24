import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts, type ShortcutDef } from '@/hooks/useKeyboardShortcuts';
import { CommandPalette } from './CommandPalette';
import { ShortcutHelpModal } from './ShortcutHelpModal';
import { useUIStore } from '@/store/uiStore';

interface KeyboardShortcutProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutProvider({ children }: KeyboardShortcutProviderProps) {
  const navigate = useNavigate();
  const [commandOpen, setCommandOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const shortcuts: ShortcutDef[] = [
    {
      key: 'k',
      ctrl: true,
      handler: () => setCommandOpen((o) => !o),
      description: 'Command palette',
    },
    { key: 'b', ctrl: true, handler: toggleSidebar, description: 'Toggle sidebar' },
    { key: '/', ctrl: true, handler: () => setHelpOpen(true), description: 'Show shortcuts' },
    { key: '1', ctrl: true, handler: () => navigate('/'), description: 'Dashboard' },
    { key: '2', ctrl: true, handler: () => navigate('/budgets'), description: 'Budgets' },
    { key: '3', ctrl: true, handler: () => navigate('/forecasts'), description: 'Forecasts' },
    { key: '4', ctrl: true, handler: () => navigate('/scenarios'), description: 'Scenarios' },
    { key: '5', ctrl: true, handler: () => navigate('/reports'), description: 'Reports' },
    { key: '?', handler: () => setHelpOpen(true), description: 'Help' },
    {
      key: 'Escape',
      handler: () => {
        setCommandOpen(false);
        setHelpOpen(false);
      },
      description: 'Close',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <>
      {children}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <ShortcutHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
