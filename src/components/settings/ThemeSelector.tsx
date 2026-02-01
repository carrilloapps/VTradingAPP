import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';

import { useAppTheme, LightTheme, DarkTheme } from '@/theme';

interface ThemeSelectorProps {
  currentTheme: 'light' | 'dark' | 'system';
  onSelect: (theme: 'light' | 'dark' | 'system') => void;
  disabled?: boolean;
}

interface ThemeOptionProps {
  mode: 'light' | 'dark' | 'system';
  label: string;
  renderPreview: () => React.ReactNode;
  currentTheme: 'light' | 'dark' | 'system';
  onSelect: (theme: 'light' | 'dark' | 'system') => void;
  disabled?: boolean;
}

const ThemeOption: React.FC<ThemeOptionProps> = ({
  mode,
  label,
  renderPreview,
  currentTheme,
  onSelect,
  disabled,
}) => {
  const theme = useAppTheme();
  const isSelected = currentTheme === mode;
  const borderColor = isSelected ? theme.colors.primary : theme.colors.outline;
  const bg = isSelected ? theme.colors.primaryContainer : 'transparent';
  const borderWidth = isSelected ? 2 : 1;

  return (
    <TouchableOpacity
      onPress={() => onSelect(mode)}
      disabled={disabled}
      style={[
        styles.optionBtn,
        {
          borderColor,
          backgroundColor: bg,
          borderWidth,
        },
        disabled && styles.disabledOpacity,
      ]}
    >
      {renderPreview()}
      <Text
        style={[
          styles.label,
          {
            color: isSelected
              ? theme.colors.primary
              : theme.colors.onSurfaceVariant,
          },
          isSelected && styles.selectedLabel,
        ]}
      >
        {label}
      </Text>
      {isSelected && (
        <View
          style={[styles.checkDot, { backgroundColor: theme.colors.primary }]}
        />
      )}
    </TouchableOpacity>
  );
};

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelect,
  disabled,
}) => {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      {/* Light */}
      <ThemeOption
        mode="light"
        label="Claro"
        currentTheme={currentTheme}
        onSelect={onSelect}
        disabled={disabled}
        renderPreview={() => (
          <View style={[styles.previewBox, styles.lightPreview]}>
            <View style={styles.lightPreviewInner} />
          </View>
        )}
      />

      {/* Dark */}
      <ThemeOption
        mode="dark"
        label="Oscuro"
        currentTheme={currentTheme}
        onSelect={onSelect}
        disabled={disabled}
        renderPreview={() => (
          <View style={[styles.previewBox, styles.darkPreview]}>
            <View style={styles.darkPreviewInner} />
          </View>
        )}
      />

      {/* System */}
      <ThemeOption
        mode="system"
        label="Sistema"
        currentTheme={currentTheme}
        onSelect={onSelect}
        disabled={disabled}
        renderPreview={() => (
          <View
            style={[
              styles.previewBox,
              styles.systemPreview,
              { borderColor: theme.colors.outline },
            ]}
          >
            <View style={styles.systemLeft} />
            <View style={styles.systemRight} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  optionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 8,
    position: 'relative',
  },
  previewBox: {
    width: '100%',
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    padding: 2,
    marginBottom: 8,
  },
  lightPreview: {
    backgroundColor: LightTheme.colors.background,
    borderColor: LightTheme.colors.outline,
  },
  lightPreviewInner: {
    height: '100%',
    width: '100%',
    backgroundColor: LightTheme.colors.elevation.level2,
    borderRadius: 2,
  },
  darkPreview: {
    backgroundColor: DarkTheme.colors.background,
    borderColor: DarkTheme.colors.outline,
  },
  darkPreviewInner: {
    height: '100%',
    width: '100%',
    backgroundColor: DarkTheme.colors.elevation.level2,
    borderRadius: 2,
  },
  systemPreview: {
    overflow: 'hidden',
    flexDirection: 'row',
  },
  systemLeft: {
    flex: 1,
    backgroundColor: LightTheme.colors.background,
  },
  systemRight: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedLabel: {
    fontWeight: '700',
  },
  checkDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  disabledOpacity: {
    opacity: 0.6,
  },
});

export default ThemeSelector;
