import { GenericArticle, queryArticles, getFilterOptions, ArticleQuery } from './multi-database-connection';
import fs from 'fs';
import path from 'path';

// Selection state interface
export interface SelectionState {
  selectedIds: Set<string | number>;
  selectAll: boolean;
  excludedIds: Set<string | number>; // When selectAll is true
  filters: ArticleFilters;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
  currentPage: number;
  pageSize: number;
}

// Article filters
export interface ArticleFilters {
  searchText?: string;
  categories?: string[];
  authors?: string[];
  languages?: string[];
  status?: string[];
  dateRange?: { from?: Date; to?: Date };
  hasImages?: boolean;
  wordCountRange?: { min?: number; max?: number };
  hasSEO?: boolean;
}

// Selection preset
export interface SelectionPreset {
  id: string;
  name: string;
  description?: string;
  filters: ArticleFilters;
  createdAt: Date;
  lastUsed?: Date;
}

// Article selection manager class
export class ArticleSelectionManager {
  private state: SelectionState;
  private articles: GenericArticle[] = [];
  private filteredArticles: GenericArticle[] = [];
  private profileName: string;
  private presetsPath: string;

  constructor(profileName: string) {
    this.profileName = profileName;
    this.presetsPath = path.join(__dirname, 'selection-presets.json');
    this.state = this.createDefaultState();
    this.loadPresets();
  }

  private createDefaultState(): SelectionState {
    return {
      selectedIds: new Set(),
      selectAll: false,
      excludedIds: new Set(),
      filters: {},
      sortBy: 'created_at',
      sortDirection: 'DESC',
      currentPage: 1,
      pageSize: 50,
    };
  }

  // Load articles from database
  async loadArticles(websiteId?: number | string, language?: string): Promise<void> {
    const query: ArticleQuery = {
      profileName: this.profileName,
      websiteId,
      language,
      ...this.buildQueryFromFilters(),
    };

    this.articles = await queryArticles(query);
    this.applyFiltersAndSort();
  }

  // Build query from current filters
  private buildQueryFromFilters(): Partial<ArticleQuery> {
    const query: Partial<ArticleQuery> = {
      searchText: this.state.filters.searchText,
      categories: this.state.filters.categories,
      authors: this.state.filters.authors,
      status: this.state.filters.status,
      dateRange: this.state.filters.dateRange,
      hasImages: this.state.filters.hasImages,
      orderBy: this.state.sortBy,
      orderDirection: this.state.sortDirection,
    };

    // Remove undefined values
    Object.keys(query).forEach(key => {
      if (query[key as keyof ArticleQuery] === undefined) {
        delete query[key as keyof ArticleQuery];
      }
    });

    return query;
  }

  // Apply filters and sorting to loaded articles
  private applyFiltersAndSort(): void {
    let filtered = [...this.articles];

    // Apply word count filter if set
    if (this.state.filters.wordCountRange) {
      const { min, max } = this.state.filters.wordCountRange;
      filtered = filtered.filter(article => {
        const wordCount = this.getWordCount(article.content);
        return (!min || wordCount >= min) && (!max || wordCount <= max);
      });
    }

    // Apply SEO filter if set
    if (this.state.filters.hasSEO !== undefined) {
      filtered = filtered.filter(article => {
        const hasSEO = !!(article.meta_description && article.keywords);
        return this.state.filters.hasSEO === hasSEO;
      });
    }

    // Apply language filter if multiple languages
    if (this.state.filters.languages && this.state.filters.languages.length > 0) {
      filtered = filtered.filter(article =>
        this.state.filters.languages!.includes(article.language)
      );
    }

    this.filteredArticles = filtered;
  }

