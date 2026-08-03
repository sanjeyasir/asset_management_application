import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    CircularProgress
} from "@mui/material";
import BadgeIcon from "@mui/icons-material/Badge";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export function EmployeeLogin() {
    const { currentUser, loginWithEmployeeId } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [empIdInput, setEmpIdInput] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            if (currentUser.role === "Admin" || currentUser.role === "Manager") {
                navigate("/dashboard");
            } else {
                navigate("/employee");
            }
        }
    }, [currentUser, navigate]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (!empIdInput.trim()) return;

        setLoading(true);
        setLoginError("");
        try {
            await loginWithEmployeeId(empIdInput.trim());
            showNotification("Logged in successfully.", "success");
        } catch (err) {
            console.error(err);
            setLoginError(err.message || "Invalid Employee ID.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
                px: 2
            }}
        >
            <Container maxWidth="xs">
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        borderRadius: 4,
                        bgcolor: "background.paper",
                        border: "1px solid rgba(0,0,0,0.06)",
                        textAlign: "center",
                        boxShadow: "0 20px 50px rgba(15,23,42,0.08)"
                    }}
                >
                    <Box
                        sx={{
                            display: "inline-flex",
                            p: 1.5,
                            borderRadius: 3,
                            bgcolor: "rgba(99, 102, 241, 0.08)",
                            color: "primary.main",
                            mb: 2
                        }}
                    >
                        <BadgeIcon sx={{ fontSize: 40 }} />
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1, color: "text.primary" }}>
                        Employee Portal
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
                        Enter your Employee ID to access your profile & allocated assets.
                    </Typography>

                    {loginError && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                            {loginError}
                        </Alert>
                    )}

                    <form onSubmit={handleLoginSubmit}>
                        <TextField
                            label="Employee ID"
                            placeholder="e.g. EMP-0001"
                            variant="outlined"
                            fullWidth
                            value={empIdInput}
                            onChange={(e) => setEmpIdInput(e.target.value)}
                            margin="normal"
                            required
                            autoFocus
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={loading}
                            sx={{
                                mt: 3,
                                py: 1.5,
                                fontWeight: "bold",
                                fontSize: "1rem",
                                borderRadius: 3,
                                textTransform: "none"
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
                        </Button>
                    </form>

                    <Button
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate("/admin/login")}
                        sx={{
                            mt: 3,
                            color: "text.secondary",
                            fontSize: "0.85rem",
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": {
                                color: "primary.main",
                                bgcolor: "rgba(99, 102, 241, 0.04)"
                            }
                        }}
                    >
                        Go to Administrative Portal
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
}

export default EmployeeLogin;
