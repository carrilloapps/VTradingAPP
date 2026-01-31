import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Surface, Divider } from 'react-native-paper';
import { useAppTheme } from '../../theme/theme';
import Skeleton from '../ui/Skeleton';

interface ArticleSkeletonProps {
  variant?: 'compact' | 'featured' | 'detail';
}

const ArticleSkeleton = ({ variant = 'compact' }: ArticleSkeletonProps) => {
  const theme = useAppTheme();
  const isFeatured = variant === 'featured';
  const isDetail = variant === 'detail';

  if (isDetail) {
    return (
      <ScrollView
        style={[
          styles.detailContainer,
          { backgroundColor: theme.colors.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <Skeleton width="100%" height={350} borderRadius={0} />

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Category Badge */}
          <Skeleton
            width={80}
            height={24}
            borderRadius={12}
            style={styles.categoryBadge}
          />

          {/* Title */}
          <Skeleton width="95%" height={32} style={styles.titleLine1} />
          <Skeleton width="85%" height={32} style={styles.titleLine2} />

          {/* Metadata Row */}
          <View style={styles.metadataRow}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <View style={styles.metadataText}>
              <Skeleton width={120} height={14} style={styles.metadataItem} />
              <Skeleton
                width={180}
                height={12}
                style={styles.metadataSubItem}
              />
            </View>
          </View>

          {/* SEO Description / Summary */}
          <Surface
            style={[
              styles.summaryBox,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outline,
              },
            ]}
            elevation={0}
          >
            <Skeleton width="100%" height={14} style={styles.summaryLine} />
            <Skeleton width="95%" height={14} style={styles.summaryLine} />
            <Skeleton width="88%" height={14} />
          </Surface>

          {/* Article Content */}
          <View style={styles.articleBody}>
            <Skeleton width="100%" height={16} style={styles.contentLine} />
            <Skeleton width="98%" height={16} style={styles.contentLine} />
            <Skeleton width="92%" height={16} style={styles.contentLine} />
            <Skeleton width="96%" height={16} style={styles.contentLine} />
            <Skeleton width="100%" height={16} style={styles.contentLine} />
            <Skeleton width="94%" height={16} style={styles.contentLine} />
            <Skeleton width="89%" height={16} style={styles.contentLine} />
          </View>

          <Divider
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          {/* Tags Section */}
          <Skeleton width={60} height={20} style={styles.sectionTitle} />
          <View style={styles.tagsContainer}>
            <Skeleton
              width={70}
              height={32}
              borderRadius={16}
              style={styles.tag}
            />
            <Skeleton
              width={90}
              height={32}
              borderRadius={16}
              style={styles.tag}
            />
            <Skeleton
              width={80}
              height={32}
              borderRadius={16}
              style={styles.tag}
            />
          </View>

          <Divider
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          {/* Author Card */}
          <Surface
            style={[
              styles.authorCard,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
            elevation={0}
          >
            <View style={styles.authorHeader}>
              <Skeleton width={64} height={64} borderRadius={32} />
              <View style={styles.authorInfo}>
                <Skeleton width={120} height={18} style={styles.authorName} />
                <Skeleton width={80} height={14} />
              </View>
            </View>
            <Skeleton width="100%" height={14} style={styles.authorBioLine} />
            <Skeleton width="95%" height={14} style={styles.authorBioLine} />
            <Skeleton width="60%" height={14} />
            <View style={styles.socialRow}>
              <Skeleton
                width={36}
                height={36}
                borderRadius={18}
                style={styles.socialIcon}
              />
              <Skeleton
                width={36}
                height={36}
                borderRadius={18}
                style={styles.socialIcon}
              />
              <Skeleton
                width={36}
                height={36}
                borderRadius={18}
                style={styles.socialIcon}
              />
            </View>
          </Surface>

          <Divider
            style={[
              styles.divider,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          {/* Related Posts Section */}
          <Skeleton width={180} height={24} style={styles.sectionTitle} />
          <View style={styles.relatedGrid}>
            <ArticleSkeleton variant="compact" />
            <ArticleSkeleton variant="compact" />
          </View>
        </View>
      </ScrollView>
    );
  }

  const surfaceStyle = [
    styles.container,
    isFeatured ? styles.featuredContainer : styles.compactContainer,
    {
      backgroundColor: theme.colors.elevation.level1,
      borderColor: theme.colors.outlineVariant,
      borderWidth: 0.5,
    },
  ];

  return (
    <View style={[styles.touchable, isFeatured && styles.featuredTouchable]}>
      <Surface style={surfaceStyle} elevation={0}>
        {isFeatured && <Skeleton width="100%" height={200} borderRadius={0} />}

        <View
          style={[
            styles.content,
            isFeatured ? styles.featuredContent : styles.compactContent,
          ]}
        >
          <Skeleton width="30%" height={10} style={styles.skeletonCategory} />
          <Skeleton width="90%" height={18} style={styles.skeletonTitle} />
          <Skeleton width="70%" height={18} style={styles.skeletonSubtitle} />

          <View style={styles.footer}>
            <View style={styles.authorSection}>
              <Skeleton
                width={20}
                height={20}
                borderRadius={10}
                style={styles.skeletonAvatar}
              />
              <Skeleton width={60} height={10} />
            </View>
            <Skeleton width={40} height={10} />
          </View>
        </View>

        {!isFeatured && (
          <View style={styles.compactImage}>
            <Skeleton width={85} height={85} borderRadius={12} />
          </View>
        )}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  detailContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    marginTop: -20,
  },
  categoryBadge: {
    marginBottom: 12,
  },
  titleLine1: {
    marginBottom: 8,
  },
  titleLine2: {
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  metadataText: {
    flex: 1,
  },
  metadataItem: {
    marginBottom: 6,
  },
  metadataSubItem: {
    marginBottom: 0,
  },
  summaryBox: {
    padding: 20,
    paddingTop: 24,
    borderWidth: 1,
    marginBottom: 24,
    borderRadius: 12,
  },
  summaryLine: {
    marginBottom: 8,
  },
  articleBody: {
    marginBottom: 24,
  },
  contentLine: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 0,
  },
  tag: {
    marginRight: 0,
  },
  authorCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    marginBottom: 6,
  },
  authorBioLine: {
    marginBottom: 8,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  socialIcon: {
    marginRight: 0,
  },
  relatedGrid: {
    marginHorizontal: -20,
  },
  touchable: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  featuredTouchable: {
    marginBottom: 32,
  },
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  compactContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  featuredContainer: {
    flexDirection: 'column',
  },
  compactImage: {
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  compactContent: {
    justifyContent: 'center',
  },
  featuredContent: {
    padding: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonCategory: {
    marginBottom: 12,
  },
  skeletonTitle: {
    marginBottom: 8,
  },
  skeletonSubtitle: {
    marginBottom: 16,
  },
  skeletonAvatar: {
    marginRight: 8,
  },
});

export default React.memo(ArticleSkeleton);
