import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    Card,
    CardContent,
    Divider,
    Stack,
    CircularProgress,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip
} from "@mui/material";
import BadgeIcon from "@mui/icons-material/Badge";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import DevicesIcon from "@mui/icons-material/Devices";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import assetCategoryService from "../../services/assetCategoryService";

export function EmployeePortal() {
    const { currentUser, logout } = useAuth();
    const [assets, setAssets] = useState([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [categories, setCategories] = useState([]);

    // Fetch assigned assets if logged in
    useEffect(() => {
        if (currentUser && currentUser.uid) {
            const fetchAssets = async () => {
                setLoadingAssets(true);
                try {
                    const [assetSnap, catList] = await Promise.all([
                        getDocs(query(collection(db, "assets"), where("assignedEmployee", "==", currentUser.uid))),
                        assetCategoryService.getCategories()
                    ]);
                    const list = assetSnap.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setAssets(list);
                    setCategories(catList);
                } catch (err) {
                    console.error("Error loading employee assets:", err);
                } finally {
                    setLoadingAssets(false);
                }
            };
            fetchAssets();
        } else {
            setAssets([]);
        }
    }, [currentUser]);

    // 1. LOGIN SCREEN VIEW
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    // 2. LOGGED IN PORTAL VIEW
    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", pb: 6 }}>
            {/* Header / Nav */}
            <Box
                sx={{
                    bgcolor: "background.paper",
                    py: 2,
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}
            >
                <Container maxWidth="lg">
                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                        <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 2,
                                    bgcolor: "primary.main",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white"
                                }}
                            >
                                <BadgeIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: "bold", color: "text.primary" }}>
                                    Enterprise Portal
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Self Service & Asset Overview
                                </Typography>
                            </Box>
                        </Stack>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<LogoutIcon />}
                            onClick={logout}
                            sx={{ borderRadius: 2, textTransform: "none", fontWeight: "bold" }}
                        >
                            Sign Out
                        </Button>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Grid container spacing={4}>
                    {/* Column 1: Profile Details */}
                    <Grid item xs={12} md={4}>
                        <Card
                            elevation={0}
                            sx={{
                                border: "1px solid rgba(0,0,0,0.06)",
                                borderRadius: 4,
                                boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                            }}
                        >
                            <CardContent sx={{ p: 4 }}>
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
                                    <Avatar
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            bgcolor: "primary.light",
                                            fontSize: 32,
                                            fontWeight: "bold",
                                            mb: 2
                                        }}
                                    >
                                        {currentUser.firstName?.[0] || currentUser.fullName?.[0] || "?"}
                                    </Avatar>
                                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "text.primary" }}>
                                        {currentUser.fullName || `${currentUser.firstName || ""} ${currentUser.lastName || ""}`}
                                    </Typography>
                                    <Chip
                                        label={currentUser.role || "Employee"}
                                        color="primary"
                                        size="small"
                                        variant="outlined"
                                        sx={{ mt: 1, fontWeight: "bold" }}
                                    />
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Stack spacing={2}>
                                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                                        <PersonIcon sx={{ color: "text.secondary" }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Employee ID
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                {currentUser.employeeId}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                                        <EmailIcon sx={{ color: "text.secondary" }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Email Address
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                {currentUser.email}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                                        <PhoneIcon sx={{ color: "text.secondary" }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Phone Number
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                {currentUser.mobileNumber || "-"}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                                        <CalendarTodayIcon sx={{ color: "text.secondary" }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Joining Date
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                {currentUser.dateOfJoin || "-"}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Column 2: Allocated Assets */}
                    <Grid item xs={12} md={8}>
                        <Card
                            elevation={0}
                            sx={{
                                border: "1px solid rgba(0,0,0,0.06)",
                                borderRadius: 4,
                                boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
                                minHeight: 350
                            }}
                        >
                            <CardContent sx={{ p: 4 }}>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: "bold",
                                        color: "text.primary",
                                        mb: 3,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1
                                    }}
                                >
                                    <DevicesIcon color="primary" /> Assigned Assets ({assets.length})
                                </Typography>

                                {loadingAssets ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : assets.length === 0 ? (
                                    <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
                                        <DevicesIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                                        <Typography variant="body1">No assets currently assigned to you.</Typography>
                                    </Box>
                                ) : (
                                    <TableContainer component={Box} sx={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 2 }}>
                                        <Table>
                                            <TableHead sx={{ bgcolor: "#f8fafc" }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: "bold" }}>Asset Name</TableCell>
                                                    <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                                                    <TableCell sx={{ fontWeight: "bold" }}>Asset Tag</TableCell>
                                                    <TableCell sx={{ fontWeight: "bold" }}>Serial Number</TableCell>
                                                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {assets.map((asset) => (
                                                    <TableRow key={asset.id}>
                                                        <TableCell>{asset.assetName}</TableCell>
                                                        <TableCell>{categories.find(c => c.id === asset.category)?.name || asset.category || "-"}</TableCell>
                                                        <TableCell><code>{asset.assetTag}</code></TableCell>
                                                        <TableCell>{asset.serialNumber || "-"}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={asset.status || "Assigned"}
                                                                color={asset.status === "Faulty" ? "error" : "success"}
                                                                size="small"
                                                                sx={{ fontWeight: "bold" }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

export default EmployeePortal;
