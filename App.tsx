import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme/ThemeContext';
import { FilterProvider } from './src/context/FilterContext';
import AppNavigator from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <FilterProvider>
          <AppNavigator />
        </FilterProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
