import React, { useRef } from 'react';
import { View, StyleSheet, Image, Animated, Share, StatusBar, useWindowDimensions } from 'react-native';
import { Text, Surface, IconButton, Chip, Divider, Avatar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useAppTheme } from '../theme/theme';

// --- Mock Content (Simulating Headless WP JSON) ---
const MOCK_ARTICLE = {
  id: '1',
  title: 'El Futuro de las Finanzas Descentralizadas: Tendencias para 2026',
  excerpt: 'Exploramos cómo la IA y la regulación están moldeando la próxima generación de DeFi.',
  featuredImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1000&auto=format&fit=crop',
  author: {
    name: 'Elena Rostova',
    role: 'Analista Senior',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop'
  },
  date: '26 Ene, 2026',
  readTime: '8 min lectura',
  category: 'Cripto',
  tags: ['DeFi', 'Ethereum', 'Regulación', 'Web3'],
  seoDescription: 'Análisis profundo sobre el impacto de la inteligencia artificial en los protocolos DeFi y qué esperar para el mercado cripto en 2026.',
  content: [
    { type: 'paragraph', text: 'El ecosistema de las finanzas descentralizadas (DeFi) ha recorrido un largo camino desde el "DeFi Summer" de 2020. Hoy, nos encontramos ante una nueva era caracterizada por la madurez institucional y la integración de tecnologías avanzadas.' },
    { type: 'heading', text: 'La Convergencia con la IA' },
    { type: 'paragraph', text: 'Una de las tendencias más disruptivas es el uso de agentes autónomos impulsados por IA para optimizar el rendimiento del farming y la gestión de liquidez. Estos "Bots Inteligentes" son capaces de rebalancear portafolios en milisegundos ante cambios de volatilidad.' },
    { type: 'quote', text: 'La verdadera revolución no es solo financiera, es algorítmica. La IA será el principal usuario de los protocolos DeFi en la próxima década.', author: 'Satoshi Nakamoto (Simulado)' },
    { type: 'paragraph', text: 'Sin embargo, esto plantea nuevos desafíos de seguridad. Los contratos inteligentes ahora deben ser auditados no solo por lógica de código, sino por comportamiento ante agentes adversarios de IA.' },
    { type: 'image', url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop', caption: 'Visualización de redes neuronales aplicadas a trading.' },
    { type: 'heading', text: 'Regulación: El Elefante en la Habitación' },
    { type: 'paragraph', text: 'A medida que los grandes fondos de inversión entran en juego, la claridad regulatoria se vuelve indispensable. Se espera que 2026 sea el año donde veamos los primeros marcos globales unificados para activos digitales, permitiendo la tokenización de activos del mundo real (RWA) a escala masiva.' },
    { type: 'list', items: ['Tokenización de Bienes Raíces', 'Bonos del Tesoro on-chain', 'Identidad Soberana (DID)'] },
    { type: 'paragraph', text: 'En conclusión, aunque el camino es volátil, la dirección es clara: hacia una infraestructura financiera más abierta, eficiente y transparente.' }
  ]
};

// --- Renderers ---

const BlockParagraph = ({ text, theme }: any) => (
    <Text variant="bodyLarge" style={[styles.paragraph, { color: theme.colors.onSurface }]}>{text}</Text>
);

const BlockHeading = ({ text, theme }: any) => (
    <Text variant="titleLarge" style={[styles.heading, { color: theme.colors.primary }]}>{text}</Text>
);

const BlockQuote = ({ text, author, theme }: any) => (
    <View style={[styles.quoteContainer, { borderLeftColor: theme.colors.primary, backgroundColor: theme.colors.elevation.level2 }]}>
        <MaterialCommunityIcons name="format-quote-open" size={32} color={theme.colors.primary} style={styles.quoteIcon} />
        <Text style={[styles.quoteText, { color: theme.colors.onSurface }]}>{text}</Text>
        {author && <Text style={[styles.quoteAuthor, { color: theme.colors.outline }]}>— {author}</Text>}
    </View>
);

const BlockImage = ({ url, caption, theme }: any) => (
    <View style={styles.imageBlock}>
        <Image 
          source={{ uri: url }} 
          style={styles.contentImage} 
          accessibilityRole="image"
          accessibilityLabel={caption || 'Imagen del artículo'}
        />
        {caption && <Text style={[styles.imageCaption, { color: theme.colors.outline }]}>{caption}</Text>}
    </View>
);

const BlockList = ({ items, theme }: any) => (
    <View style={styles.listBlock}>
        {items.map((item: string, index: number) => (
            <View key={index} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.listItemText, { color: theme.colors.onSurface }]}>{item}</Text>
            </View>
        ))}
    </View>
);

const ArticleDetailScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Safe width calculation for centered title
  // We have more buttons on the right (2) than left (1).
  // To keep text truly centered, we must respect the wider side (Right ~110px).
  // Max width = ScreenWidth - (110px * 2) = ScreenWidth - 220px.
  const maxTitleWidth = width - 220;
  
  // Use passed params merged with mock fallback to ensure all fields exist (like author, content)
  const incomingArticle = (route.params as any)?.article;
  const article = {
      ...MOCK_ARTICLE, 
      ...incomingArticle, 
      author: {
          ...MOCK_ARTICLE.author,
          ...(incomingArticle?.author || {})
      }
  };

  const scrollY = useRef(new Animated.Value(0)).current;

  const handleShare = async () => {
      try {
          await Share.share({
              message: `${article.title} - Lee más en VTradingAPP`
          });
      } catch (error) {
          console.log(error);
      }
  };

  const renderBlock = (block: any, index: number) => {
      switch (block.type) {
          case 'paragraph': return <BlockParagraph key={index} text={block.text} theme={theme} />;
          case 'heading': return <BlockHeading key={index} text={block.text} theme={theme} />;
          case 'quote': return <BlockQuote key={index} text={block.text} author={block.author} theme={theme} />;
          case 'image': return <BlockImage key={index} url={block.url} caption={block.caption} theme={theme} />;
          case 'list': return <BlockList key={index} items={block.items} theme={theme} />;
          default: return null;
      }
  };

  const headerOpacity = scrollY.interpolate({
      inputRange: [0, 200],
      outputRange: [0, 1],
      extrapolate: 'clamp'
  });

  // Buttons opacity: Inverse of header (optional, but nice to keep them distinct)
  // Actually standard pattern is buttons stay, bg fades in. 
  // We will keep buttons always visible but add a background to them for contrast.

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        
        {/* Sticky Header Background (Fades In) */}
        <Animated.View style={[styles.headerBar, { 
            height: 56 + insets.top,
            backgroundColor: theme.colors.background,
            opacity: headerOpacity,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.outlineVariant
        }]} />

        {/* Header Content (Title fades in, Buttons always visible) */}
        <View style={[styles.headerOverlay, { top: insets.top, height: 56 }]}>
            
            {/* Left Button */}
            <View style={styles.leftButtonContainer}>
                <Surface style={[styles.roundButton, { backgroundColor: theme.colors.background }]} elevation={2}>
                    <IconButton 
                        icon="arrow-left" 
                        iconColor={theme.colors.onSurface}
                        size={24}
                        onPress={() => navigation.goBack()}
                        style={{ margin: 0 }}
                        accessibilityLabel="Regresar"
                        accessibilityHint="Volver a la pantalla anterior"
                        accessibilityRole="button"
                    />
                </Surface>
            </View>

            {/* Centered Title (Fades In) */}
            <Animated.View style={[styles.titleContainer, { opacity: headerOpacity, maxWidth: maxTitleWidth }]}>
                <Text 
                    variant="titleMedium" 
                    numberOfLines={1} 
                    style={{ 
                        textAlign: 'center', 
                        fontWeight: 'bold',
                        color: theme.colors.onBackground
                    }}
                >
                    {article.title}
                </Text>
            </Animated.View>

            {/* Right Buttons */}
            <View style={styles.rightButtonsContainer}>
                <Surface style={[styles.roundButton, { backgroundColor: theme.colors.background, marginRight: 8 }]} elevation={2}>
                    <IconButton 
                        icon="bookmark-outline" 
                        iconColor={theme.colors.onSurface}
                        size={24}
                        onPress={() => {}}
                        style={{ margin: 0 }}
                        accessibilityLabel="Guardar artículo"
                        accessibilityHint="Guarda este artículo en tus marcadores"
                        accessibilityRole="button"
                    />
                </Surface>
                <Surface style={[styles.roundButton, { backgroundColor: theme.colors.background }]} elevation={2}>
                    <IconButton 
                        icon="share-variant" 
                        iconColor={theme.colors.onSurface}
                        size={24}
                        onPress={handleShare}
                        style={{ margin: 0 }}
                        accessibilityLabel="Compartir artículo"
                        accessibilityHint="Comparte este artículo con otras aplicaciones"
                        accessibilityRole="button"
                    />
                </Surface>
            </View>
        </View>

        <Animated.ScrollView 
            onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
            {/* Hero Image */}
            <View style={styles.heroContainer}>
                <Image source={{ uri: article.featuredImage }} style={styles.heroImage} />
                <LinearGradient 
                    colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']} 
                    style={styles.heroGradient}
                >
                    <Chip style={styles.categoryChip} textStyle={{ color: 'white', fontWeight: 'bold' }}>{article.category}</Chip>
                </LinearGradient>
            </View>

            <View style={styles.contentContainer}>
                <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>{article.title}</Text>
                
                {/* Author Meta */}
                <View style={styles.metaContainer}>
                    <Avatar.Image size={40} source={{ uri: article.author.avatar }} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text variant="labelLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{article.author.name}</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{article.author.role} • {article.date}</Text>
                    </View>
                    <Text variant="bodySmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{article.readTime}</Text>
                </View>

                <Divider style={{ marginVertical: 24, backgroundColor: theme.colors.outlineVariant }} />

                {/* Simulated WP Content */}
                <View style={styles.articleBody}>
                    {article.content.map((block: any, idx: number) => renderBlock(block, idx))}
                </View>

                <Divider style={{ marginVertical: 32, backgroundColor: theme.colors.outlineVariant }} />

                {/* SEO/Tags */}
                <Text variant="titleSmall" style={{ marginBottom: 12, fontWeight: 'bold' }}>Tópicos Relacionados</Text>
                <View style={styles.tagsContainer}>
                    {article.tags.map((tag: string, idx: number) => (
                        <Chip key={idx} style={styles.tagChip} textStyle={{ fontSize: 12 }} mode="outlined">{tag}</Chip>
                    ))}
                </View>

                {/* SEO Description Box */}
                <Surface style={[styles.seoBox, { backgroundColor: theme.colors.elevation.level1 }]} elevation={0}>
                    <Text variant="labelSmall" style={{ color: theme.colors.primary, marginBottom: 4, fontWeight: 'bold' }}>RESUMEN SEO</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{article.seoDescription}</Text>
                </Surface>

                <Divider style={{ marginVertical: 32, backgroundColor: theme.colors.outlineVariant }} />

                {/* Comments Section */}
                <View style={styles.commentsSection}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 16, color: theme.colors.onSurface }}>Comentarios (3)</Text>
                    
                    {/* Comment Input */}
                    <View style={styles.commentInputRow}>
                        <Avatar.Text 
                            size={32} 
                            label="YO" 
                            style={{ backgroundColor: theme.colors.secondaryContainer }} 
                            accessibilityLabel="Tu avatar"
                        />
                        <Surface 
                            style={[styles.commentInput, { backgroundColor: theme.colors.surfaceVariant }]} 
                            elevation={0}
                            accessibilityRole="button"
                            accessibilityLabel="Escribir un comentario"
                            accessibilityHint="Abre el teclado para escribir un comentario"
                        >
                            <Text style={{ color: theme.colors.outline }}>Escribe un comentario...</Text>
                        </Surface>
                    </View>

                    {/* Mock Comments */}
                    <View style={styles.commentItem}>
                        <Avatar.Image size={32} source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} />
                        <View style={styles.commentContent}>
                            <View style={styles.commentHeader}>
                                <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>Carlos M.</Text>
                                <Text style={{ fontSize: 12, color: theme.colors.outline, marginLeft: 8 }}>Hace 10 min</Text>
                            </View>
                            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 14 }}>Excelente análisis sobre DeFi. La regulación será clave.</Text>
                        </View>
                    </View>

                    <View style={styles.commentItem}>
                        <Avatar.Image size={32} source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }} />
                        <View style={styles.commentContent}>
                            <View style={styles.commentHeader}>
                                <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>Ana Trading</Text>
                                <Text style={{ fontSize: 12, color: theme.colors.outline, marginLeft: 8 }}>Hace 1h</Text>
                            </View>
                            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 14 }}>¿Qué opinan sobre el impacto en las DAOs?</Text>
                        </View>
                    </View>
                </View>

            </View>
        </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 10,
  },
  headerOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      pointerEvents: 'box-none',
  },
  roundButton: {
      borderRadius: 20,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
  },
  leftButtonContainer: {
      zIndex: 25,
  },
  rightButtonsContainer: {
      flexDirection: 'row',
      zIndex: 25,
      gap: 8,
  },
  titleContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 15,
      height: '100%',
      pointerEvents: 'none',
  },
  heroContainer: {
      height: 350,
      width: '100%',
      position: 'relative',
  },
  heroImage: {
      width: '100%',
      height: '100%',
  },
  heroGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 180,
      justifyContent: 'flex-end',
      padding: 24,
      paddingBottom: 40,
  },
  categoryChip: {
      alignSelf: 'flex-start',
      backgroundColor: '#EF4444',
      height: 28,
  },
  contentContainer: {
      padding: 24,
      marginTop: -20,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: 'transparent',
  },
  title: {
      fontWeight: 'bold',
      lineHeight: 32,
      marginBottom: 20,
  },
  metaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  articleBody: {
      gap: 16,
  },
  paragraph: {
      lineHeight: 26,
      fontSize: 16,
      marginBottom: 8,
  },
  heading: {
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
  },
  quoteContainer: {
      padding: 20,
      borderLeftWidth: 4,
      borderRadius: 8,
      marginVertical: 16,
  },
  quoteIcon: {
      marginBottom: 8,
      opacity: 0.8, // Increased opacity for visibility
  },
  quoteText: {
      fontStyle: 'italic',
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '500',
  },
  quoteAuthor: {
      marginTop: 12,
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'right',
  },
  imageBlock: {
      marginVertical: 16,
  },
  contentImage: {
      width: '100%',
      height: 220,
      borderRadius: 12,
      marginBottom: 8,
  },
  imageCaption: {
      fontSize: 12,
      textAlign: 'center',
      fontStyle: 'italic',
  },
  listBlock: {
      paddingLeft: 8,
      gap: 8,
  },
  listItem: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 12,
  },
  listItemText: {
      fontSize: 16,
      lineHeight: 24,
  },
  tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 32,
  },
  tagChip: {
      height: 32,
  },
  seoBox: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
  },
  commentsSection: {
      marginTop: 8,
  },
  commentInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      gap: 12,
  },
  commentInput: {
      flex: 1,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      paddingHorizontal: 16,
  },
  commentItem: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 12,
  },
  commentContent: {
      flex: 1,
  },
  commentHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 4,
  },
});

export default ArticleDetailScreen;
