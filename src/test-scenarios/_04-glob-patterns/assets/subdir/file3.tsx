/* eslint-disable */
/**
 * Third test file for glob pattern matching
 * React TypeScript component file
 */

import React, { useState, useEffect, useCallback } from 'react';

// Type definitions
interface ComponentProps {
  title: string;
  items: string[];
  onItemSelect?: (item: string, index: number) => void;
  className?: string;
}

interface ComponentState {
  selectedIndex: number | null;
  filter: string;
  isLoading: boolean;
}

// Custom hook
function useFilteredItems(items: string[], filter: string): string[] {
  const [filteredItems, setFilteredItems] = useState<string[]>([]);

  useEffect(() => {
    if (!filter) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter(item =>
      item.toLowerCase().includes(filter.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [items, filter]);

  return filteredItems;
}

// Main component
export const ItemSelector: React.FC<ComponentProps> = ({
  title,
  items,
  onItemSelect,
  className = ''
}) => {
  const [state, setState] = useState<ComponentState>({
    selectedIndex: null,
    filter: '',
    isLoading: false
  });

  const filteredItems = useFilteredItems(items, state.filter);

  const handleItemClick = useCallback((item: string, index: number) => {
    setState(prev => ({ ...prev, selectedIndex: index }));
    onItemSelect?.(item, index);
  }, [onItemSelect]);

  const handleFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({ ...prev, filter: event.target.value, selectedIndex: null }));
  }, []);

  const clearFilter = useCallback(() => {
    setState(prev => ({ ...prev, filter: '', selectedIndex: null }));
  }, []);

  useEffect(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    const timer = setTimeout(() => {
      setState(prev => ({ ...prev, isLoading: false }));
    }, 100);

    return () => clearTimeout(timer);
  }, [filteredItems]);

  if (state.isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className={`item-selector ${className}`}>
      <header className="selector-header">
        <h2>{title}</h2>
        <div className="filter-controls">
          <input
            type="text"
            placeholder="Filter items..."
            value={state.filter}
            onChange={handleFilterChange}
            className="filter-input"
          />
          {state.filter && (
            <button onClick={clearFilter} className="clear-button">
              Clear
            </button>
          )}
        </div>
      </header>

      <main className="items-container">
        {filteredItems.length === 0 ? (
          <div className="no-items">No items found</div>
        ) : (
          <ul className="items-list">
            {filteredItems.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className={`item ${state.selectedIndex === index ? 'selected' : ''}`}
                onClick={() => handleItemClick(item, index)}
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

// Helper components
const LoadingSpinner: React.FC = () => (
  <div className="spinner">
    <div className="spinner-circle" />
  </div>
);

export const ItemSelectorWithSpinner: React.FC<ComponentProps> = (props) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <LoadingSpinner />;
  }

  return <ItemSelector {...props} />;
};

// Default export
export default ItemSelector;