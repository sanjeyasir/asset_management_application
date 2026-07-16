import AppDialog from "../common/AppDialog";
import AppButton from "../common/AppButton";
import { Box, Typography } from "@mui/material";
import { WarningAmber } from "@mui/icons-material";

export function DeleteDialog({
    open,
    onClose,
    onConfirm,
    title = "Delete Record",
    message = "Are you sure you want to permanently delete this record? This action cannot be undone.",
    confirmText = "Delete",
    cancelText = "Cancel",
    loading = false
}) {
    const actions = (
        <>
            <AppButton onClick={onClose} variant="outlined" color="inherit" disabled={loading}>
                {cancelText}
            </AppButton>
            <AppButton onClick={onConfirm} color="error" loading={loading}>
                {confirmText}
            </AppButton>
        </>
    );

    return (
        <AppDialog open={open} onClose={onClose} title={title} actions={actions} maxWidth="xs">
            <Box display="flex" gap={2} alignItems="flex-start">
                <WarningAmber color="error" sx={{ fontSize: 32 }} />
                <Typography variant="body1">
                    {message}
                </Typography>
            </Box>
        </AppDialog>
    );
}

export default DeleteDialog;
