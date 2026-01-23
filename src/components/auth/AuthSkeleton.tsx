import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/theme';
import Skeleton from '../ui/Skeleton';

interface AuthSkeletonProps {
  mode: 'login' | 'register' | 'forgot-password';
  testID?: string;
}

const AuthSkeleton: React.FC<AuthSkeletonProps> = ({ mode, testID = 'auth-skeleton' }) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View testID={testID} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[
        styles.content, 
        { 
          paddingTop: insets.top + theme.spacing.m, 
          paddingBottom: insets.bottom + theme.spacing.xl,
          paddingHorizontal: theme.spacing.xl
        }
      ]}>
        
        {/* Header */}
          <View style={[styles.header, { marginBottom: mode === 'register' ? theme.spacing.l : theme.spacing.xl }]}>
          <View style={[styles.logoRow, { marginBottom: theme.spacing.s }]}>
            <Skeleton 
              width={mode === 'register' ? 60 : 80} 
              height={mode === 'register' ? 60 : 80} 
              borderRadius={40} 
            />
            <View style={[styles.badge, { marginLeft: theme.spacing.m, backgroundColor: theme.colors.elevation.level2 }]} />
          </View>
          
          <View style={styles.titleContainer}>
            <Skeleton 
              width={mode === 'register' ? 140 : 180} 
              height={mode === 'register' ? 28 : 32} 
              borderRadius={4} 
              style={{ marginBottom: theme.spacing.xs }} 
            />
            <Skeleton width={240} height={20} borderRadius={4} />
          </View>
        </View>

        {/* Form */}
        <View style={[styles.form, { gap: theme.spacing.xs }]}>
          <Skeleton width="100%" height={56} borderRadius={4} />
          
          {(mode === 'login' || mode === 'register') && (
            <Skeleton width="100%" height={56} borderRadius={4} />
          )}

          {mode === 'register' && (
             <Skeleton width="100%" height={56} borderRadius={4} />
          )}

          {mode === 'login' && (
            <View style={[styles.forgotPassword, { marginTop: -theme.spacing.xs, marginBottom: theme.spacing.m }]}>
               <Skeleton width={150} height={16} borderRadius={4} />
            </View>
          )}

          <Skeleton 
            width="100%" 
            height={48} 
            borderRadius={12} 
            style={[styles.button, { marginTop: mode === 'login' ? 0 : theme.spacing.m }]} 
          />

          {(mode === 'login' || mode === 'register') && (
            <>
              <View style={[styles.divider, { marginVertical: theme.spacing.m }]}>
                <Skeleton width="35%" height={1} />
                <Skeleton width={80} height={14} borderRadius={2} style={{ marginHorizontal: 10 }} />
                <Skeleton width="35%" height={1} />
              </View>
              <Skeleton width="100%" height={48} borderRadius={12} style={styles.button} />
            </>
          )}

          {mode === 'login' && (
             <Skeleton width="100%" height={48} borderRadius={12} style={[styles.button, { marginTop: theme.spacing.m }]} />
          )}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { marginTop: theme.spacing.xl }]}>
           <View style={styles.footerRow}>
             <Skeleton width={140} height={16} borderRadius={4} />
             <Skeleton width={80} height={16} borderRadius={4} style={{ marginLeft: theme.spacing.s }} />
           </View>
           <Skeleton width={240} height={12} borderRadius={4} style={{ marginTop: theme.spacing.m }} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    // paddingHorizontal and paddingVertical handled in component
  },
  header: {
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 45,
    height: 20,
    borderRadius: 4,
  },
  titleContainer: {
    alignItems: 'center',
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  button: {
    // marginBottom removed to use gap
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4, // Equivalent to theme.spacing.xs
  }
});

export default AuthSkeleton;
