import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useId,
  useRef,
  HTMLAttributes,
  forwardRef,
  ButtonHTMLAttributes,
  KeyboardEventHandler,
} from 'react';
import { cn } from '../../utils/cn';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  baseId: string;
  /**
   * Move focus + activate the tab at `direction` (-1 = prev, +1 = next, ±Infinity = first/last).
   * Used by TabsList onKeyDown to implement the WAI-ARIA Tabs keyboard pattern
   * (ArrowLeft/ArrowRight, Home/End, with wrap-around).
   */
  focusTab: (direction: number) => void;
  /**
   * Register a TabsTrigger DOM node so TabsList can move focus between tabs.
   */
  registerTrigger: (value: string, node: HTMLButtonElement | null) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs compound components must be used within <Tabs>');
  return ctx;
}

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue, value, onValueChange, className, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const activeTab = value ?? internalValue;
    const baseId = useId();
    // Stable insertion-order map of trigger values -> DOM nodes, used by TabsList onKeyDown
    // to implement the WAI-ARIA Tabs keyboard pattern (Arrow/Home/End, with wrap-around).
    const triggerRefs = useRef(new Map<string, HTMLButtonElement>());

    const setActiveTab = useCallback(
      (newValue: string) => {
        if (!value) setInternalValue(newValue);
        onValueChange?.(newValue);
      },
      [value, onValueChange]
    );

    const registerTrigger = useCallback((triggerValue: string, node: HTMLButtonElement | null) => {
      if (node) {
        triggerRefs.current.set(triggerValue, node);
      } else {
        triggerRefs.current.delete(triggerValue);
      }
    }, []);

    const focusTab = useCallback(
      (direction: number) => {
        const order = Array.from(triggerRefs.current.keys());
        if (order.length === 0) return;
        const currentIndex = order.indexOf(activeTab);
        if (currentIndex === -1) return;
        // ±Infinity = Home/End; otherwise ±1 with wrap-around
        let nextIndex: number;
        if (!Number.isFinite(direction)) {
          nextIndex = direction > 0 ? order.length - 1 : 0;
        } else {
          nextIndex = (currentIndex + direction + order.length) % order.length;
        }
        const nextValue = order[nextIndex];
        if (nextValue === undefined) return;
        // Move focus synchronously, then activate the tab. Order matters: focus first so
        // screen readers announce the newly-focused tab trigger as it becomes selected.
        triggerRefs.current.get(nextValue)?.focus();
        setActiveTab(nextValue);
      },
      [activeTab, setActiveTab]
    );

    return (
      <TabsContext.Provider value={{ activeTab, setActiveTab, baseId, focusTab, registerTrigger }}>
        <div ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

type TabsListProps = HTMLAttributes<HTMLDivElement>;

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, onKeyDown, ...props }, ref) => {
    const { focusTab } = useTabsContext();
    const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          focusTab(1);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          focusTab(-1);
          break;
        case 'Home':
          event.preventDefault();
          focusTab(-Infinity);
          break;
        case 'End':
          event.preventDefault();
          focusTab(Infinity);
          break;
      }
    };
    return (
      <div
        ref={ref}
        role="tablist"
        // tablist itself is focusable so it can receive keyboard events when the
        // active tab is the only thing in the tab order; WAI-ARIA Tabs Pattern.
        tabIndex={-1}
        className={cn(
          'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground dark:bg-gray-800 dark:text-gray-400',
          className
        )}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);
TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, className, ...props }, ref) => {
    const { activeTab, setActiveTab, baseId, registerTrigger } = useTabsContext();
    const isActive = activeTab === value;
    const tabId = `${baseId}-tab-${value}`;
    const panelId = `${baseId}-panel-${value}`;
    // Combine forwarded ref with our registration ref so TabsList can move focus to this trigger.
    const setRefs = useCallback(
      (node: HTMLButtonElement | null) => {
        registerTrigger(value, node);
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      },
      [registerTrigger, value, ref]
    );

    return (
      <button
        ref={setRefs}
        type="button"
        role="tab"
        id={tabId}
        aria-selected={isActive}
        aria-controls={panelId}
        // Roving tabindex per WAI-ARIA Tabs Pattern: only the active tab is in the tab order.
        tabIndex={isActive ? 0 : -1}
        data-state={isActive ? 'active' : 'inactive'}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          isActive && 'bg-background text-foreground shadow-sm dark:bg-gray-700 dark:text-gray-100',
          className
        )}
        onClick={() => setActiveTab(value)}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className, ...props }, ref) => {
    const { activeTab, baseId } = useTabsContext();
    const tabId = `${baseId}-tab-${value}`;
    const panelId = `${baseId}-panel-${value}`;
    const isActive = activeTab === value;

    // Always render the panel so aria-controls round-trips to a real DOM node,
    // but mark it hidden when inactive. This is the WAI-ARIA Tabs Pattern:
    // the panel MUST exist in the DOM for the trigger's aria-controls to resolve.
    return (
      <div
        ref={ref}
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId}
        data-state={isActive ? 'active' : 'inactive'}
        tabIndex={0}
        hidden={!isActive}
        className={cn(
          'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className
        )}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
