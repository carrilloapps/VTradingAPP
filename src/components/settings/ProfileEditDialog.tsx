import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Dialog, Portal, TextInput, useTheme } from 'react-native-paper';

interface ProfileEditDialogProps {
  visible: boolean;
  onDismiss: () => void;
  currentName: string;
  onSave: (newName: string) => Promise<void>;
}

const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({
  visible,
  onDismiss,
  currentName,
  onSave,
}) => {
  const theme = useTheme();
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(currentName);
  }, [currentName, visible]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave(name);
      onDismiss();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={onDismiss}
        style={{ 
          backgroundColor: theme.colors.elevation.level3,
          borderRadius: 28,
        }}
      >
        <Dialog.Title style={{ textAlign: 'center' }}>Editar Perfil</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Nombre de usuario"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={{ backgroundColor: theme.colors.surface }}
            autoFocus
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} textColor={theme.colors.onSurfaceVariant}>Cancelar</Button>
          <Button 
            onPress={handleSave} 
            loading={loading}
            disabled={loading || !name.trim()}
          >
            Guardar
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ProfileEditDialog;
