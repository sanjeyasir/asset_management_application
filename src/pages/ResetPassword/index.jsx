import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    TextField,
    IconButton,
    InputAdornment,
    Alert,
    Paper
} from "@mui/material";
import { Lock, Visibility, VisibilityOff, LockReset } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import AppButton from "../../components/common/AppButton";
import authService from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";

const schema = yup.object({
    password: yup.string()
        .min(6, "Minimum 6 characters")
        .required("New password is required"),
    confirmPassword: yup.string()
        .oneOf([yup.ref("password"), null], "Passwords must match")
        .required("Confirm password is required")
});

function ResetPassword() {
    const navigate = useNavigate();
    const { currentUser, completeFirstLogin } = useAuth();
    const { showNotification } = useNotification();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            password: "",
            confirmPassword: ""
        }
    });

    const submit = async (data) => {
        try {
            setLoading(true);
            setErrorMsg("");
            
            await authService.changePasswordOnFirstLogin(currentUser, data.password);
            
            showNotification(
                "Password updated successfully! Welcome to your dashboard.",
                "success"
            );
            
            completeFirstLogin();
            navigate("/dashboard");
        } catch (err) {
            console.error("Password reset error:", err);
            setErrorMsg(
                err.message || "Failed to reset password. Please try again."
            );
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
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    maxWidth: 450,
                    p: 5,
                    borderRadius: 5,
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 20px 50px rgba(15,23,42,0.08)"
                }}
            >
                <Box mb={4} textAlign="center">
                    <Box
                        sx={{
                            width: 60,
                            height: 60,
                            borderRadius: "50%",
                            backgroundColor: "primary.light",
                            color: "primary.contrastText",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 16px auto",
                            boxShadow: "0 8px 16px rgba(99, 102, 241, 0.2)"
                        }}
                    >
                        <LockReset sx={{ fontSize: 32 }} />
                    </Box>
                    <Typography variant="h5" fontWeight={800}>
                        Setup New Password
                    </Typography>
                    <Typography
                        color="text.secondary"
                        variant="body2"
                        mt={1}
                        sx={{ maxWidth: 300, margin: "8px auto 0 auto" }}
                    >
                        This is your first login. Please choose a strong new password to secure your account.
                    </Typography>
                </Box>

                {errorMsg && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            borderRadius: 2
                        }}
                    >
                        {errorMsg}
                    </Alert>
                )}

                <Box
                    component="form"
                    onSubmit={handleSubmit(submit)}
                >
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="New Password"
                                type={showPassword ? "text" : "password"}
                                error={!!errors.password}
                                helperText={errors.password?.message}
                                sx={{ mb: 2 }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock fontSize="small" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />
                        )}
                    />

                    <Controller
                        name="confirmPassword"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                fullWidth
                                label="Confirm Password"
                                type={showConfirmPassword ? "text" : "password"}
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword?.message}
                                sx={{ mb: 3 }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock fontSize="small" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    edge="end"
                                                >
                                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />
                        )}
                    />

                    <AppButton
                        fullWidth
                        type="submit"
                        loading={loading}
                        sx={{
                            height: 48,
                            fontSize: "1rem",
                            borderRadius: 3
                        }}
                    >
                        Update Password & Continue
                    </AppButton>
                </Box>
            </Paper>
        </Box>
    );
}

export default ResetPassword;
