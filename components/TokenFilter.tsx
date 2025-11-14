'use client';

import { useState } from 'react';

export type FilterOption = 'all' | 'top' | 'stablecoins' | 'native';

interface TokenFilterProps {
  onFilterChange: (filter: FilterOption) => void;
}

export function TokenFilter({ onFilterChange }: TokenFilterProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  const filters: Array<{ value: FilterOption; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'top', label: 'Top Tokens' },
    { value: 'stablecoins', label: 'Stablecoins' },
    { value: 'native', label: 'Native' },
  ];

  const handleFilterClick = (filter: FilterOption) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => handleFilterClick(filter.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === filter.value
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-gray-200 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-700'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

