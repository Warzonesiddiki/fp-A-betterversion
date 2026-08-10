import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FileBarChart,
  GitCompareArrows,
  TrendingUp,
  PieChart,
  BarChart3,
  FlaskConical,
  Brain,
  CalendarCheck,
  CheckSquare,
  Database,
  MessageSquare,
  Cpu,
  BookOpen,
  Settings,
  Puzzle,
  Landmark,
  Factory,
  ShoppingCart,
  Activity,
  Zap,
  Leaf,
  Truck,
  Package,
  Coins,
  FileCheck2,
  GraduationCap,
  Users,
} from 'lucide-react';

/**
 * Five-pillar navigation model (PRD E1.1, UX §3.1). Each pillar maps existing
 * routes so legacy surfaces remain reachable while the product reads as a
 * finance operating system. Items without a `permission` key are visible to
 * every role; items with a key are filtered against ROLE_PERMISSIONS.
 *
 * Note: nav visibility is presentation. Data authorization is enforced
 * server-side (F-04); this model never claims client-only authorization.
 */

export type PillarId = 'workspace' | 'modeling' | 'close' | 'reporting' | 'admin';

export interface PillarNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Optional ROLE_PERMISSIONS key; undefined = visible to all roles. */
  permission?: string;
}

export interface Pillar {
  id: PillarId;
  label: string;
  items: readonly PillarNavItem[];
}

export const PILLARS: readonly Pillar[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        permission: 'dashboard:read',
      },
      { path: '/budgets', label: 'Budgets', icon: FileBarChart, permission: 'budget:read' },
      {
        path: '/budgets/bva',
        label: 'Budget vs Actual',
        icon: GitCompareArrows,
        permission: 'budget:read',
      },
      { path: '/forecasts', label: 'Forecasts', icon: TrendingUp, permission: 'forecast:read' },
    ],
  },
  {
    id: 'modeling',
    label: 'Modeling',
    items: [
      { path: '/scenarios', label: 'Scenarios', icon: FlaskConical, permission: 'scenario:read' },
      {
        path: '/variance',
        label: 'Variance Analysis',
        icon: GitCompareArrows,
        permission: 'variance:read',
      },
      { path: '/analytics', label: 'Analytics', icon: PieChart, permission: 'analytics:read' },
      {
        path: '/analytics/pivot-explorer',
        label: 'Pivot Explorer',
        icon: BarChart3,
        permission: 'analytics:read',
      },
      { path: '/ai', label: 'AI Analyst', icon: Brain, permission: 'analytics:read' },
    ],
  },
  {
    id: 'close',
    label: 'Close',
    items: [
      { path: '/periods/close', label: 'Period Close', icon: CalendarCheck },
      { path: '/collaboration/approvals', label: 'Approval Queue', icon: CheckSquare },
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    items: [{ path: '/reports', label: 'Reports', icon: BookOpen, permission: 'report:read' }],
  },
  {
    id: 'admin',
    label: 'Admin',
    items: [
      { path: '/data', label: 'Data Management', icon: Database, permission: 'gl:read' },
      { path: '/data/gl-explorer', label: 'GL Explorer', icon: Database, permission: 'gl:read' },
      {
        path: '/data/trial-balance',
        label: 'Trial Balance',
        icon: FileBarChart,
        permission: 'gl:read',
      },
      {
        path: '/data/chart-of-accounts',
        label: 'Chart of Accounts',
        icon: FileBarChart,
        permission: 'gl:read',
      },
      { path: '/data/import', label: 'Data Import', icon: Database, permission: 'import:read' },
      { path: '/admin/engines', label: 'Engine Catalog', icon: Cpu },
      { path: '/collaboration', label: 'Collaboration', icon: MessageSquare },
      { path: '/settings', label: 'Settings', icon: Settings },
      { path: '/plugins', label: 'Plugins', icon: Puzzle },
    ],
  },
];

/**
 * Legacy/experimental module group. Kept visible and explicitly labeled
 * experimental per PRD E1.1 AC4 (legacy surfaces never imply supported
 * breadth); these routes await disposition in the capability matrix.
 */
export const LEGACY_NAV_ITEMS: readonly PillarNavItem[] = [
  { path: '/saas/arr', label: 'SaaS', icon: Cpu },
  { path: '/manufacturing/production', label: 'Manufacturing', icon: Factory },
  { path: '/retail/stores', label: 'Retail', icon: ShoppingCart },
  { path: '/banking/nim', label: 'Banking', icon: Landmark },
  { path: '/healthcare/dashboard', label: 'Healthcare', icon: Activity },
  { path: '/energy/dashboard', label: 'Energy', icon: Zap },
  { path: '/esg/carbon', label: 'ESG', icon: Leaf },
  { path: '/logistics', label: 'Logistics', icon: Truck },
  { path: '/logistics/fleet-cost', label: 'Fleet Cost', icon: Truck },
  { path: '/logistics/warehouse-cost', label: 'Warehouse Cost', icon: Package },
  { path: '/government', label: 'Government', icon: Landmark },
  { path: '/government/grants', label: 'Grants', icon: Coins },
  { path: '/government/procurement', label: 'Procurement', icon: FileCheck2 },
  { path: '/education', label: 'Education', icon: GraduationCap },
  { path: '/education/enrollment', label: 'Enrollment', icon: Users },
  { path: '/education/research-grants', label: 'Research Grants', icon: FlaskConical },
];

export function isItemActive(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(path + '/');
}
