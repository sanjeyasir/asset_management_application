import { useEffect, useState } from "react";
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Avatar,
    Button,
    TextField,
    Chip,
    Divider,
    InputAdornment,
    useTheme
} from "@mui/material";
import {
    People,
    Business,
    CheckCircle,
    PersonAdd,
    Search,
    TrendingUp,
    BusinessCenter,
    CalendarToday
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell
} from "recharts";

function Dashboard() {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        departments: 0
    });
    const navigate = useNavigate();
    const theme = useTheme();

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            const snapshot = await getDocs(collection(db, "employees"));
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setEmployees(data);

            setStats({
                total: data.length,
                active: data.filter(e => e.status === "Active").length,
                departments: new Set(data.map(e => e.department).filter(Boolean)).size
            });
        } catch (error) {
            console.error("Failed to load employees:", error);
        }
    };

    // Calculate charts data dynamically
    const getDeptChartData = () => {
        if (employees.length === 0) {
            // Mock data for beautiful empty state representation
            return [
                { name: "Engineering", headcount: 12 },
                { name: "Marketing", headcount: 5 },
                { name: "Sales", headcount: 8 },
                { name: "Finance", headcount: 3 },
                { name: "HR", headcount: 4 }
            ];
        }
        const depts = {};
        employees.forEach(emp => {
            const dept = emp.department || "Other";
            depts[dept] = (depts[dept] || 0) + 1;
        });
        return Object.keys(depts).map(key => ({
            name: key,
            headcount: depts[key]
        }));
    };

    const getStatusChartData = () => {
        if (employees.length === 0) {
            return [
                { name: "Active", value: 25 },
                { name: "Inactive", value: 7 }
            ];
        }
        const activeCount = employees.filter(e => e.status === "Active").length;
        const inactiveCount = employees.length - activeCount;
        return [
            { name: "Active", value: activeCount },
            { name: "Inactive", value: inactiveCount }
        ];
    };

    const COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];
    const STATUS_COLORS = ["#10b981", "#6b7280"]; // Active (emerald), Inactive (gray)

    const columns = [
        {
            field: "employee",
            headerName: "Employee",
            flex: 1.5,
            renderCell: (params) => {
                const name = `${params.row.firstName || ""} ${params.row.lastName || ""}`;
                const initials = `${params.row.firstName?.[0] || ""}${params.row.lastName?.[0] || ""}`.toUpperCase();
                return (
                    <Box display="flex" alignItems="center" gap={2} sx={{ py: 1 }}>
                        <Avatar
                            sx={{
                                width: 38,
                                height: 38,
                                bgcolor: "rgba(99, 102, 241, 0.1)",
                                color: "#818cf8",
                                border: "1px solid rgba(99, 102, 241, 0.2)",
                                fontSize: "0.9rem",
                                fontWeight: "bold"
                            }}
                        >
                            {initials || <People fontSize="small" />}
                        </Avatar>
                        <Box display="flex" flexDirection="column">
                            <Typography variant="body1" fontWeight="600" color="text.primary">
                                {name || "Unnamed Employee"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {params.row.email || "no-email@clouderp.com"}
                            </Typography>
                        </Box>
                    </Box>
                );
            }
        },
        {
            field: "designation",
            headerName: "Designation",
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" color="text.primary" sx={{ py: 2 }}>
                    {params.value || "N/A"}
                </Typography>
            )
        },
        {
            field: "department",
            headerName: "Department",
            flex: 1,
            renderCell: (params) => (
                <Chip
                    label={params.value || "General"}
                    size="small"
                    sx={{
                        bgcolor: "rgba(6, 182, 212, 0.08)",
                        color: "#22d3ee",
                        border: "1px solid rgba(6, 182, 212, 0.15)",
                        fontWeight: 500
                    }}
                />
            )
        },
        {
            field: "status",
            headerName: "Status",
            flex: 0.8,
            renderCell: (params) => {
                const isActive = params.value === "Active";
                return (
                    <Chip
                        label={params.value || "Inactive"}
                        size="small"
                        sx={{
                            bgcolor: isActive ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                            color: isActive ? "#34d399" : "#f87171",
                            border: isActive ? "1px solid rgba(16, 185, 129, 0.15)" : "1px solid rgba(239, 68, 68, 0.15)",
                            fontWeight: 600
                        }}
                    />
                );
            }
        }
    ];

    const filteredEmployees = employees.filter(emp =>
        `${emp.firstName || ""} ${emp.lastName || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const currentDate = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    return (
        <Box
            sx={{
                width: "100%",
                overflowX: "hidden",
                p: { xs: 1, md: 3 },
                display: "flex",
                flexDirection: "column",
                gap: 4
            }}
        >
            {/* Header Banner */}
            <Card
                sx={{
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.03) 100%)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: 4,
                    boxShadow: "none"
                }}
            >
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                    <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                        <Grid item xs={12} sm={8}>
                            <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                                <TrendingUp color="primary" />
                                <Typography variant="caption" fontWeight="700" color="primary.light" sx={{ textTransform: "uppercase", letterSpacing: 1.5 }}>
                                    System Console
                                </Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="800" letterSpacing="-0.5px" mb={1}>
                                Employee Intelligence Center
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Real-time directory management, department metrics, and workforce charts.
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
                            <Box display="flex" alignItems="center" gap={1} sx={{ bgcolor: "rgba(255, 255, 255, 0.03)", px: 2, py: 1, borderRadius: 3, border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                                <CalendarToday fontSize="small" color="secondary" />
                                <Typography variant="body2" fontWeight="500" color="text.secondary">
                                    {currentDate}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Metrics Grid */}
            <Grid container spacing={3}>
                {[
                    {
                        title: "Total Headcount",
                        value: stats.total,
                        subtitle: "Registered employees",
                        icon: <People sx={{ fontSize: 28, color: "#6366f1" }} />,
                        bg: "rgba(99, 102, 241, 0.06)",
                        border: "rgba(99, 102, 241, 0.15)"
                    },
                    {
                        title: "Active Staff",
                        value: stats.active,
                        subtitle: "Productive strength",
                        icon: <CheckCircle sx={{ fontSize: 28, color: "#10b981" }} />,
                        bg: "rgba(16, 185, 129, 0.06)",
                        border: "rgba(16, 185, 129, 0.15)"
                    },
                    {
                        title: "Departments",
                        value: stats.departments,
                        subtitle: "Active operational units",
                        icon: <Business sx={{ fontSize: 28, color: "#06b6d4" }} />,
                        bg: "rgba(6, 182, 212, 0.06)",
                        border: "rgba(6, 182, 212, 0.15)"
                    }
                ].map((item, index) => (
                    <Grid item xs={12} sm={4} key={index}>
                        <Card
                            sx={{
                                border: `1px solid ${item.border}`,
                                background: `linear-gradient(135deg, ${item.bg} 0%, rgba(255,255,255,0.01) 100%)`,
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: `0 12px 24px -10px ${item.border}`
                                }
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="body2" fontWeight="600" color="text.secondary" gutterBottom>
                                            {item.title}
                                        </Typography>
                                        <Typography variant="h3" fontWeight="800" color="text.primary" sx={{ my: 0.5 }}>
                                            {item.value}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {item.subtitle}
                                        </Typography>
                                    </Box>
                                    <Avatar
                                        sx={{
                                            width: 54,
                                            height: 54,
                                            bgcolor: "rgba(255, 255, 255, 0.03)",
                                            border: `1px solid ${item.border}`
                                        }}
                                    >
                                        {item.icon}
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3}>
                {/* Department Distribution Chart */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={3}>
                                <BusinessCenter fontSize="small" color="primary" />
                                <Typography variant="h6" fontWeight="700">
                                    Department Headcount Distribution
                                </Typography>
                            </Box>
                            <Box sx={{ width: "100%", height: 280 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={getDeptChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                                        <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1f2937",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: 8,
                                                color: "#fff"
                                            }}
                                        />
                                        <Bar dataKey="headcount" fill="url(#colorDept)" radius={[4, 4, 0, 0]}>
                                            {getDeptChartData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                        <defs>
                                            <linearGradient id="colorDept" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Status Allocation Chart */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={3}>
                                <CheckCircle fontSize="small" sx={{ color: "#10b981" }} />
                                <Typography variant="h6" fontWeight="700">
                                    Workforce Status Ratio
                                </Typography>
                            </Box>
                            <Box sx={{ width: "100%", height: 280, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <ResponsiveContainer width="100%" height={210}>
                                    <PieChart>
                                        <Pie
                                            data={getStatusChartData()}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {getStatusChartData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#1f2937",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: 8,
                                                color: "#fff"
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <Box display="flex" justifyContent="center" gap={4} mt={1}>
                                    {getStatusChartData().map((item, idx) => (
                                        <Box key={idx} display="flex" alignItems="center" gap={1}>
                                            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: STATUS_COLORS[idx] }} />
                                            <Typography variant="body2" color="text.secondary" fontWeight="600">
                                                {item.name}: {item.value}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Directory Section */}
            <Box>
                {/* Search & Actions Strip */}
                <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.06)", mb: 3 }}>
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    fullWidth
                                    placeholder="Search employees by name..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search color="action" />
                                            </InputAdornment>
                                        ),
                                        sx: { bgcolor: "#1f2937" }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4} sx={{ display: "flex", justifyContent: { xs: "stretch", sm: "flex-end" } }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<PersonAdd />}
                                    onClick={() => navigate("/employees/create")}
                                    sx={{ py: 1.5 }}
                                >
                                    Add Employee
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Directory Table */}
                <Card sx={{ border: "1px solid rgba(255, 255, 255, 0.06)", height: 520 }}>
                    <CardContent sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} px={1}>
                            <Typography variant="h6" fontWeight="700">
                                Employee Directory
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Showing {filteredEmployees.length} profiles
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ flexGrow: 1, width: "100%", minHeight: 0 }}>
                            <DataGrid
                                rows={filteredEmployees}
                                columns={columns}
                                pageSize={5}
                                rowsPerPageOptions={[5]}
                                disableSelectionOnClick
                                disableRowSelectionOnClick
                                sx={{
                                    border: "none",
                                    "& .MuiDataGrid-cell:focus": {
                                        outline: "none"
                                    }
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}

export default Dashboard;