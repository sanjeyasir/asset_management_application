import { useState, useEffect } from "react";
import {
    Box, Grid, Typography, Chip, Avatar, List, ListItem,
    ListItemAvatar, ListItemText, Divider, Skeleton
} from "@mui/material";
import {
    People, Devices, CheckCircle, RadioButtonUnchecked,
    Business, Room, TrendingUp, Inventory2,
    PersonAdd, Assignment
} from "@mui/icons-material";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from "recharts";
import { useNavigate } from "react-router-dom";
import AppCard from "../../components/common/AppCard";
import AppButton from "../../components/common/AppButton";
import PageHeader from "../../components/common/PageHeader";
import employeeService from "../../services/employeeService";
import assetService from "../../services/assetService";
import departmentService from "../../services/departmentService";
import locationService from "../../services/locationService";
import assetCategoryService from "../../services/assetCategoryService";
import { useAuth } from "../../contexts/AuthContext";

const CHART_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function StatCard({ icon, label, value, color, loading, trend }) {
    return (
        <AppCard sx={{ height: "100%" }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
                <Box sx={{ flexGrow: 1 }}>
                    {loading ? (
                        <>
                            <Skeleton width={60} height={40} />
                            <Skeleton width={120} sx={{ mt: 1 }} />
                        </>
                    ) : (
                        <>
                            <Typography variant="h3" fontWeight="800" color={color} lineHeight={1.1}>
                                {value}
                            </Typography>
                            <Typography variant="body2" color="text.primary" fontWeight="700" mt={1}>
                                {label}
                            </Typography>
                            {trend && (
                                <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                    <TrendingUp sx={{ fontSize: 14, color: "success.main" }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight="500">
                                        {trend}
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
                <Box sx={{
                    p: 2, 
                    borderRadius: "16px",
                    background: `${color}12`,
                    border: `1px solid ${color}24`,
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    flexShrink: 0
                }}>
                    <Box sx={{ color, display: "flex" }}>{icon}</Box>
                </Box>
            </Box>
        </AppCard>
    );
}

function Dashboard() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ employees: 0, assets: 0, assigned: 0, available: 0, departments: 0, locations: 0 });
    const [employees, setEmployees] = useState([]);
    const [assets, setAssets] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [emps, assetsData, depts, locs, cats] = await Promise.all([
                employeeService.getEmployees(),
                assetService.getAssets(),
                departmentService.getDepartments(),
                locationService.getLocations(),
                assetCategoryService.getCategories(),
            ]);
            setEmployees(emps);
            setAssets(assetsData);
            setDepartments(depts);
            setCategories(cats);
            setStats({
                employees: emps.length,
                assets: assetsData.length,
                assigned: assetsData.filter(a => a.status === "Assigned").length,
                available: assetsData.filter(a => a.status === "Available").length,
                departments: depts.length,
                locations: locs.length,
            });
        } catch (e) {
            console.error("Dashboard load error:", e);
        } finally {
            setLoading(false);
        }
    };

    // Build chart data from real or sample data
    const assetStatusData = (() => {
        if (assets.length === 0) return [
            { name: "Available", value: 12 }, { name: "Assigned", value: 25 },
            { name: "Maintenance", value: 4 }, { name: "Repair", value: 2 },
        ];
        const groups = {};
        assets.forEach(a => { groups[a.status] = (groups[a.status] || 0) + 1; });
        return Object.entries(groups).map(([name, value]) => ({ name, value }));
    })();

    const deptAssetData = (() => {
        const deptMap = {};
        departments.forEach(d => {
            deptMap[d.id] = d.code || d.name;
        });

        if (assets.length === 0) return [
            { dept: "IT", assets: 18 }, { dept: "HR", assets: 5 },
            { dept: "Finance", assets: 7 }, { dept: "Ops", assets: 12 }, { dept: "Sales", assets: 9 },
        ];
        const groups = {};
        assets.forEach(a => { 
            if (a.department) {
                const resolvedName = deptMap[a.department] || a.department;
                groups[resolvedName] = (groups[resolvedName] || 0) + 1; 
            }
        });
        return Object.entries(groups).slice(0, 6).map(([dept, assetsCount]) => ({ dept: dept.substring(0, 12), assets: assetsCount }));
    })();

    const recentAssets = [...assets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const categoryMap = {};
    categories.forEach(c => {
        categoryMap[c.id] = c.name;
    });

    const statusColor = {
        Available: "success", Assigned: "primary", Maintenance: "warning",
        Repair: "error", Disposed: "default", Lost: "error"
    };

    const username = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Admin";

    const quickActions = [
        { label: "Add Employee", icon: <PersonAdd />, path: "/employees", color: "primary" },
        { label: "Register Asset", icon: <Inventory2 />, path: "/assets", color: "secondary" },
        { label: "New Department", icon: <Business />, path: "/departments", color: "inherit" },
        { label: "Add Location", icon: <Room />, path: "/locations", color: "inherit" },
    ];

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <PageHeader
                title={`Welcome back, ${username} 👋`}
                subtitle="Here's a detailed overview of your system assets and resources"
                breadcrumbs={[{ label: "Dashboard" }]}
            />

            {/* ── STAT CARDS GRID (3 Columns Desktop, 2 Columns Tablet) ── */}
            <Grid container spacing={3}>
                {[
                    { icon: <People sx={{ fontSize: 32 }} />, label: "Total Employees", value: stats.employees, color: "#6366f1", trend: "Active workforce size" },
                    { icon: <Devices sx={{ fontSize: 32 }} />, label: "Total Assets", value: stats.assets, color: "#06b6d4", trend: "Registered items" },
                    { icon: <Assignment sx={{ fontSize: 32 }} />, label: "Assigned Assets", value: stats.assigned, color: "#f59e0b", trend: "In active usage" },
                    { icon: <CheckCircle sx={{ fontSize: 32 }} />, label: "Available Assets", value: stats.available, color: "#10b981", trend: "Ready to deploy" },
                    { icon: <Business sx={{ fontSize: 32 }} />, label: "Departments", value: stats.departments, color: "#8b5cf6", trend: "Business divisions" },
                    { icon: <Room sx={{ fontSize: 32 }} />, label: "Locations", value: stats.locations, color: "#ec4899", trend: "Operational sites" },
                ].map((card) => (
                    <Grid item xs={12} sm={6} md={4} key={card.label}>
                        <StatCard {...card} loading={loading} />
                    </Grid>
                ))}
            </Grid>

            {/* ── CHARTS SECTION (Evenly spaced side-by-side) ── */}
            <Grid container spacing={3}>
                {/* ── PIE CHART ── */}
                <Grid item xs={12} md={6}>
                    <AppCard title="Asset Status Breakdown" subheader="Distribution by current allocation state">
                        <Box sx={{ height: 320, mt: 2 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={assetStatusData}
                                        cx="50%" cy="45%"
                                        innerRadius={75} outerRadius={110}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {assetStatusData.map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: "#111827", border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: 8, fontSize: 13
                                        }}
                                    />
                                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </AppCard>
                </Grid>

                {/* ── BAR CHART ── */}
                <Grid item xs={12} md={6}>
                    <AppCard title="Assets by Department" subheader="Corporate asset distribution counts">
                        <Box sx={{ height: 320, mt: 2 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={deptAssetData} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{
                                            background: "#111827", border: "1px solid rgba(255,255,255,0.08)",
                                            borderRadius: 8, fontSize: 13
                                        }}
                                    />
                                    <Bar dataKey="assets" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </AppCard>
                </Grid>
            </Grid>

            {/* ── BOTTOM INFO SECTION ── */}
            <Grid container spacing={3}>
                {/* ── RECENT ASSETS (Padded list layout) ── */}
                <Grid item xs={12} md={8}>
                    <AppCard
                        title="Recent Assets"
                        subheader="Latest registered assets in the directory"
                        headerActions={
                            <AppButton size="small" variant="outlined" onClick={() => navigate("/assets")}>
                                View All
                            </AppButton>
                        }
                    >
                        {loading ? (
                            [1, 2, 3].map(i => <Skeleton key={i} height={60} sx={{ mb: 1 }} />)
                        ) : recentAssets.length === 0 ? (
                            <Box textAlign="center" py={5}>
                                <RadioButtonUnchecked sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                <Typography color="text.secondary" variant="body2">No assets registered yet</Typography>
                                <AppButton size="small" sx={{ mt: 2 }} onClick={() => navigate("/assets")}>
                                    Register First Asset
                                </AppButton>
                            </Box>
                        ) : (
                            <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                {recentAssets.map((asset, i) => (
                                    <Box key={asset.id}>
                                        <ListItem disableGutters sx={{ py: 1.5, px: 1 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: `${CHART_COLORS[i % CHART_COLORS.length]}12`, color: CHART_COLORS[i % CHART_COLORS.length] }}>
                                                    <Devices fontSize="small" />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={<Typography variant="subtitle2" fontWeight="700">{asset.assetName}</Typography>}
                                                secondary={
                                                    <Typography variant="caption" color="text.secondary">
                                                        {asset.assetNumber} · {categoryMap[asset.category] || asset.category || "Uncategorized"}
                                                    </Typography>
                                                }
                                            />
                                            <Chip
                                                label={asset.status}
                                                size="small"
                                                color={statusColor[asset.status] || "default"}
                                                variant="outlined"
                                                sx={{ fontWeight: 600, borderRadius: 1.5 }}
                                            />
                                        </ListItem>
                                        {i < recentAssets.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        )}
                    </AppCard>
                </Grid>

                {/* ── QUICK ACTIONS + ANNOUNCEMENTS ── */}
                <Grid item xs={12} md={4}>
                    <Box display="flex" flexDirection="column" gap={3}>
                        <AppCard title="Quick Actions" subheader="Perform common operations">
                            <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                {quickActions.map((action) => (
                                    <Grid item xs={6} key={action.label}>
                                        <AppButton
                                            fullWidth
                                            variant="outlined"
                                            color={action.color}
                                            startIcon={action.icon}
                                            onClick={() => navigate(action.path)}
                                            sx={{ 
                                                py: 2, 
                                                fontSize: "0.8rem", 
                                                flexDirection: "column", 
                                                gap: 1, 
                                                borderRadius: 3,
                                                "& .MuiButton-startIcon": { m: 0 } 
                                            }}
                                        >
                                            {action.label}
                                        </AppButton>
                                    </Grid>
                                ))}
                            </Grid>
                        </AppCard>

                        <AppCard title="System Announcements" subheader="Latest platform updates">
                            <Box display="flex" flexDirection="column" gap={2.5} sx={{ mt: 1 }}>
                                {[
                                    { msg: "Cloud EAM v1.0 launched. Welcome to the system!", time: "Today", color: "success.main" },
                                    { msg: "Warranty expiry alerts will be sent 30 days in advance.", time: "System", color: "warning.main" },
                                    { msg: "Audit logs are retained for 12 months.", time: "Policy", color: "info.main" },
                                ].map((item, i) => (
                                    <Box key={i} display="flex" gap={2} alignItems="flex-start">
                                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: item.color, mt: 0.8, flexShrink: 0 }} />
                                        <Box>
                                            <Typography variant="body2" fontWeight="600">{item.msg}</Typography>
                                            <Typography variant="caption" color="text.secondary">{item.time}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </AppCard>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Dashboard;
