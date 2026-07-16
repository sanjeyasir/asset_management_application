import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Switch, FormControlLabel, Chip, IconButton, Tooltip, Alert, Divider } from "@mui/material";
import { Edit, Delete, Add, Save, Close, WorkspacePremium } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import MasterPage from "../../components/layout/MasterPage";
import AppDataGrid from "../../components/tables/AppDataGrid";
import AppButton from "../../components/common/AppButton";
import AppTextField from "../../components/common/AppTextField";
import DeleteDialog from "../../components/dialogs/DeleteDialog";
import { useNotification } from "../../contexts/NotificationContext";
import designationService from "../../services/designationService";
import { designationSchema } from "../../validators/schemas";

const EMPTY_FORM = { name: "", description: "", active: true };

function Designations() {
    const { showNotification } = useNotification();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [formError, setFormError] = useState("");

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(designationSchema),
        defaultValues: EMPTY_FORM
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setRows(await designationService.getDesignations());
        } catch {
            showNotification("Failed to load designations.", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => { load(); }, [load]);

    const handleRowClick = (params) => {
        const r = params.row;
        setEditId(r.id);
        setFormError("");
        reset({ name: r.name, description: r.description || "", active: r.active ?? true });
    };

    const handleNew = () => { setEditId(null); setFormError(""); reset(EMPTY_FORM); };

    const onSubmit = async (data) => {
        setSaving(true);
        setFormError("");
        try {
            if (editId) {
                await designationService.updateDesignation(editId, data);
                showNotification("Designation updated.", "success");
            } else {
                await designationService.createDesignation(data);
                showNotification("Designation created.", "success");
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
            await designationService.deleteDesignation(deleteTarget.id);
            showNotification(`"${deleteTarget.name}" deleted.`, "success");
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
        { field: "name", headerName: "Designation", flex: 1.5, renderCell: (p) => (
            <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: "rgba(6,182,212,0.1)", color: "secondary.main", display: "flex" }}>
                    <WorkspacePremium fontSize="small" />
                </Box>
                <Typography variant="body2" fontWeight="600">{p.value}</Typography>
            </Box>
        )},
        { field: "description", headerName: "Description", flex: 2, renderCell: (p) => (
            <Typography variant="caption" color="text.secondary">{p.value || "—"}</Typography>
        )},
        { field: "active", headerName: "Status", width: 100, renderCell: (p) => (
            <Chip label={p.value ? "Active" : "Inactive"} size="small" color={p.value ? "success" : "default"} sx={{ fontWeight: 600 }} />
        )},
        { field: "actions", headerName: "", width: 90, sortable: false, renderCell: (p) => (
            <Box display="flex">
                <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRowClick({ row: p.row }); }}><Edit fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteTarget(p.row); }}><Delete fontSize="small" /></IconButton></Tooltip>
            </Box>
        )},
    ];

    const formPanel = (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Box display="flex" justifyContent="space-between" alignItems="center" px={3} py={2} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                <Box>
                    <Typography variant="h6" fontWeight="700">{editId ? "Edit Designation" : "New Designation"}</Typography>
                    <Typography variant="caption" color="text.secondary">{editId ? "Update designation details" : "Create a new job designation"}</Typography>
                </Box>
                {editId && <Tooltip title="Clear"><IconButton size="small" onClick={handleNew}><Close fontSize="small" /></IconButton></Tooltip>}
            </Box>
            <Box px={3} py={3} display="flex" flexDirection="column" gap={2.5}>
                {formError && <Alert severity="error" sx={{ borderRadius: 2 }}>{formError}</Alert>}
                <AppTextField name="name" control={control} label="Designation Name *" />
                <AppTextField name="description" control={control} label="Description" multiline rows={3} />
                <Controller name="active" control={control} render={({ field }) => (
                    <FormControlLabel control={<Switch checked={!!field.value} onChange={field.onChange} color="success" />}
                        label={<Typography variant="body2" fontWeight="600">Active</Typography>} />
                )} />
            </Box>
            <Divider />
            <Box display="flex" gap={1.5} px={3} py={2} justifyContent="flex-end">
                <AppButton variant="outlined" color="inherit" onClick={handleNew} disabled={saving}>Clear</AppButton>
                <AppButton type="submit" loading={saving} startIcon={editId ? <Save /> : <Add />}>
                    {editId ? "Update" : "Create Designation"}
                </AppButton>
            </Box>
        </Box>
    );

    return (
        <>
            <MasterPage
                title="Designations"
                subtitle="Manage job titles and roles"
                breadcrumbs={[{ label: "Master Registry" }, { label: "Designations" }]}
                action={<AppButton startIcon={<Add />} onClick={handleNew}>New Designation</AppButton>}
                gridPanel={<AppDataGrid rows={rows} columns={columns} loading={loading} onRowClick={handleRowClick} exportFileName="designations.csv" placeholder="Search designations..." />}
                formPanel={formPanel}
            />
            <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm}
                loading={deleting} message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} />
        </>
    );
}

export default Designations;
