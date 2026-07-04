import { Search, Star, Heart, ArrowUpDown, Calendar, X } from 'lucide-react';
import { GlassSelect } from '../common';
import type { GlassSelectOption } from '../common';

export type SortBy = 'default' | 'title' | 'year' | 'rating';

export interface LibraryFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  years: number[];
  selectedYear: number | null;
  onYearChange: (v: number | null) => void;
  minRating: number | null;
  onRatingChange: (v: number | null) => void;
  favoritesOnly: boolean;
  onFavoritesChange: (v: boolean) => void;
  sortBy: SortBy;
  onSortChange: (v: SortBy) => void;
  onClear: () => void;
}

const RATING_OPTIONS: GlassSelectOption<number | null>[] = [
  { label: 'Any rating', value: null },
  { label: '7+', value: 7 },
  { label: '8+', value: 8 },
  { label: '9+', value: 9 },
];

const SORT_OPTIONS: GlassSelectOption<SortBy>[] = [
  { label: 'Default', value: 'default' },
  { label: 'Title A–Z', value: 'title' },
  { label: 'Year', value: 'year' },
  { label: 'Rating', value: 'rating' },
];

export function LibraryFilters({
  search,
  onSearchChange,
  years,
  selectedYear,
  onYearChange,
  minRating,
  onRatingChange,
  favoritesOnly,
  onFavoritesChange,
  sortBy,
  onSortChange,
  onClear,
}: LibraryFiltersProps) {
  const isFiltered = search !== '' || selectedYear !== null || minRating !== null || favoritesOnly || sortBy !== 'default';

  const yearOptions: GlassSelectOption<number | null>[] = [
    { label: 'All years', value: null },
    ...years.map((y) => ({ label: String(y), value: y as number | null })),
  ];

  return (
    <div className="filter-row">
      <div className="filter-search">
        <Search size={14} className="filter-search-icon" />
        <input
          className="filter-search-input"
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <GlassSelect
        icon={<Calendar size={13} />}
        ariaLabel="Filter by year"
        options={yearOptions}
        value={selectedYear}
        onChange={onYearChange}
      />

      <GlassSelect
        icon={<Star size={13} />}
        ariaLabel="Filter by minimum rating"
        options={RATING_OPTIONS}
        value={minRating}
        onChange={onRatingChange}
      />

      <GlassSelect
        icon={<ArrowUpDown size={13} />}
        ariaLabel="Sort library"
        options={SORT_OPTIONS}
        value={sortBy}
        onChange={onSortChange}
      />

      <button
        className={`filter-toggle-btn${favoritesOnly ? ' active' : ''}`}
        onClick={() => onFavoritesChange(!favoritesOnly)}
        title="Favorites only"
      >
        <Heart size={14} fill={favoritesOnly ? 'currentColor' : 'none'} />
        Favorites
      </button>

      {isFiltered && (
        <button className="filter-clear-btn" onClick={onClear} title="Clear all filters">
          <X size={13} />
          Clear
        </button>
      )}
    </div>
  );
}
