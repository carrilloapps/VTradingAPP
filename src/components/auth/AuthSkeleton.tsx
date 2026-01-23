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
      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        
        {/* Header */}
        <View style={styles.header}>
          {mode === 'login' && (
            <View style={styles.logoContainer}>
              <Skeleton width={70} height={45} borderRadius={8} />
            </View>
          )}
          <View style={styles.titleContainer}>
            <Skeleton width={200} height={32} borderRadius={4} style={{ marginBottom: 8 }} />
            <Skeleton width={260} height={20} borderRadius={4} />
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Skeleton width="100%" height={56} borderRadius={4} style={styles.input} />
          
          {(mode === 'login' || mode === 'register') && (
            <Skeleton width="100%" height={56} borderRadius={4} style={styles.input} />
          )}

          {mode === 'register' && (
             <Skeleton width="100%" height={56} borderRadius={4} style={styles.input} />
          )}

          {mode === 'login' && (
            <View style={styles.forgotPassword}>
               <Skeleton width={150} height={16} borderRadius={4} />
            </View>
          )}

          <Skeleton width="100%" height={48} borderRadius={24} style={styles.button} />

          {(mode === 'login' || mode === 'register') && (
            <>
              <View style={styles.divider}>
                <Skeleton width="40%" height={1} />
                <Skeleton width={20} height={10} borderRadius={2} style={{ marginHorizontal: 10 }} />
                <Skeleton width="40%" height={1} />
              </View>
              <Skeleton width="100%" height={48} borderRadius={24} style={styles.button} />
            </>
          )}

          {mode === 'login' && (
             <Skeleton width="100%" height={40} borderRadius={20} style={[styles.button, { marginTop: 10 }]} />
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
           <Skeleton width={200} height={16} borderRadius={4} />
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
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 12,
  },
  titleContainer: {
    alignItems: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  button: {
    marginBottom: 15,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
});

export default AuthSkeleton;
