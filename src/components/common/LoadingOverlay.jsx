import { Backdrop, CircularProgress, Typography, Box } from "@mui/material";

export function LoadingOverlay({ open, message = "Loading system resources..." }) {
    return (
        <Backdrop
            sx={{
                color: "#6366f1",
                zIndex: (theme) => theme.zIndex.drawer + 9999,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                backgroundColor: "rgba(10, 15, 29, 0.8)",
                backdropFilter: "blur(4px)"
            }}
            open={open}
        >
            <CircularProgress color="inherit" size={50} thickness={4.5} />
            <Box textAlign="center">
                <Typography variant="h6" fontWeight="600" color="text.primary">
                    Please Wait
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {message}
                </Typography>
            </Box>
        </Backdrop>
    );
}

export default LoadingOverlay;
