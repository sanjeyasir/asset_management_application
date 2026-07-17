import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    Box,
    Typography,
    TextField,
    IconButton,
    InputAdornment,
    Alert,
    Paper,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material";

import {
    Email,
    Lock,
    Visibility,
    VisibilityOff,
    Inventory2
} from "@mui/icons-material";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import AppButton from "../../components/common/AppButton";
import authService from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";


const schema = yup.object({
    email: yup.string()
        .email("Enter a valid email")
        .required("Email is required"),

    password: yup.string()
        .min(6, "Minimum 6 characters")
        .required("Password is required")
});


function Login() {

    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();

    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState("");

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        if (!forgotEmail) {
            setForgotError("Email address is required.");
            return;
        }
        setForgotLoading(true);
        setForgotError("");
        try {
            await authService.submitResetRequest(forgotEmail);
            showNotification("Password reset request submitted to Administrator.", "success");
            setForgotOpen(false);
            setForgotEmail("");
        } catch (err) {
            setForgotError(err.message || "Failed to submit request.");
        } finally {
            setForgotLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            if (currentUser.isFirstLogin) {
                navigate("/reset-password");
            } else {
                navigate("/dashboard");
            }
        }
    }, [currentUser, navigate]);


    const {
        control,
        handleSubmit,
        formState: { errors }
    } = useForm({

        resolver: yupResolver(schema),

        defaultValues: {
            email: "",
            password: ""
        }

    });



    const submit = async (data) => {

        try {

            setLoading(true);
            setErrorMsg("");

            await authService.login(
                data.email,
                data.password
            );


        } catch (err) {

            setErrorMsg(
                "Invalid email or password"
            );

        }
        finally {

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

                background:
                    "linear-gradient(135deg,#eef2ff,#f8fafc)",

                px: 2

            }}

        >


            <Paper

                elevation={0}

                sx={{

                    width: "100%",

                    maxWidth: 430,

                    p: 5,

                    borderRadius: 5,

                    border:
                        "1px solid rgba(0,0,0,0.06)",

                    boxShadow:
                        "0 20px 50px rgba(15,23,42,0.08)"

                }}

            >


                {/* Header */}

                <Box



                    mb={4}

                >




                    <Typography

                        variant="h5"

                        fontWeight={800}

                    >

                        Asset Management Portal

                    </Typography>


                    <Typography

                        color="text.secondary"

                        variant="body2"

                        mt={0.5}

                        style={{ padding: '10px' }}

                    >

                        Sign in to your workspace

                    </Typography>


                </Box>




                {
                    errorMsg &&

                    <Alert

                        severity="error"

                        sx={{

                            mb: 3,

                            borderRadius: 2

                        }}

                    >

                        {errorMsg}

                    </Alert>

                }




                <Box

                    component="form"

                    onSubmit={
                        handleSubmit(submit)
                    }

                >



                    <Controller

                        name="email"

                        control={control}

                        render={({ field }) => (

                            <TextField

                                {...field}

                                fullWidth

                                label="Email"

                                error={
                                    !!errors.email
                                }

                                helperText={
                                    errors.email?.message
                                }

                                sx={{
                                    mb: 2
                                }}

                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email fontSize="small" />
                                            </InputAdornment>
                                        )
                                    }
                                }}

                            />

                        )}

                    />





                    <Controller

                        name="password"

                        control={control}

                        render={({ field }) => (

                            <TextField

                                {...field}

                                fullWidth

                                label="Password"

                                type={
                                    showPassword
                                        ?
                                        "text"
                                        :
                                        "password"
                                }

                                error={
                                    !!errors.password
                                }

                                helperText={
                                    errors.password?.message
                                }


                                sx={{
                                    mb: 3
                                }}


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

                        Sign In

                    </AppButton>

                    <Box display="flex" justifyContent="flex-end" sx={{ mt: 1.5 }}>
                        <IconButton
                            onClick={() => {
                                setForgotError("");
                                setForgotEmail("");
                                setForgotOpen(true);
                            }}
                            sx={{
                                fontSize: "0.85rem",
                                color: "primary.main",
                                borderRadius: 1.5,
                                p: 0.5,
                                fontWeight: 600,
                                "&:hover": { bgcolor: "rgba(99, 102, 241, 0.08)" }
                            }}
                        >
                            Forgot Password?
                        </IconButton>
                    </Box>

                </Box>




                <Divider sx={{ my: 4 }} />


                <Typography

                    align="center"

                    display="block"

                    variant="caption"

                    color="text.secondary"

                >

                    © {new Date().getFullYear()} Cloud EAM

                </Typography>



            </Paper>

            <Dialog
                open={forgotOpen}
                onClose={() => !forgotLoading && setForgotOpen(false)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <Box component="form" onSubmit={handleForgotSubmit}>
                    <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Request Password Reset</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Enter your registered email address. Your administrator will be notified to review and reset your password.
                        </Typography>
                        {forgotError && <Alert severity="error" sx={{ borderRadius: 2 }}>{forgotError}</Alert>}
                        <TextField
                            fullWidth
                            size="small"
                            label="Email Address"
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            disabled={forgotLoading}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                        <AppButton
                            variant="outlined"
                            color="inherit"
                            onClick={() => setForgotOpen(false)}
                            disabled={forgotLoading}
                        >
                            Cancel
                        </AppButton>
                        <AppButton
                            type="submit"
                            loading={forgotLoading}
                        >
                            Submit Request
                        </AppButton>
                    </DialogActions>
                </Box>
            </Dialog>

        </Box>


    );

}


export default Login;
