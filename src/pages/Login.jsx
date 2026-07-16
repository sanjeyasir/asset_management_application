import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import {
    Button,
    TextField,
    Box,
    Grid,
    Typography,
    InputAdornment,
    IconButton,
    Alert,
    CircularProgress
} from "@mui/material";
import {
    Email,
    Lock,
    Visibility,
    VisibilityOff,
    BusinessCenter,
    TrendingUp,
    People,
    Security
} from "@mui/icons-material";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();

    const login = async (e) => {
        if (e) e.preventDefault();
        if (!email || !password) {
            setErrorMsg("Please fill in all fields.");
            return;
        }

        setLoading(true);
        setErrorMsg("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/dashboard");
        } catch (error) {
            let message = "Failed to sign in. Please check your credentials.";
            if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                message = "Invalid email or password.";
            } else if (error.code === "auth/invalid-email") {
                message = "Invalid email address format.";
            }
            setErrorMsg(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Grid container sx={{ minHeight: "100vh" }}>
            {/* Left Hero Panel - Hidden on mobile */}
            <Grid
                item
                xs={false}
                md={6}
                sx={{
                    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#ffffff",
                    p: 6,
                    position: "relative",
                    overflow: "hidden",
                    borderRight: "1px solid rgba(255, 255, 255, 0.05)"
                }}
            >
                {/* Decorative glowing backdrops */}
                <Box
                    sx={{
                        position: "absolute",
                        top: "10%",
                        left: "10%",
                        width: "300px",
                        height: "300px",
                        background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
                        filter: "blur(40px)"
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        bottom: "10%",
                        right: "10%",
                        width: "300px",
                        height: "300px",
                        background: "radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)",
                        filter: "blur(40px)"
                    }}
                />

                <Box sx={{ maxWidth: 480, zIndex: 1 }}>
                    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                        <Box
                            sx={{
                                background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                                borderRadius: "12px",
                                p: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 8px 16px rgba(99, 102, 241, 0.25)"
                            }}
                        >
                            <BusinessCenter fontSize="large" />
                        </Box>
                        <Typography variant="h4" fontWeight="800" letterSpacing="-0.5px">
                            CloudERP
                        </Typography>
                    </Box>

                    <Typography variant="h3" fontWeight="800" mb={2} lineHeight={1.2}>
                        Simplify Enterprise Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary" mb={5} sx={{ fontSize: "1.1rem" }}>
                        Manage employees, visualize analytics, track department performance, and scale operations globally with our secure cloud-based dashboard.
                    </Typography>

                    {/* Features list */}
                    <Box display="flex" flexDirection="column" gap={3}>
                        {[
                            {
                                icon: <People color="primary" />,
                                title: "Smart HR & Directory",
                                desc: "Manage detailed employee lifecycle profiles, records, and statuses in real-time."
                            },
                            {
                                icon: <TrendingUp color="secondary" />,
                                title: "Dynamic Workforce Analytics",
                                desc: "Track overall headcount growth, active ratios, and department breakdowns with clean charts."
                            },
                            {
                                icon: <Security sx={{ color: "#10b981" }} />,
                                title: "Enterprise-grade Security",
                                desc: "Secure authentication powered by Firebase to safeguard confidential corporate data."
                            }
                        ].map((feature, idx) => (
                            <Box key={idx} display="flex" gap={2}>
                                <Box
                                    sx={{
                                        background: "rgba(255, 255, 255, 0.03)",
                                        borderRadius: "10px",
                                        p: 1.2,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "1px solid rgba(255, 255, 255, 0.05)"
                                    }}
                                >
                                    {feature.icon}
                                </Box>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="600" color="#f3f4f6">
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {feature.desc}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Grid>

            {/* Right Form Panel */}
            <Grid
                item
                xs={12}
                md={6}
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    p: { xs: 3, sm: 6, md: 8 },
                    backgroundColor: "#0a0f1d"
                }}
            >
                <Box sx={{ width: "100%", maxWidth: 400 }}>
                    {/* Header - Visible on mobile logo */}
                    <Box display={{ xs: "flex", md: "none" }} alignItems="center" gap={1} mb={4} justifyContent="center">
                        <Box
                            sx={{
                                background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                                borderRadius: "8px",
                                p: 0.8,
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <BusinessCenter sx={{ color: "#fff", fontSize: 24 }} />
                        </Box>
                        <Typography variant="h5" fontWeight="800">
                            CloudERP
                        </Typography>
                    </Box>

                    <Typography variant="h4" fontWeight="800" mb={1} letterSpacing="-0.5px">
                        Welcome Back
                    </Typography>
                    <Typography variant="body1" color="text.secondary" mb={4}>
                        Enter your administrative credentials to log in.
                    </Typography>

                    {errorMsg && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>
                            {errorMsg}
                        </Alert>
                    )}

                    <form onSubmit={login}>
                        <TextField
                            fullWidth
                            label="Email Address"
                            margin="normal"
                            placeholder="admin@clouderp.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email color="action" />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            type="submit"
                            disabled={loading}
                            sx={{
                                mt: 3,
                                py: 1.5,
                                fontSize: "1rem"
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In to Console"}
                        </Button>
                    </form>

                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                        Authorized Access Only. Powered by CloudERP Platform.
                    </Typography>
                </Box>
            </Grid>
        </Grid>
    );
}

export default Login;