import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TouchableRipple, Icon } from 'react-native-paper';

import { useAppTheme } from '@/theme';

interface SectionHeaderProps {
  title: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  paddingHorizontal?: number;
  variant?: 'primary' | 'secondary';
  center?: boolean;
  hideAccent?: boolean;
}

const SectionHeader = ({
  title,
  showViewAll,
  onViewAll,
  paddingHorizontal = 16,
  variant = 'primary',
  center = false,
  hideAccent = false,
}: SectionHeaderProps) => {
  const theme = useAppTheme();

  const containerStyle = [styles.listHeader, { paddingHorizontal }, center && styles.justifyCenter];

  const accentStyle = [styles.accent, { backgroundColor: theme.colors.primary }];

  const titleStyle = [
    styles.sectionTitle,
    variant === 'primary' ? styles.primaryText : styles.secondaryText,
    {
      color: variant === 'primary' ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
      textAlign: (center ? 'center' : 'left') as 'center' | 'left' | 'right' | 'justify',
    },
    center && styles.flex1,
  ];

  const actionTextStyle = [styles.actionText, { color: theme.colors.primary }];

  return (
    <View style={containerStyle}>
      <View style={styles.titleWrapper}>
        {variant === 'primary' && !center && !hideAccent && <View style={accentStyle} />}
        <Text variant={variant === 'primary' ? 'headlineSmall' : 'labelMedium'} style={titleStyle}>
          {title}
        </Text>
      </View>

      {showViewAll && (
        <TouchableRipple onPress={onViewAll} borderless style={styles.ripple}>
          <View style={styles.actionRow}>
            <Text variant="labelLarge" style={actionTextStyle}>
              Ver todo
            </Text>
            <Icon source="chevron-right" size={20} color={theme.colors.primary} />
          </View>
        </TouchableRipple>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  sectionTitle: {
    fontWeight: '900',
  },
  primaryText: {
    letterSpacing: -0.75,
  },
  secondaryText: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.7,
  },
  flex1: {
    flex: 1,
  },
  ripple: {
    borderRadius: 12,
  },
  actionText: {
    fontWeight: '700',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    marginRight: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingLeft: 8,
  },
});

export default React.memo(SectionHeader);
