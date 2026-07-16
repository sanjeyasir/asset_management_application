import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Chip, IconButton, Tooltip, Alert,
    Divider, Grid
} from "@mui/material";
import { Edit, Delete, Add, Save, Close, Devices, QrCode2 } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { QRCodeSVG } from "qrcode.react";
import MasterPage from "../../components/layout/MasterPage";
import AppDataGrid from "../../components/tables/AppDataGrid";
import AppButton from "../../components/common/AppButton";
import AppTextField from "../../components/common/AppTextField";
import AppSelect from "../../components/common/AppSelect";
import AppDatePicker from "../../components/common/AppDatePicker";
import DeleteDialog from "../../components/dialogs/DeleteDialog";
import { useNotification } from "../../contexts/NotificationContext";
import assetService from "../../services/assetService";
import assetCategoryService from "../../services/assetCategoryService";
import departmentService from "../../services/departmentService";
import locationService from "../../services/locationService";
import employeeService from "../../services/employeeService";
import { assetSchema } from "../../validators/schemas";

const ASSET_STATUSES = [
    { value: "Available", label: "Available" },
    { value: "Assigned", label: "Assigned" },
    { value: "Maintenance", label: "Maintenance" },
    { value: "Repair", label: "Repair" },
    { value: "Disposed", label: "Disposed" },
    { value: "Lost", label: "Lost" },
];

const EMPTY_FORM = {
    assetName: "", serialNumber: "", category: "", department: "",
    location: "", assignedEmployee: "", purchaseDate: "",
    purchaseCost: "", warrantyExpiry: "", vendor: "", status: "Available"
};

const STATUS_COLORS = {
    Available: "success", Assigned: "primary",
    Maintenance: "warning", Repair: "error", Disposed: "default", Lost: "error"
};

