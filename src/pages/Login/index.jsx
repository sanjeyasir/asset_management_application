import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Box,
    Typography,
    TextField,
    IconButton,
    InputAdornment,
    Alert,
    Paper,
    Divider
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

    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);


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

            navigate("/dashboard");


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


        </Box>


    );

}


export default Login;
