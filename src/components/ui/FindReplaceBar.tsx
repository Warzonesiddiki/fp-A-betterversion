interface FindReplaceBarProps {
  findText: string;
  setFindText: (text: string) => void;
  replaceText: string;
  setReplaceText: (text: string) => void;
  onFind: () => void;
  onReplace: () => void;
  onClose: () => void;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({
  findText,
  setFindText,
  replaceText,
  setReplaceText,
  onFind,
  onReplace,
  onClose,
}) => (
  <div
    className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-muted)] border-b border-[var(--border-subtle)]"
    role="search"
    aria-label="Find and Replace"
  >
    <input
      type="text"
      value={findText}
      onChange={(e) => setFindText(e.target.value)}
      placeholder="Find..."
      className="px-2 py-1 text-sm border border-[var(--border-subtle)] rounded w-40"
      aria-label="Find text"
      // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: search bar activates on demand
      autoFocus
    />
    <button
      onClick={onFind}
      className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      aria-label="Search"
    >
      Search
    </button>
    <input
      type="text"
      value={replaceText}
      onChange={(e) => setReplaceText(e.target.value)}
      placeholder="Replace..."
      className="px-2 py-1 text-sm border border-[var(--border-subtle)] rounded w-40"
      aria-label="Replace text"
    />
    <button
      onClick={onReplace}
      className="px-2 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
      aria-label="Replace all"
    >
      Replace All
    </button>
    <button
      onClick={onClose}
      className="px-2 py-1 text-sm hover:bg-[var(--bg-surface)] rounded"
      aria-label="Close find and replace"
    >
      ✕
    </button>
  </div>
);
