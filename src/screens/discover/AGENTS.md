# Discovery Module Documentation

## Overview

The Discovery module provides a professional, editorial news and content feed integrated with a Headless WordPress backend. It features responsive layouts, real-time search, category filtering, and a premium article reading experience.

## Directory Structure

`src/screens/discover/`

- `DiscoverScreen.tsx`: Main entry point with featured articles, categories, and ad carousels.
- `ArticleDetailScreen.tsx`: Full article view with reading progress bar, author cards, and HTML rendering via WebView.
- `AllArticlesScreen.tsx`: Infinite scrolling list of all available posts.
- `SearchResultsScreen.tsx`: Debounced real-time search for articles.
- `CategoryDetailScreen.tsx`: Articles filtered by a specific category.
- `TagDetailScreen.tsx`: Articles filtered by a specific tag.

## Integrations

### WordPress CMS

- **Host**: `discover.vtrading.app`
- **Service**: `src/services/WordPressService.ts`
- **Capabilities**:
  - Fetching posts with pagination and caching.
  - Category and Tag management.
  - Search functionality (debounced).
  - Relative time formatting (Spanish).
  - Author profile extraction (including social links).

### Deep Links & Routing

The module is fully integrated with React Navigation and handles both native schemes and web-alias URLs.

**Prefixes**:

- `vtrading://`
- `https://discover.vtrading.app`

**Routes**:

- `vtrading://discover`: Opens the main Discover feed.
- `vtrading://article/:slug`: Opens a specific article by its WordPress slug.
- `vtrading://categoria/:slug`: Shows articles in a specific category.
- `vtrading://tag/:slug`: Shows articles with a specific tag.
- `vtrading://buscar/:query?`: Opens search with an optional initial query.

## UI Components

- **ArticleCard**: Reusable component with 'compact' and 'featured' variants.
- **SectionHeader**: Consistent editorial headers with primary color accents.
- **ReadingProgressBar**: Scroll-synced progress indicator in the article detail.
- **AuthorCard**: Detailed contributor biography with social media links.

## Dynamic Dimensions

All components in this module use the `useWindowDimensions` hook for full responsiveness across different screen sizes and orientations.
