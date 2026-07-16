import { useState, useEffect, useCallback } from "react";
import {
    Box, Typography, Switch, FormControlLabel, Chip,
    IconButton, Tooltip, Alert, Divider
} from "@mui/material";
import { Edit, Delete, Add, Save, Close, Business } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import MasterPage from "../../components/layout/MasterPage";
import AppDataGrid from "../../components/tables/AppDataGrid";
import AppButton from "../../components/common/AppButton";
import AppTextField from "../../components/common/AppTextField";
import DeleteDialog from "../../components/dialogs/DeleteDialog";
import { useNotification } from "../../contexts/NotificationContext";
import departmentService from "../../services/departmentService";
import { departmentSchema } from "../../validators/schemas";

const EMPTY_FORM = { name: "", code: "", description: "", active: true };

function Departments() {
    const { showNotification } = useNotification();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null); // null = create mode
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [formError, setFormError] = useState("");

    const { control, handleSubmit, reset, setValue, watch, formState: { errors, isDirty } } = useForm({
        resolver: yupResolver(departmentSchema),
        defaultValues: EMPTY_FORM
    });

    const activeValue = watch("active");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await departmentService.getDepartments();
            setRows(data);
        } catch (e) {
            showNotification("Failed to load departments.", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => { load(); }, [load]);

    const handleRowClick = (params) => {
        const row = params.row;
        setEditId(row.id);
        setFormError("");
        reset({ name: row.name, code: row.code, description: row.description || "", active: row.active ?? true });
    };

    const handleNew = () => {
        setEditId(null);
        setFormError("");
        reset(EMPTY_FORM);
    };

    const onSubmit = async (data) => {
        setSaving(true);
        setFormError("");
        try {
            if (editId) {
                await departmentService.updateDepartment(editId, data);
                showNotification("Department updated successfully.", "success");
            } else {
                await departmentService.createDepartment(data);
                showNotification("Department created successfully.", "success");
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
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await departmentService.deleteDepartment(deleteTarget.id);
            showNotification(`"${deleteTarget.name}" deleted successfully.`, "success");
            setDeleteTarget(null);
            if (editId === deleteTarget.id) handleNew();
            load();
        } catch (e) {
            showNotification(e.message || "Delete failed.", "error");
        } finally {
            setDeleting(false);
        }
    };

    const columns = [
        { field: "name", headerName: "Department Name", flex: 1.5, renderCell: (p) => (
            <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: "rgba(99,102,241,0.1)", color: "primary.main", display: "flex" }}>
                    <Business fontSize="small" />
                </Box>
                <Typography variant="body2" fontWeight="600">{p.value}</Typography>
            </Box>
        )},
        { field: "code", headerName: "Code", width: 100, renderCell: (p) => (
            <Chip label={p.value} size="small" variant="outlined" sx={{ fontWeight: 700, fontFamily: "monospace" }} />
        )},
        { field: "description", headerName: "Description", flex: 1.5, renderCell: (p) => (
            <Typography variant="caption" color="text.secondary">{p.value || "—"}</Typography>
        )},
        { field: "active", headerName: "Status", width: 100, renderCell: (p) => (
            <Chip label={p.value ? "Active" : "Inactive"} size="small"
                color={p.value ? "success" : "default"} variant="filled" sx={{ fontWeight: 600 }} />
        )},
        { field: "actions", headerName: "", width: 90, sortable: false,
            renderCell: (p) => (
                <Box display="flex">
                    <Tooltip title="Edit">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRowClick({ row: p.row }); }}>
                            <Edit fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteTarget(p.row); }}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        },
    ];

    const gridPanel = (
        <AppDataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            onRowClick={handleRowClick}
            exportFileName="departments.csv"
            placeholder="Search departments..."
        />
    );

    const formPanel = (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Form Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" px={3} py={2}
                sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                <Box>
                    <Typography variant="h6" fontWeight="700">
                        {editId ? "Edit Department" : "New Department"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {editId ? "Update department details" : "Fill in the form to create a department"}
                    </Typography>
                </Box>
                {editId && (
                    <Tooltip title="Clear / New">
                        <IconButton size="small" onClick={handleNew}>
                            <Close fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* Form Fields */}
            <Box px={3} py={3} display="flex" flexDirection="column" gap={2.5}>
                {formError && <Alert severity="error" sx={{ borderRadius: 2 }}>{formError}</Alert>}

                <AppTextField name="name" control={control} label="Department Name *" />
                <AppTextField name="code" control={control} label="Department Code *"
                    inputProps={{ style: { textTransform: "uppercase" } }} />
                <AppTextField name="description" control={control} label="Description"
                    multiline rows={3} />

                <Controller
                    name="active"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={<Switch checked={!!field.value} onChange={field.onChange} color="success" />}
                            label={<Typography variant="body2" fontWeight="600">Active</Typography>}
                        />
                    )}
                />
            </Box>

            <Divider />
            <Box display="flex" gap={1.5} px={3} py={2} justifyContent="flex-end">
                <AppButton type="button" variant="outlined" color="inherit" onClick={handleNew} disabled={saving}>
                    Clear
                </AppButton>
                <AppButton type="submit" loading={saving} startIcon={editId ? <Save /> : <Add />}>
                    {editId ? "Update" : "Create Department"}
                </AppButton>
            </Box>
        </Box>
    );

    return (
        <>
            <MasterPage
                title="Departments"
                subtitle="Manage organisational departments"
                breadcrumbs={[{ label: "Master Registry" }, { label: "Departments" }]}
                action={
                    <AppButton startIcon={<Add />} onClick={handleNew}>
                        New Department
                    </AppButton>
                }
                gridPanel={gridPanel}
                formPanel={formPanel}
            />
            <DeleteDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                loading={deleting}
                message={`Delete department "${deleteTarget?.name}"? This action cannot be undone.`}
            />
        </>
    );
}

export default Departments;
