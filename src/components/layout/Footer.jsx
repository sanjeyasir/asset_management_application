import { Box, Typography, Divider } from "@mui/material";

export function Footer() {
    return (
        <Box 
            component="footer" 
            sx={{ 
                py: 2, 
                px: 3, 
                mt: "auto", 
                borderTop: "1px solid", 
                borderColor: "divider",
                textAlign: "center",
                backgroundColor: (theme) => theme.palette.mode === "dark" ? "#0a0f1d" : "#f8fafc"
            }}
        >
            <Divider sx={{ mb: 2, opacity: 0.5 }} />
            <Typography variant="caption" color="text.secondary" display="block">
                &copy; {new Date().getFullYear()} Cloud EAM (Enterprise Asset Management). All rights reserved.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", mt: 0.5, display: "block" }}>
                System Version: v1.0.0-production | Connected to Firestore DB (test-erp)
            </Typography>
        </Box>
    );
}

export default Footer;
