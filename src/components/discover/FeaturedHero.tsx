import React from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/theme';
import { FormattedPost } from '../../services/WordPressService';
import FastImage from 'react-native-fast-image';

interface FeaturedHeroProps {
  item: FormattedPost;
}

const FeaturedHero = ({ item }: FeaturedHeroProps) => {
  const theme = useAppTheme();
  const navigation = useNavigation<any>();

  const handlePress = () => {
    if (item) {
      navigation.navigate('ArticleDetail', { article: item });
    }
  };

  // Get tag for display - use first tag or category
  const displayTag =
    item.tags && item.tags.length > 0
      ? item.tags[0].name
      : item.categories && item.categories.length > 0
        ? item.categories[0].name
        : 'Destacado';

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <View style={styles.heroContainer}>
        <Surface
          style={[
            styles.heroCard,
            {
              borderRadius: theme.roundness * 5,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
          elevation={0}
        >
          <ImageBackground
            source={{ uri: item.image }}
            style={styles.heroBackground}
            imageStyle={[
              styles.heroImage,
              { borderRadius: theme.roundness * 5 },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.95)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <Surface
                  style={[
                    styles.heroTag,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  elevation={0}
                >
                  <Text style={styles.heroTagText}>{displayTag}</Text>
                </Surface>

                <Text variant="headlineSmall" style={styles.heroTitle}>
                  {item.title}
                </Text>

                <View style={styles.heroFooter}>
                  {item.author?.avatar && (
                    <FastImage
                      source={{ uri: item.author.avatar }}
                      style={styles.authorAvatar}
                    />
                  )}
                  <Text style={styles.heroMeta}>
                    {item.author?.name || item.source}
                  </Text>
                  <View style={styles.dotSeparator} />
                  <Text style={styles.heroMeta}>{item.time}</Text>
                  <View style={styles.dotSeparator} />
                  <Text
                    style={[
                      styles.readTime,
                      { color: theme.colors.primaryContainer },
                    ]}
                  >
                    {item.readTime}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </Surface>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  heroCard: {
    height: 260,
    overflow: 'hidden',
    borderWidth: 1,
  },
  heroImage: {},
  heroBackground: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroContent: {
    gap: 8,
  },
  heroTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 4,
  },
  heroTagText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 11,
  },
  heroTitle: {
    color: 'white',
    fontWeight: '800',
    lineHeight: 28,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  heroMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    fontSize: 12,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 8,
  },
  authorAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
  },
  readTime: {
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default React.memo(FeaturedHero);
