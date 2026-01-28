import React, { useState, useEffect } from 'react';
import { TextInput, useTheme } from 'react-native-paper';
import CustomDialog from '../ui/CustomDialog';
import { useToastStore } from '../../stores/toastStore';
import { observabilityService } from '../../services/ObservabilityService';

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
  const showToast = useToastStore((state) => state.showToast);
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
    } catch (e) {
      observabilityService.captureError(e);
      showToast('Error al guardar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomDialog
      visible={visible}
      onDismiss={onDismiss}
      title="Editar Perfil"
      onConfirm={handleSave}
      confirmLabel="Guardar"
      confirmLoading={loading}
      confirmDisabled={!name.trim()}
      cancelMode="outlined"
      fullWidthActions={true}
    >
      <TextInput
        label="Nombre de usuario"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={{ backgroundColor: theme.colors.surface, marginTop: 8 }}
        autoFocus
      />
    </CustomDialog>
  );
};

export default ProfileEditDialog;
