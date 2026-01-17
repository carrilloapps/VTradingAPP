# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-01-17

### Added
- Added descriptive title "Calculadora de Divisas" to the Calculator component.

### Changed
- **UI/UX Improvements in Currency Calculator**:
    - Corrected hierarchy by removing redundant inner card in `CurrencyConverter`.
    - Improved contrast for text elements (inputs, rates, icons) to meet WCAG 4.5:1 standards by switching from `onSurfaceVariant` to `onSurface`.
    - Added accessibility labels to interactive elements for better screen reader support.
    - Cleaned up layout styles in `CurrencyConverter.tsx` to align with Material Design guidelines.
