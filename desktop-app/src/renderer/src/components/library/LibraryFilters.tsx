import { Search, Star, Heart, ArrowUpDown, Calendar, X } from 'lucide-react';

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

const RATING_OPTIONS = [
  { label: 'Any rating', value: null },
  { label: '7+', value: 7 },
  { label: '8+', value: 8 },
  { label: '9+', value: 9 },
];

const SORT_OPTIONS: { label: string; value: SortBy }[] = [
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

      <div className="filter-select-wrap">
        <Calendar size={13} className="filter-select-icon" />
        <select
          className="filter-select"
          value={selectedYear ?? ''}
          onChange={(e) => onYearChange(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="filter-select-wrap">
        <Star size={13} className="filter-select-icon" />
        <select
          className="filter-select"
          value={minRating ?? ''}
          onChange={(e) => onRatingChange(e.target.value !== '' ? Number(e.target.value) : null)}
        >
          {RATING_OPTIONS.map((o) => (
            <option key={o.label} value={o.value ?? ''}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-select-wrap">
        <ArrowUpDown size={13} className="filter-select-icon" />
        <select
          className="filter-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortBy)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

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
