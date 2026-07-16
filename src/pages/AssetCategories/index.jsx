import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Switch, FormControlLabel, Chip, IconButton, Tooltip, Alert, Divider } from "@mui/material";
import { Edit, Delete, Add, Save, Close, Category, AccountTree } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import MasterPage from "../../components/layout/MasterPage";
import AppDataGrid from "../../components/tables/AppDataGrid";
import AppButton from "../../components/common/AppButton";
import AppTextField from "../../components/common/AppTextField";
import AppSelect from "../../components/common/AppSelect";
import DeleteDialog from "../../components/dialogs/DeleteDialog";
import { useNotification } from "../../contexts/NotificationContext";
import assetCategoryService from "../../services/assetCategoryService";
import { categorySchema } from "../../validators/schemas";

const EMPTY_FORM = { name: "", parentCategory: "", description: "", active: true };

function AssetCategories() {
    const { showNotification } = useNotification();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [formError, setFormError] = useState("");

    const { control, handleSubmit, reset, watch } = useForm({
        resolver: yupResolver(categorySchema),
        defaultValues: EMPTY_FORM
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setRows(await assetCategoryService.getCategories());
        } catch {
            showNotification("Failed to load categories.", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => { load(); }, [load]);

    // Build parent options excluding current record (avoid self-parent)
    const parentOptions = rows
        .filter(r => r.id !== editId)
        .map(r => ({ value: r.id, label: r.name }));

    const getParentName = (parentId) => rows.find(r => r.id === parentId)?.name || null;

    const handleRowClick = (params) => {
        const r = params.row;
        setEditId(r.id);
        setFormError("");
        reset({ name: r.name, parentCategory: r.parentCategory || "", description: r.description || "", active: r.active ?? true });
    };

    const handleNew = () => { setEditId(null); setFormError(""); reset(EMPTY_FORM); };

    const onSubmit = async (data) => {
        setSaving(true);
        setFormError("");
        try {
            if (editId) {
                await assetCategoryService.updateCategory(editId, data);
                showNotification("Category updated.", "success");
            } else {
                await assetCategoryService.createCategory(data);
                showNotification("Category created.", "success");
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
            await assetCategoryService.deleteCategory(deleteTarget.id);
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
        { field: "name", headerName: "Category Name", flex: 1.5, renderCell: (p) => (
            <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: "rgba(139,92,246,0.1)", color: "#8b5cf6", display: "flex" }}>
                    {p.row.parentCategory ? <AccountTree fontSize="small" /> : <Category fontSize="small" />}
                </Box>
                <Box>
                    <Typography variant="body2" fontWeight="600">{p.value}</Typography>
                    {p.row.parentCategory && (
                        <Typography variant="caption" color="text.secondary">
                            ↳ {getParentName(p.row.parentCategory) || "Parent"}
                        </Typography>
                    )}
                </Box>
            </Box>
        )},
        { field: "parentCategory", headerName: "Parent", flex: 1, renderCell: (p) => (
            p.value ? (
                <Chip label={getParentName(p.value) || "—"} size="small" variant="outlined"
                    icon={<AccountTree sx={{ fontSize: "12px !important" }} />} sx={{ fontWeight: 500 }} />
            ) : (
                <Chip label="Root Category" size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
            )
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
                    <Typography variant="h6" fontWeight="700">{editId ? "Edit Category" : "New Category"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {editId ? "Update category details" : "Leave Parent empty to create a root category"}
                    </Typography>
                </Box>
                {editId && <Tooltip title="Clear"><IconButton size="small" onClick={handleNew}><Close fontSize="small" /></IconButton></Tooltip>}
            </Box>
            <Box px={3} py={3} display="flex" flexDirection="column" gap={2.5}>
                {formError && <Alert severity="error" sx={{ borderRadius: 2 }}>{formError}</Alert>}
                <AppTextField name="name" control={control} label="Category Name *" />
                <AppSelect name="parentCategory" control={control} label="Parent Category (optional)" options={parentOptions} />
                <AppTextField name="description" control={control} label="Description" multiline rows={2} />
                <Controller name="active" control={control} render={({ field }) => (
                    <FormControlLabel control={<Switch checked={!!field.value} onChange={field.onChange} color="success" />}
                        label={<Typography variant="body2" fontWeight="600">Active</Typography>} />
                )} />
            </Box>
            <Divider />
            <Box display="flex" gap={1.5} px={3} py={2} justifyContent="flex-end">
                <AppButton variant="outlined" color="inherit" onClick={handleNew} disabled={saving}>Clear</AppButton>
                <AppButton type="submit" loading={saving} startIcon={editId ? <Save /> : <Add />}>
                    {editId ? "Update" : "Create Category"}
                </AppButton>
            </Box>
        </Box>
    );

    return (
        <>
            <MasterPage
                title="Asset Categories"
                subtitle="Hierarchical category management — supports parent/child structures"
                breadcrumbs={[{ label: "Master Registry" }, { label: "Asset Categories" }]}
                action={<AppButton startIcon={<Add />} onClick={handleNew}>New Category</AppButton>}
                gridPanel={<AppDataGrid rows={rows} columns={columns} loading={loading} onRowClick={handleRowClick} exportFileName="asset_categories.csv" placeholder="Search categories..." />}
                formPanel={formPanel}
            />
            <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm}
                loading={deleting} message={`Delete "${deleteTarget?.name}"? Subcategories must be removed first.`} />
        </>
    );
}

export default AssetCategories;
