import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Tooltip, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/theme';
import { useToastStore } from '../../stores/toastStore';
import { BolivarIcon } from '../ui/BolivarIcon';

interface BankRateCardProps {
  bankName: string;
  currencyCode: string;
  buyValue: string;
  sellValue: string;
  lastUpdated?: string;
  buyPercentage?: number;
  sellPercentage?: number;
  onPress?: () => void;
}

const BankRateCard: React.FC<BankRateCardProps> = ({
  bankName,
  buyValue,
  sellValue,
  lastUpdated,
  buyPercentage,
  sellPercentage,
  onPress,
}) => {
  const theme = useAppTheme();
  const showToast = useToastStore(state => state.showToast);

  // Helper to format date nicely
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date
      .toLocaleString('es-VE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      .replace(',', ' -');
  };

  const renderPercentage = (percent?: number) => {
    if (percent === undefined) return null;
    const isPositive = percent > 0;
    const isNeutral = percent === 0;
    const color = isNeutral
      ? theme.colors.outline
      : isPositive
        ? theme.colors.primary
        : theme.colors.error;

    const badgeStyle = [
      styles.percentBadge,
      {
        backgroundColor: theme.dark
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(0,0,0,0.05)',
      },
    ];
    const labelStyle = [styles.percentLabel, { color: color }];

    return (
      <Tooltip title="Variación respecto a tasa BCV">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            showToast('Variación porcentual respecto a la tasa del BCV', 'info')
          }
        >
          <View style={badgeStyle}>
            <Text variant="labelSmall" style={labelStyle}>
              {percent > 0 ? '+' : ''}
              {percent.toFixed(2)}%
            </Text>
            <MaterialCommunityIcons
              name="information-outline"
              size={10}
              color={color}
              style={styles.infoIcon}
            />
          </View>
        </TouchableOpacity>
      </Tooltip>
    );
  };

  const getTrendIconName = (percent?: number) => {
    if (percent === undefined || percent === 0) return 'minus-circle-outline';
    return percent > 0
      ? 'arrow-up-circle-outline'
      : 'arrow-down-circle-outline';
  };

  const rippleStyle = [styles.ripple, { borderRadius: theme.roundness * 6 }];
  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.elevation.level1,
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness * 6,
    },
  ];
  const iconContainerStyle = [
    styles.iconContainer,
    {
      backgroundColor: theme.dark
        ? 'rgba(80, 200, 120, 0.1)'
        : theme.colors.secondaryContainer,
    },
  ];
  const ratesContainerStyle = [
    styles.ratesContainer,
    {
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.02)'
        : 'rgba(0,0,0,0.02)',
      borderColor: theme.colors.outlineVariant,
    },
  ];
  const dividerStyle = [
    styles.verticalDivider,
    { backgroundColor: theme.colors.outlineVariant },
  ];

  return (
    <TouchableRipple onPress={onPress} style={rippleStyle} borderless>
      <Surface elevation={0} style={cardStyle}>
        {/* Header Section: Icon, Name, Date */}
        <View style={styles.header}>
          <View style={styles.leftHeader}>
            <View style={iconContainerStyle}>
              <MaterialCommunityIcons
                name="bank"
                size={20}
                color={theme.dark ? '#50C878' : theme.colors.secondary}
              />
            </View>
            <Text
              variant="titleMedium"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.bankName, { color: theme.colors.onSurface }]}
            >
              {bankName}
            </Text>
          </View>

          {lastUpdated && (
            <View
              style={[
                styles.dateBadge,
                { backgroundColor: theme.colors.elevation.level2 },
              ]}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={12}
                color={theme.colors.onSurfaceVariant}
                style={styles.clockIcon}
              />
              <Text
                variant="labelSmall"
                style={[
                  styles.dateLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {formatDate(lastUpdated)}
              </Text>
            </View>
          )}
        </View>

        {/* Rates Section */}
        <View style={ratesContainerStyle}>
          {/* Compra */}
          <View style={styles.rateColumn}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons
                name={getTrendIconName(buyPercentage)}
                size={16}
                color={theme.colors.secondary}
              />
              <Text
                variant="labelSmall"
                style={[styles.rateLabel, { color: theme.colors.secondary }]}
              >
                COMPRA
              </Text>
              {renderPercentage(buyPercentage)}
            </View>
            <View style={styles.valueWrapper}>
              <Text
                variant="titleLarge"
                style={[styles.rateValue, { color: theme.colors.onSurface }]}
              >
                {buyValue.replace(' Bs', '')}
              </Text>
              <BolivarIcon
                size={16}
                color={theme.colors.onSurface}
                style={styles.currencyIcon}
              />
            </View>
          </View>

          {/* Divider */}
          <View style={dividerStyle} />

          {/* Venta */}
          <View style={styles.rateColumn}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons
                name={getTrendIconName(sellPercentage)}
                size={16}
                color={theme.colors.primary}
              />
              <Text
                variant="labelSmall"
                style={[styles.rateLabel, { color: theme.colors.primary }]}
              >
                VENTA
              </Text>
              {renderPercentage(sellPercentage)}
            </View>
            <View style={styles.valueWrapper}>
              <Text
                variant="titleLarge"
                style={[styles.rateValue, { color: theme.colors.onSurface }]}
              >
                {sellValue.replace(' Bs', '')}
              </Text>
              <BolivarIcon
                size={16}
                color={theme.colors.onSurface}
                style={styles.currencyIcon}
              />
            </View>
          </View>
        </View>
      </Surface>
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  card: {
    // marginBottom: 12, // Moved to TouchableRipple
    borderWidth: 1,
    overflow: 'hidden', // Ensures inner container rounding respects card
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bankName: {
    fontWeight: 'bold',
    flexShrink: 1,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  ratesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  rateColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  rateLabel: {
    fontWeight: '700',
    letterSpacing: 0.8,
    opacity: 0.8,
  },
  percentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  percentLabel: {
    fontWeight: '700',
    fontSize: 10,
  },
  infoIcon: {
    opacity: 0.7,
  },
  ripple: {
    marginBottom: 12,
  },
  currencyIcon: {
    marginLeft: 4,
  },
  valueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rateValue: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  currencySuffix: {
    marginLeft: 4,
    fontWeight: '600',
  },
  clockIcon: {
    marginRight: 4,
  },
  dateLabel: {
    fontSize: 10,
  },
});

export default BankRateCard;
