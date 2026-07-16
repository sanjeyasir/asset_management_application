import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Typography, Box } from "@mui/material";
import { Close } from "@mui/icons-material";

export function AppDialog({
    open,
    onClose,
    title,
    children,
    actions,
    maxWidth = "sm",
    fullWidth = true,
    ...props
}) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
            {...props}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6" fontWeight="700">
                    {title}
                </Typography>
                {onClose && (
                    <IconButton onClick={onClose} aria-label="close" size="small">
                        <Close />
                    </IconButton>
                )}
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
                {children}
            </DialogContent>
            {actions && (
                <DialogActions sx={{ px: 3, py: 2 }}>
                    {actions}
                </DialogActions>
            )}
        </Dialog>
    );
}

export default AppDialog;
