import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Avatar, Surface } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/theme';
import { FormattedComment } from '../../services/WordPressService';

interface CommentsListProps {
  comments: FormattedComment[];
  loading: boolean;
}

export const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  loading,
}) => {
  const theme = useAppTheme();

  if (loading) {
    const loadingTextStyle = [
      styles.loadingText,
      { color: theme.colors.onSurfaceVariant },
    ];

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodySmall" style={loadingTextStyle}>
          Cargando comentarios...
        </Text>
      </View>
    );
  }

  if (comments.length === 0) {
    const emptyBoxStyle = [
      styles.emptyCommentsBox,
      { backgroundColor: theme.colors.elevation.level1 },
    ];

    const emptyTitleStyle = [
      styles.emptyTitle,
      { color: theme.colors.onSurfaceVariant },
    ];

    const emptySubtitleStyle = [
      styles.emptySubtitle,
      { color: theme.colors.outline },
    ];

    return (
      <Surface style={emptyBoxStyle} elevation={0}>
        <MaterialCommunityIcons
          name="comment-outline"
          size={48}
          color={theme.colors.outline}
        />
        <Text variant="bodyMedium" style={emptyTitleStyle}>
          No hay comentarios aún
        </Text>
        <Text variant="bodySmall" style={emptySubtitleStyle}>
          Sé el primero en comentar
        </Text>
      </Surface>
    );
  }

  return (
    <>
      {comments.map(comment => {
        const itemStyle = [
          styles.commentItem,
          comment.isReply && styles.replyItem,
        ];

        return (
          <View key={comment.id} style={itemStyle}>
            <Avatar.Image size={32} source={{ uri: comment.avatar }} />
            <View style={styles.commentContent}>
              <View style={styles.commentHeader}>
                <Text
                  style={[styles.authorName, { color: theme.colors.onSurface }]}
                >
                  {comment.author}
                </Text>
                <Text
                  style={[styles.commentDate, { color: theme.colors.outline }]}
                >
                  {comment.date}
                </Text>
              </View>
              <Text
                style={[
                  styles.commentBody,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {comment.content}
              </Text>
            </View>
          </View>
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
  },
  emptyCommentsBox: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  emptyTitle: {
    marginTop: 8,
  },
  emptySubtitle: {
    marginTop: 4,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  replyItem: {
    marginLeft: 40,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontWeight: 'bold',
  },
  commentDate: {
    fontSize: 12,
    marginLeft: 8,
  },
  commentBody: {
    fontSize: 14,
  },
});
