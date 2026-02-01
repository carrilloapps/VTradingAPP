import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';

import { useAppTheme } from '@/theme';
import ArticleSkeleton from '@/components/discover/ArticleSkeleton';

const ArticleDetailSkeleton = () => {
  const theme = useAppTheme();

  const containerStyle = [styles.container, { backgroundColor: theme.colors.background }];

  return (
    <View style={containerStyle}>
      <StatusBar
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />
      <ArticleSkeleton variant="detail" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ArticleDetailSkeleton;
