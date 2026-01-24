import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SearchBar from '../src/components/ui/SearchBar';

// Mock MaterialCommunityIcons to avoid rendering issues in tests
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

describe('SearchBar', () => {
  it('renders correctly with placeholder', () => {
    const { getByPlaceholderText } = render(<SearchBar placeholder="Test placeholder" />);
    expect(getByPlaceholderText('Test placeholder')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const mockOnChange = jest.fn();
    const { getByPlaceholderText } = render(
      <SearchBar onChangeText={mockOnChange} />
    );

    fireEvent.changeText(getByPlaceholderText('Buscar moneda o token...'), 'test');
    expect(mockOnChange).toHaveBeenCalledWith('test');
  });

  it('calls onFilterPress when filter button is pressed', () => {
    const mockOnFilter = jest.fn();
    const { getByLabelText } = render(
      <SearchBar onFilterPress={mockOnFilter} />
    );

    fireEvent.press(getByLabelText('Filtros'));
    expect(mockOnFilter).toHaveBeenCalled();
  });

  it('renders suggestions when provided and focused', () => {
    const suggestions = ['Suggestion 1', 'Suggestion 2'];
    const mockOnSuggestionPress = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <SearchBar 
        value="Sug" 
        suggestions={suggestions} 
        onSuggestionPress={mockOnSuggestionPress}
      />
    );

    // Focus input to show suggestions
    fireEvent(getByPlaceholderText('Buscar moneda o token...'), 'focus');

    expect(getByText('Suggestion 1')).toBeTruthy();
    expect(getByText('Suggestion 2')).toBeTruthy();
  });

  it('calls onSuggestionPress when suggestion is pressed', () => {
    const suggestions = ['Suggestion 1'];
    const mockOnSuggestionPress = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <SearchBar 
        value="Sug" 
        suggestions={suggestions} 
        onSuggestionPress={mockOnSuggestionPress}
      />
    );

    fireEvent(getByPlaceholderText('Buscar moneda o token...'), 'focus');
    fireEvent.press(getByText('Suggestion 1'));

    expect(mockOnSuggestionPress).toHaveBeenCalledWith('Suggestion 1');
  });

  it('has correct accessibility attributes', () => {
    const { getByLabelText } = render(<SearchBar />);
    const input = getByLabelText('Campo de búsqueda');
    
    expect(input.props.accessibilityRole).toBe('search');
    expect(input.props.accessibilityHint).toBe('Introduce texto para buscar');
  });
});
