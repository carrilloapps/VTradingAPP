# Copilot Instructions for VTradingAPP

## Overview
VTradingAPP is a React Native application designed for trading and financial operations. The project is structured as a multi-platform app with Android and iOS support, leveraging TypeScript for type safety and modular architecture for scalability.

## Project Structure
- **`src/`**: Contains the main application code.
  - **`components/`**: Reusable UI components, organized by feature (e.g., `dashboard`, `settings`).
  - **`context/`**: Context providers for state management (e.g., `AuthContext`, `FilterContext`).
  - **`services/`**: Service modules for API interactions and business logic (e.g., `CurrencyService`, `ApiClient`).
  - **`screens/`**: Screen components for different app views (e.g., `HomeScreen`, `SettingsScreen`).
  - **`theme/`**: Theme-related files, including `theme.ts` and `ThemeContext.tsx`.
  - **`utils/`**: Utility functions (e.g., `CalculatorEngine`).
  - **`assets/`**: Static assets like animations and images.
- **`android/`** and **`ios/`**: Platform-specific configurations and native code.
- **`__tests__/`**: Unit and integration tests, organized by feature or module.
- **`docs/`**: Documentation files for various implementation details and guides.

## Key Workflows

### Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm start
   ```
3. Run the app on a device or emulator:
   ```bash
   npm run android
   npm run ios
   ```

### Testing
- Run all tests:
  ```bash
  npm test
  ```
- Run tests with coverage:
  ```bash
  npm run test:coverage
  ```
- Test files are located in the `__tests__/` directory, mirroring the structure of the `src/` folder.

### Building
- Build the Android app:
  ```bash
  cd android && ./gradlew assembleRelease
  ```
- Build the iOS app:
  ```bash
  cd ios && xcodebuild -workspace VTradingAPP.xcworkspace -scheme VTradingAPP -configuration Release
  ```

## Project-Specific Conventions
- **TypeScript**: Strong typing is enforced. Avoid using `any` unless absolutely necessary.
- **Component Structure**: Components are organized by feature. Each feature folder contains related components, styles, and tests.
- **State Management**: Context API is used for global state management. Refer to `src/context/` for examples.
- **Theming**: Centralized theming is implemented in `src/theme/`. Use `ThemeContext` and `theme.ts` for consistent styling.
- **Testing**: Follow the TDD approach. Each component or module should have a corresponding test file in the `__tests__/` directory.

## External Dependencies
- **Firebase**: Integrated for app services. Configuration files are located in `android/app/google-services.json` and `ios/`.
- **MMKV**: Used for efficient key-value storage. Refer to `REPORT_MIGRATION_MMKV.md` for migration details.
- **React Navigation**: Used for navigation. Main navigator is defined in `src/navigation/AppNavigator.tsx`.

## Integration Points
- **API Client**: All API calls are managed through `src/services/ApiClient.ts`. Use this module for network requests.
- **Currency Service**: Handles currency-related operations. See `src/services/CurrencyService.ts`.
- **Authentication**: Managed via `AuthContext` in `src/context/AuthContext.tsx`.

## Notes for AI Agents
- Follow the existing folder structure and naming conventions.
- Prioritize reusability and modularity in components and services.
- Always write tests for new features or changes and ensure 100% coverage.
- Refer to the `docs/` folder for detailed implementation guides.
- Use the `theme.ts` file for consistent styling across components.
- Ensure cross-platform compatibility for any new features or changes.

For any questions or clarifications, refer to the `README.md` or the documentation in the `docs/` folder.