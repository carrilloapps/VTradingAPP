import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface ThemeSelectorProps {
  currentTheme: 'light' | 'dark' | 'system';
  onSelect: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onSelect }) => {
  const theme = useTheme();

  const Option = ({ 
    mode, 
    label, 
    renderPreview 
  }: { 
    mode: 'light' | 'dark' | 'system'; 
    label: string;
    renderPreview: () => React.ReactNode;
  }) => {
    const isSelected = currentTheme === mode;
    const borderColor = isSelected ? theme.colors.primary : theme.colors.outline;
    const bg = isSelected ? theme.colors.primaryContainer : 'transparent';
    const borderWidth = isSelected ? 2 : 1;

    return (
      <TouchableOpacity 
        onPress={() => onSelect(mode)}
        style={[styles.optionBtn, { borderColor, backgroundColor: bg, borderWidth }]}
      >
        {renderPreview()}
        <Text style={[styles.label, { 
          color: isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant,
          fontWeight: isSelected ? '700' : '500'
        }]}>
          {label}
        </Text>
        {isSelected && (
          <View style={[styles.checkDot, { backgroundColor: theme.colors.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Light */}
      <Option 
        mode="light" 
        label="Claro" 
        renderPreview={() => (
          <View style={[styles.previewBox, { backgroundColor: '#f2f5f8', borderColor: '#E2E8F0' }]}>
             <View style={{ height: '100%', width: '100%', backgroundColor: '#ffffff', borderRadius: 2 }} />
          </View>
        )} 
      />

      {/* Dark */}
      <Option 
        mode="dark" 
        label="Oscuro" 
        renderPreview={() => (
          <View style={[styles.previewBox, { backgroundColor: '#0e1720', borderColor: '#243647' }]}>
            <View style={{ height: '100%', width: '100%', backgroundColor: '#16212e', borderRadius: 2 }} />
          </View>
        )} 
      />

      {/* System */}
      <Option 
        mode="system" 
        label="Sistema" 
        renderPreview={() => (
          <View style={[styles.previewBox, { borderColor: theme.colors.outline, overflow: 'hidden', flexDirection: 'row' }]}>
            <View style={{ flex: 1, backgroundColor: '#f2f5f8' }} />
            <View style={{ flex: 1, backgroundColor: '#0e1720' }} />
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
    height: 32,
    borderRadius: 4,
    borderWidth: 1,
    padding: 2,
  },
  label: {
    fontSize: 12,
  },
  checkDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  }
});

export default ThemeSelector;
