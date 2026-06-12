/*
 * Universal stub for lucide-react in test environment.
 *
 * Replaces the real ~5,800-icon library with a Proxy that returns a no-op
 * component for ANY icon import. This allows test files to import icons
 * like `Table`, `Send`, `DollarSign`, `MessageSquare`, `Lightbulb`,
 * `FileSpreadsheet`, `BarChartHorizontal`, `Sigma`, `Landline`, `BookOpen`,
 * `CalendarDays`, `Code`, `Hash`, `Layers`, `LayoutGrid`, `Loader`,
 * `PieChartIcon`, `Play`, `Receipt`, `StopCircle`, `TrendingUpDown`,
 * `Wand2`, `Workflow`, `ZapOff`, etc., without needing a static allow-list.
 *
 * Without this, the previous setup.ts (a static 75-icon list) caused
 * vi.mock factory to return `undefined` for unmapped icons, which made
 * every test importing an unmapped icon fail with
 * `[vitest] No "X" export is defined on the "lucide-react" mock`.
 *
 * HOW IT'S USED:
 *   In vite.config.ts, this file is referenced via resolve.alias:
 *     'lucide-react': path.resolve(__dirname, 'src/test/__mocks__/lucide-react.ts')
 *   So every `import { Foo } from 'lucide-react'` resolves here at bundle
 *   time, regardless of the lucide-react package being installed.
 *
 *   Local `vi.mock('lucide-react', ...)` calls in individual test files
 *   (which previously caused "mock not returning object" errors) become
 *   no-ops because the underlying module is already an alias to this stub.
 */

const IconStub = () => null;

const lucideStub: Record<string, unknown> = {
  __esModule: true,
  default: IconStub,
};

const lucideProxy = new Proxy(lucideStub, {
  get(target, prop) {
    if (prop === '__esModule') return true;
    if (prop === 'default') return IconStub;
    if (typeof prop === 'symbol') return undefined;
    return IconStub;
  },
  has(target, prop) {
    if (typeof prop === 'symbol') return false;
    return true;
  },
});

export default lucideProxy;
export const Shield = IconStub;
export const ShieldAlert = IconStub;
export const AlertTriangle = IconStub;
export const AlertCircle = IconStub;
export const AlertOctagon = IconStub;
export const ChevronDown = IconStub;
export const ChevronUp = IconStub;
export const ChevronRight = IconStub;
export const ChevronLeft = IconStub;
export const Plus = IconStub;
export const Minus = IconStub;
export const X = IconStub;
export const Check = IconStub;
export const Search = IconStub;
export const Settings = IconStub;
export const Trash = IconStub;
export const Edit = IconStub;
export const Eye = IconStub;
export const EyeOff = IconStub;
export const Download = IconStub;
export const Upload = IconStub;
export const Save = IconStub;
export const RefreshCw = IconStub;
export const TrendingUp = IconStub;
export const TrendingDown = IconStub;
export const ArrowUp = IconStub;
export const ArrowDown = IconStub;
export const ArrowLeft = IconStub;
export const ArrowRight = IconStub;
export const MoreVertical = IconStub;
export const MoreHorizontal = IconStub;
export const Menu = IconStub;
export const Home = IconStub;
export const User = IconStub;
export const Users = IconStub;
export const Bell = IconStub;
export const Mail = IconStub;
export const Calendar = IconStub;
export const Clock = IconStub;
export const FileText = IconStub;
export const File = IconStub;
export const Folder = IconStub;
export const Database = IconStub;
export const BarChart3 = IconStub;
export const PieChart = IconStub;
export const LineChart = IconStub;
export const Activity = IconStub;
export const Zap = IconStub;
export const Info = IconStub;
export const HelpCircle = IconStub;
export const Loader2 = IconStub;
export const LogOut = IconStub;
export const Sparkles = IconStub;
export const Brain = IconStub;
export const Calculator = IconStub;
export const List = IconStub;
export const Grid = IconStub;
export const Filter = IconStub;
export const Star = IconStub;
export const Heart = IconStub;
export const Bookmark = IconStub;
export const Share2 = IconStub;
export const Copy = IconStub;
export const ExternalLink = IconStub;
export const Lock = IconStub;
export const Unlock = IconStub;
export const Globe = IconStub;
export const Moon = IconStub;
export const Sun = IconStub;
export const Send = IconStub;
export const MessageSquare = IconStub;
export const DollarSign = IconStub;
export const Lightbulb = IconStub;
export const Table = IconStub;
export const FileSpreadsheet = IconStub;
export const FileJson = IconStub;
export const BarChartHorizontal = IconStub;
export const Sigma = IconStub;
export const Landline = IconStub;
export const BookOpen = IconStub;
export const CalendarDays = IconStub;
export const Code = IconStub;
export const Hash = IconStub;
export const Layers = IconStub;
export const LayoutGrid = IconStub;
export const Loader = IconStub;
export const PieChartIcon = IconStub;
export const Play = IconStub;
export const Receipt = IconStub;
export const StopCircle = IconStub;
export const TrendingUpDown = IconStub;
export const Wand2 = IconStub;
export const Workflow = IconStub;
export const ZapOff = IconStub;
export const _type = IconStub;
