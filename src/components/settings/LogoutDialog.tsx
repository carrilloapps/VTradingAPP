import React from 'react';
import CustomDialog from '../ui/CustomDialog';

interface LogoutDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}

const LogoutDialog = ({ visible, onDismiss, onConfirm }: LogoutDialogProps) => {
  return (
    <CustomDialog
      visible={visible}
      onDismiss={onDismiss}
      title="Cerrar sesión"
      content="¿Estás seguro de que deseas cerrar tu sesión? Tendrás que ingresar tus credenciales nuevamente para acceder."
      onConfirm={onConfirm}
      confirmLabel="Cerrar sesión"
      cancelLabel="Cancelar"
      isDestructive={true}
      cancelMode="outlined"
      fullWidthActions={true}
    />
  );
};

export default LogoutDialog;
