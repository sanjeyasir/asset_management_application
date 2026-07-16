import { Button, CircularProgress } from "@mui/material";

export function AppButton({
    children,
    loading = false,
    disabled = false,
    variant = "contained",
    color = "primary",
    startIcon,
    ...props
}) {
    return (
        <Button
            variant={variant}
            color={color}
            disabled={disabled || loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
            {...props}
        >
            {children}
        </Button>
    );
}

export default AppButton;
