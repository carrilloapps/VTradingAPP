import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Tooltip } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAppTheme } from '../../theme/theme';
import { useToast } from '../../context/ToastContext';

interface BankRateCardProps {
  bankName: string;
  currencyCode: string;
  buyValue: string;
  sellValue: string;
  lastUpdated?: string;
  buyPercentage?: number;
  sellPercentage?: number;
}

const BankRateCard: React.FC<BankRateCardProps> = ({
  bankName,
  buyValue,
  sellValue,
  lastUpdated,
  buyPercentage,
  sellPercentage
}) => {
  const theme = useAppTheme();
  const { showToast } = useToast();

  // Helper to format date nicely
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('es-VE', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    }).replace(',', ' -');
  };

  const renderPercentage = (percent?: number) => {
      if (percent === undefined) return null;
      const isPositive = percent > 0;
      const isNeutral = percent === 0;
      const color = isNeutral ? theme.colors.outline : (isPositive ? theme.colors.primary : theme.colors.error); 
      
      return (
          <Tooltip title="Variación respecto a tasa BCV">
            <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => showToast('Variación porcentual respecto a la tasa del BCV', 'info')}
            >
                <View style={[styles.percentBadge, { 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    gap: 2,
                    backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' 
                }]}>
                    <Text variant="labelSmall" style={{ color: color, fontWeight: '700', fontSize: 10 }}>
                        {percent > 0 ? '+' : ''}{percent.toFixed(2)}%
                    </Text>
                    <MaterialIcons name="info-outline" size={10} color={color} style={{ opacity: 0.7 }} />
                </View>
            </TouchableOpacity>
          </Tooltip>
      );
  };

  return (
    <Surface
      elevation={0}
      style={[styles.card, {
        backgroundColor: theme.colors.elevation.level1,
        borderColor: theme.colors.outline,
        borderRadius: theme.roundness * 6,
      }]}
    >
      {/* Header Section: Icon, Name, Date */}
      <View style={styles.header}>
        <View style={styles.leftHeader}>
            <View style={[styles.iconContainer, { 
                backgroundColor: theme.dark ? 'rgba(80, 200, 120, 0.1)' : theme.colors.secondaryContainer 
            }]}>
                <MaterialIcons 
                    name="account-balance" 
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
            <View style={[styles.dateBadge, { backgroundColor: theme.colors.elevation.level2 }]}>
                <MaterialIcons name="schedule" size={12} color={theme.colors.onSurfaceVariant} style={{ marginRight: 4 }} />
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatDate(lastUpdated)}
                </Text>
            </View>
        )}
      </View>

      {/* Rates Section */}
      <View style={[styles.ratesContainer, { 
          backgroundColor: theme.dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          borderColor: theme.colors.outlineVariant
      }]}>
        {/* Compra */}
        <View style={styles.rateColumn}>
             <View style={styles.labelRow}>
                <Text variant="labelSmall" style={[styles.rateLabel, { color: theme.colors.secondary }]}>COMPRA</Text>
                {renderPercentage(buyPercentage)}
             </View>
             <View style={styles.valueWrapper}>
                <Text variant="titleLarge" style={[styles.rateValue, { color: theme.colors.onSurface }]}>
                    Bs. {buyValue.replace(' Bs', '')}
                </Text>
             </View>
        </View>

        {/* Divider */}
        <View style={[styles.verticalDivider, { backgroundColor: theme.colors.outlineVariant }]} />

        {/* Venta */}
        <View style={styles.rateColumn}>
             <View style={styles.labelRow}>
                <Text variant="labelSmall" style={[styles.rateLabel, { color: theme.colors.primary }]}>VENTA</Text>
                {renderPercentage(sellPercentage)}
             </View>
             <View style={styles.valueWrapper}>
                <Text variant="titleLarge" style={[styles.rateValue, { color: theme.colors.onSurface }]}>
                    Bs. {sellValue.replace(' Bs', '')}
                </Text>
             </View>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
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
  },
  valueWrapper: {
      flexDirection: 'row',
      alignItems: 'baseline',
  },
  rateValue: {
      fontWeight: '800',
      letterSpacing: -0.5,
  },
  currencySuffix: {
      marginLeft: 4,
      fontWeight: '600',
  }
});

export default BankRateCard;