  // Get word count of content
  private getWordCount(content: string): number {
    if (!content) return 0;
    // Remove HTML tags if present
    const text = content.replace(/<[^>]*>/g, '');
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  // Selection methods
  selectArticle(id: string | number): void {
    if (this.state.selectAll) {
      this.state.excludedIds.delete(id);
    } else {
      this.state.selectedIds.add(id);
    }
  }

  deselectArticle(id: string | number): void {
    if (this.state.selectAll) {
      this.state.excludedIds.add(id);
    } else {
      this.state.selectedIds.delete(id);
    }
  }

  toggleArticle(id: string | number): void {
    if (this.isSelected(id)) {
      this.deselectArticle(id);
    } else {
      this.selectArticle(id);
    }
  }

  selectAll(): void {
    this.state.selectAll = true;
    this.state.excludedIds.clear();
  }

  deselectAll(): void {
    this.state.selectAll = false;
    this.state.selectedIds.clear();
    this.state.excludedIds.clear();
  }

  selectByFilter(filter: (article: GenericArticle) => boolean): void {
    const matching = this.filteredArticles.filter(filter);
    matching.forEach(article => this.selectArticle(article.id));
  }

  isSelected(id: string | number): boolean {
    if (this.state.selectAll) {
      return !this.state.excludedIds.has(id);
    }
    return this.state.selectedIds.has(id);
  }

  getSelectedArticles(): GenericArticle[] {
    return this.filteredArticles.filter(article => this.isSelected(article.id));
  }

  getSelectedCount(): number {
    if (this.state.selectAll) {
      return this.filteredArticles.length - this.state.excludedIds.size;
    }
    return this.state.selectedIds.size;
  }

  // Filter methods
  setFilter<K extends keyof ArticleFilters>(key: K, value: ArticleFilters[K]): void {
    this.state.filters[key] = value;
    this.applyFiltersAndSort();
  }

  clearFilter<K extends keyof ArticleFilters>(key: K): void {
    delete this.state.filters[key];
    this.applyFiltersAndSort();
  }

  clearAllFilters(): void {
    this.state.filters = {};
    this.applyFiltersAndSort();
  }

  // Sorting methods
  setSortBy(field: string, direction?: 'ASC' | 'DESC'): void {
    this.state.sortBy = field;
    if (direction) {
      this.state.sortDirection = direction;
    }
    this.sortArticles();
  }

  private sortArticles(): void {
    const field = this.state.sortBy as keyof GenericArticle;
    const direction = this.state.sortDirection === 'ASC' ? 1 : -1;

    this.filteredArticles.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * direction;
      }

      return (aVal < bVal ? -1 : 1) * direction;
    });
  }

  // Pagination methods
  setPage(page: number): void {
    this.state.currentPage = Math.max(1, page);
  }

  setPageSize(size: number): void {
    this.state.pageSize = Math.max(1, size);
    this.state.currentPage = 1; // Reset to first page
  }

  getCurrentPageArticles(): GenericArticle[] {
    const start = (this.state.currentPage - 1) * this.state.pageSize;
    const end = start + this.state.pageSize;
    return this.filteredArticles.slice(start, end);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredArticles.length / this.state.pageSize);
  }

  // Preset management
  savePreset(name: string, description?: string): void {
    const preset: SelectionPreset = {
      id: Date.now().toString(),
      name,
      description,
      filters: { ...this.state.filters },
      createdAt: new Date(),
    };

    const presets = this.loadPresets();
    presets.push(preset);
    this.savePresets(presets);
  }

  loadPreset(presetId: string): boolean {
    const presets = this.loadPresets();
    const preset = presets.find(p => p.id === presetId);

    if (preset) {
      this.state.filters = { ...preset.filters };
      preset.lastUsed = new Date();
      this.savePresets(presets);
      this.applyFiltersAndSort();
      return true;
    }

    return false;
  }

  getPresets(): SelectionPreset[] {
    return this.loadPresets();
  }

  deletePreset(presetId: string): boolean {
    const presets = this.loadPresets();
    const index = presets.findIndex(p => p.id === presetId);

    if (index !== -1) {
      presets.splice(index, 1);
      this.savePresets(presets);
      return true;
    }

    return false;
  }

  private loadPresets(): SelectionPreset[] {
    try {
      if (fs.existsSync(this.presetsPath)) {
        const data = fs.readFileSync(this.presetsPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading presets:', error);
    }
    return [];
  }

  private savePresets(presets: SelectionPreset[]): void {
    try {
      fs.writeFileSync(this.presetsPath, JSON.stringify(presets, null, 2));
    } catch (error) {
      console.error('Error saving presets:', error);
    }
  }

  // Export selection
  exportSelection(): {
    selectedIds: Array<string | number>;
    filters: ArticleFilters;
    totalCount: number;
    articles: GenericArticle[];
  } {
    return {
      selectedIds: Array.from(this.state.selectAll ?
        this.filteredArticles.filter(a => !this.state.excludedIds.has(a.id)).map(a => a.id) :
        this.state.selectedIds),
      filters: { ...this.state.filters },
      totalCount: this.getSelectedCount(),
      articles: this.getSelectedArticles(),
    };
  }

  // Import selection
  importSelection(selection: { selectedIds: Array<string | number>; filters?: ArticleFilters }): void {
    this.state.selectedIds = new Set(selection.selectedIds);
    this.state.selectAll = false;
    this.state.excludedIds.clear();

    if (selection.filters) {
      this.state.filters = { ...selection.filters };
      this.applyFiltersAndSort();
    }
  }

  // Get available filter options from database
  async getAvailableFilters(): Promise<{
    categories: string[];
    authors: string[];
    languages: string[];
    status: string[];
  }> {
    const [categories, authors, languages, status] = await Promise.all([
      getFilterOptions(this.profileName, 'categories'),
      getFilterOptions(this.profileName, 'authors'),
      getFilterOptions(this.profileName, 'languages'),
      getFilterOptions(this.profileName, 'status'),
    ]);

    return { categories, authors, languages, status };
  }

  // Statistics
  getStatistics(): {
    total: number;
    filtered: number;
    selected: number;
    byCategory: Record<string, number>;
    byLanguage: Record<string, number>;
    byStatus: Record<string, number>;
  } {
    const stats = {
      total: this.articles.length,
      filtered: this.filteredArticles.length,
      selected: this.getSelectedCount(),
      byCategory: {} as Record<string, number>,
      byLanguage: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    this.filteredArticles.forEach(article => {
      // Count by category
      if (article.category) {
        stats.byCategory[article.category] = (stats.byCategory[article.category] || 0) + 1;
      }

      // Count by language
      if (article.language) {
        stats.byLanguage[article.language] = (stats.byLanguage[article.language] || 0) + 1;
      }

      // Count by status
      if (article.status) {
        stats.byStatus[article.status] = (stats.byStatus[article.status] || 0) + 1;
      }
    });

    return stats;
  }
}