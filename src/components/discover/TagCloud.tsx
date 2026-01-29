import React from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface TagCloudProps {
  tags: string[];
  onTagPress: (tag: string) => void;
}

const TagCloud: React.FC<TagCloudProps> = ({ tags, onTagPress }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {tags.map((tag, index) => (
        <Pressable
          key={`${tag}-${index}`}
          onPress={() => onTagPress(tag)}
          style={({ pressed }) => [
            styles.tag,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.outline + '20',
            },
            pressed && { backgroundColor: theme.colors.elevation.level3 },
          ]}
        >
          <Text
            variant="bodyMedium"
            style={[styles.tagText, { color: theme.colors.onSurface }]}
          >
            {tag}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontWeight: '500',
  },
});

export default TagCloud;
