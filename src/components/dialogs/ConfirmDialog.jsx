import AppDialog from "../common/AppDialog";
import AppButton from "../common/AppButton";

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to perform this action?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmColor = "primary",
    loading = false
}) {
    const actions = (
        <>
            <AppButton onClick={onClose} variant="outlined" color="inherit" disabled={loading}>
                {cancelText}
            </AppButton>
            <AppButton onClick={onConfirm} color={confirmColor} loading={loading}>
                {confirmText}
            </AppButton>
        </>
    );

    return (
        <AppDialog open={open} onClose={onClose} title={title} actions={actions}>
            {message}
        </AppDialog>
    );
}

export default ConfirmDialog;