function Assets() {
    const { showNotification } = useNotification();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editAsset, setEditAsset] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [formError, setFormError] = useState("");
    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [locations, setLocations] = useState([]);
    const [employees, setEmployees] = useState([]);

    const { control, handleSubmit, reset, watch } = useForm({
        resolver: yupResolver(assetSchema),
        defaultValues: EMPTY_FORM
    });

    const watchedStatus = watch("status");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [assets, cats, depts, locs, emps] = await Promise.all([
                assetService.getAssets(),
                assetCategoryService.getCategories(),
                departmentService.getDepartments(),
                locationService.getLocations(),
                employeeService.getEmployees(),
            ]);
            setRows(assets);
            setCategories(cats.filter(c => c.active).map(c => ({ value: c.name, label: c.name })));
            setDepartments(depts.filter(d => d.active).map(d => ({ value: d.name, label: d.name })));
            setLocations(locs.filter(l => l.active).map(l => ({ value: l.name, label: l.name })));
            setEmployees(emps.filter(e => e.status === "Active").map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName} (${e.employeeId})` })));
        } catch {
            showNotification("Failed to load asset data.", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => { load(); }, [load]);

    const handleRowClick = (params) => {
        const r = params.row;
        setEditId(r.id);
        setEditAsset(r);
        setFormError("");
        reset({
            assetName: r.assetName || "", serialNumber: r.serialNumber || "",
            category: r.category || "", department: r.department || "",
            location: r.location || "", assignedEmployee: r.assignedEmployee || "",
            purchaseDate: r.purchaseDate || "", purchaseCost: r.purchaseCost || "",
            warrantyExpiry: r.warrantyExpiry || "", vendor: r.vendor || "",
            status: r.status || "Available"
        });
    };

    const handleNew = () => {
        setEditId(null); setEditAsset(null);
        setFormError(""); reset(EMPTY_FORM);
    };

    const onSubmit = async (data) => {
        setSaving(true);
        setFormError("");
        try {
            const payload = { ...data, purchaseCost: parseFloat(data.purchaseCost) || 0 };
            if (editId) {
                await assetService.updateAsset(editId, payload);
                showNotification("Asset updated successfully.", "success");
            } else {
                await assetService.createAsset(payload);
                showNotification("Asset registered. QR code generated automatically.", "success");
            }
            handleNew();
            load();
        } catch (e) {
            setFormError(e.message || "An error occurred.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            await assetService.deleteAsset(deleteTarget.id);
            showNotification(`Asset "${deleteTarget.assetName}" deleted.`, "success");
            setDeleteTarget(null);
            if (editId === deleteTarget.id) handleNew();
            load();
        } catch (e) {
            showNotification(e.message || "Delete failed.", "error");
        } finally {
            setDeleting(false);
        }
    };

    const getEmpName = (id) => {
        const emp = employees.find(e => e.value === id);
        return emp ? emp.label.split("(")[0].trim() : id;
    };

    const columns = [
        { field: "assetName", headerName: "Asset", flex: 1.5, renderCell: (p) => (
            <Box display="flex" alignItems="center" gap={1.5} sx={{ py: 1 }}>
                <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: "rgba(6,182,212,0.1)", color: "secondary.main", display: "flex" }}>
                    <Devices fontSize="small" />
                </Box>
                <Box>
                    <Typography variant="body2" fontWeight="700">{p.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.row.assetNumber}</Typography>
                </Box>
            </Box>
        )},
        { field: "category", headerName: "Category", flex: 1, renderCell: (p) => (
            <Typography variant="caption" color="text.secondary" fontWeight="500">{p.value || "—"}</Typography>
        )},
        { field: "assignedEmployee", headerName: "Assigned To", flex: 1, renderCell: (p) => (
            p.value ? (
                <Chip label={getEmpName(p.value)} size="small"
                    sx={{ bgcolor: "rgba(99,102,241,0.08)", color: "primary.main", fontWeight: 600, fontSize: "0.75rem" }} />
            ) : <Typography variant="caption" color="text.secondary">Unassigned</Typography>
        )},
        { field: "status", headerName: "Status", width: 110, renderCell: (p) => (
            <Chip label={p.value} size="small" color={STATUS_COLORS[p.value] || "default"} sx={{ fontWeight: 600 }} />
        )},
        { field: "warrantyExpiry", headerName: "Warranty", width: 110, renderCell: (p) => {
            const isExpired = p.value && new Date(p.value) < new Date();
            return <Typography variant="caption" color={isExpired ? "error.main" : "text.secondary"}>{p.value || "—"}</Typography>;
        }},
        { field: "actions", headerName: "", width: 90, sortable: false, renderCell: (p) => (
            <Box display="flex">
                <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRowClick({ row: p.row }); }}><Edit fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteTarget(p.row); }}><Delete fontSize="small" /></IconButton></Tooltip>
            </Box>
        )},
    ];

    const formPanel = (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box display="flex" justifyContent="space-between" alignItems="center" px={3} py={2}
                sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                <Box>
                    <Typography variant="h6" fontWeight="700">{editId ? "Edit Asset" : "New Asset"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {editId ? `Asset No: ${editAsset?.assetNumber}` : "Asset number & QR code are auto-generated"}
                    </Typography>
                </Box>
                {editId && <Tooltip title="Clear"><IconButton size="small" onClick={handleNew}><Close fontSize="small" /></IconButton></Tooltip>}
            </Box>

            {/* QR Code Preview for existing assets */}
            {editAsset?.qrCode && (
                <Box display="flex" alignItems="center" gap={2} px={3} py={2}
                    sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "rgba(99,102,241,0.03)" }}>
                    <Box sx={{ p: 1, bgcolor: "#fff", borderRadius: 2, display: "flex" }}>
                        <QRCodeSVG value={editAsset.qrCode} size={60} />
                    </Box>
                    <Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <QrCode2 fontSize="small" sx={{ color: "primary.main" }} />
                            <Typography variant="caption" fontWeight="700" color="primary.main">QR CODE</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="700" fontFamily="monospace">{editAsset.assetNumber}</Typography>
                        <Typography variant="caption" color="text.secondary">Scan to identify this asset</Typography>
                    </Box>
                </Box>
            )}

            <Box px={3} py={2.5} display="flex" flexDirection="column" gap={2} sx={{ maxHeight: 400, overflowY: "auto" }}>
                {formError && <Alert severity="error" sx={{ borderRadius: 2 }}>{formError}</Alert>}

                <AppTextField name="assetName" control={control} label="Asset Name *" size="small" />
                <AppTextField name="serialNumber" control={control} label="Serial Number *" size="small" />
                <AppSelect name="category" control={control} label="Category *" options={categories} size="small" />
                <Grid container spacing={2}>
                    <Grid item xs={6}><AppSelect name="department" control={control} label="Department *" options={departments} size="small" /></Grid>
                    <Grid item xs={6}><AppSelect name="location" control={control} label="Location *" options={locations} size="small" /></Grid>
                </Grid>
                <AppSelect name="status" control={control} label="Asset Status *" options={ASSET_STATUSES} size="small" />
                {(watchedStatus === "Assigned") && (
                    <AppSelect name="assignedEmployee" control={control} label="Assign to Employee *" options={employees} size="small" />
                )}
                <Grid container spacing={2}>
                    <Grid item xs={6}><AppDatePicker name="purchaseDate" control={control} label="Purchase Date *" size="small" /></Grid>
                    <Grid item xs={6}><AppTextField name="purchaseCost" control={control} label="Purchase Cost *" type="number" size="small" /></Grid>
                </Grid>
                <AppDatePicker name="warrantyExpiry" control={control} label="Warranty Expiry *" size="small" />
                <AppTextField name="vendor" control={control} label="Vendor *" size="small" />
            </Box>

            <Divider />
            <Box display="flex" gap={1.5} px={3} py={2} justifyContent="flex-end">
                <AppButton variant="outlined" color="inherit" onClick={handleNew} disabled={saving}>Clear</AppButton>
                <AppButton type="submit" loading={saving} startIcon={editId ? <Save /> : <Add />}>
                    {editId ? "Update Asset" : "Register Asset"}
                </AppButton>
            </Box>
        </Box>
    );

    return (
        <>
            <MasterPage
                title="Assets"
                subtitle="Corporate asset registry with QR codes, assignment tracking, and lifecycle management"
                breadcrumbs={[{ label: "Master Registry" }, { label: "Assets" }]}
                action={<AppButton startIcon={<Add />} onClick={handleNew}>Register Asset</AppButton>}
                gridPanel={<AppDataGrid rows={rows} columns={columns} loading={loading} onRowClick={handleRowClick} exportFileName="assets.csv" placeholder="Search assets..." />}
                formPanel={formPanel}
            />
            <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm}
                loading={deleting}
                message={`Delete asset "${deleteTarget?.assetName}"? Assigned assets cannot be deleted — unassign first.`} />
        </>
    );
}

export default Assets;
