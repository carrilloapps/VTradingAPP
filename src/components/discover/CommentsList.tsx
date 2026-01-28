import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Avatar, Surface, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/theme';
import { FormattedComment } from '../../services/WordPressService';

interface CommentsListProps {
  comments: FormattedComment[];
  loading: boolean;
}

export const CommentsList: React.FC<CommentsListProps> = ({ comments, loading }) => {
  const theme = useAppTheme();

  if (loading) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
          Cargando comentarios...
        </Text>
      </View>
    );
  }

  if (comments.length === 0) {
    return (
      <Surface style={[styles.emptyCommentsBox, { backgroundColor: theme.colors.elevation.level1 }]} elevation={0}>
        <MaterialCommunityIcons name="comment-outline" size={48} color={theme.colors.outline} />
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          No hay comentarios aún
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 4 }}>
          Sé el primero en comentar
        </Text>
      </Surface>
    );
  }

  return (
    <>
      {comments.map((comment) => (
        <View key={comment.id} style={[styles.commentItem, comment.isReply && { marginLeft: 40 }]}>
          <Avatar.Image size={32} source={{ uri: comment.avatar }} />
          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <Text style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{comment.author}</Text>
              <Text style={{ fontSize: 12, color: theme.colors.outline, marginLeft: 8 }}>{comment.date}</Text>
            </View>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 14 }}>{comment.content}</Text>
          </View>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  emptyCommentsBox: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
});
