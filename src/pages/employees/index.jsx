import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
    Box, Grid, Typography, IconButton, Divider, Tooltip, Alert
} from "@mui/material";
import {
    Add, Edit, Delete, Save, Close, People
} from "@mui/icons-material";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";

import AppDataGrid from "../../components/tables/AppDataGrid";
import AppButton from "../../components/common/AppButton";
import AppTextField from "../../components/common/AppTextField";
import AppSelect from "../../components/common/AppSelect";
import AppDatePicker from "../../components/common/AppDatePicker";
import DeleteDialog from "../../components/common/AppDialog";
import MasterPage from "../../components/layout/MasterPage";

import employeeService from "../../services/employeeService";
import departmentService from "../../services/departmentService";
import designationService from "../../services/designationService";
import { useNotification } from "../../contexts/NotificationContext";

// Yup Form Validation Schema
const employeeSchema = yup.object().shape({
    firstName: yup.string().required("First name is required"),
    lastName: yup.string().required("Last name is required"),
    department: yup.string().required("Department is required"),
    designation: yup.string().required("Designation is required"),
    email: yup.string().email("Invalid email address").required("Email address is required"),
    mobileNumber: yup.string().required("Mobile number is required"),
    dateOfJoin: yup.string().required("Date of join is required"),
    status: yup.string().required("Employment status is required"),
});

const EMPTY_FORM = {
    firstName: "",
    lastName: "",
    department: "",
    designation: "",
    email: "",
    mobileNumber: "",
    dateOfJoin: "",
    status: "Active"
};

const STATUS_OPTIONS = [
    { value: "Active", label: "Active" },
    { value: "On Leave", label: "On Leave" },
    { value: "Terminated", label: "Terminated" }
];

function Employees() {
    const { showNotification } = useNotification();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [formError, setFormError] = useState("");
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);

    const { control, handleSubmit, reset } = useForm({
        resolver: yupResolver(employeeSchema),
        defaultValues: EMPTY_FORM
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [emps, depts, desigs] = await Promise.all([
                employeeService.getEmployees(),
                departmentService.getDepartments(),
                designationService.getDesignations(),
            ]);
            setRows(emps);
            setDepartments(depts.filter(d => d.active).map(d => ({ value: d.name, label: d.name })));
            setDesignations(desigs.filter(d => d.active).map(d => ({ value: d.name, label: d.name })));
        } catch {
            showNotification("Failed to load employee data.", "error");
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => { load(); }, [load]);

    const handleRowClick = (params) => {
        const r = params.row;
        setEditId(r.id);
        setFormError("");
        reset({
            firstName: r.firstName || "", lastName: r.lastName || "",
            department: r.department || "", designation: r.designation || "",
            email: r.email || "", mobileNumber: r.mobileNumber || "",
            dateOfJoin: r.dateOfJoin || "", status: r.status || "Active"
        });
    };

    const handleNew = () => {
        setEditId(null); setFormError("");
        reset(EMPTY_FORM);
    };

    const onSubmit = async (data) => {
        setSaving(true);
        setFormError("");
        try {
            if (editId) {
                await employeeService.updateEmployee(editId, data);
                showNotification("Employee updated successfully.", "success");
            } else {
                await employeeService.createEmployee(data);
                showNotification("Employee created and welcome email queued.", "success");
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
            await employeeService.deleteEmployee(deleteTarget.id);
            showNotification(`Employee "${deleteTarget.firstName} ${deleteTarget.lastName}" deleted.`, "success");
            setDeleteTarget(null);
            if (editId === deleteTarget.id) handleNew();
            load();
        } catch (e) {
            showNotification(e.message || "Delete failed.", "error");
        } finally {
            setDeleting(false);
        }
    };

    const statusColors = { Active: "success", Terminated: "error", "On Leave": "warning" };

    const columns = [
        { field: "fullName", headerName: "Employee", flex: 1.8, renderCell: (p) => {
            const initials = `${p.row.firstName?.[0] || ""}${p.row.lastName?.[0] || ""}`.toUpperCase();
            return (
                <Box display="flex" alignItems="center" gap={1.5} sx={{ py: 1 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: "0.85rem", fontWeight: 700 }}>
                        {initials || <People fontSize="small" />}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight="700">{p.row.firstName} {p.row.lastName}</Typography>
                        <Typography variant="caption" color="text.secondary">{p.row.email}</Typography>
                    </Box>
                </Box>
            );
        }},
        { field: "employeeId", headerName: "ID", width: 100, renderCell: (p) => (
            <Chip label={p.value} size="small" variant="outlined" sx={{ fontWeight: 700, fontFamily: "monospace" }} />
        )},
        { field: "department", headerName: "Department", flex: 1, renderCell: (p) => (
            <Chip label={p.value || "—"} size="small" sx={{ bgcolor: "rgba(99,102,241,0.08)", color: "primary.main", fontWeight: 600 }} />
        )},
        { field: "designation", headerName: "Designation", flex: 1, renderCell: (p) => (
            <Typography variant="caption" color="text.secondary" fontWeight="500">{p.value || "—"}</Typography>
        )},
        { field: "status", headerName: "Status", width: 100, renderCell: (p) => (
            <Chip label={p.value} size="small" color={statusColors[p.value] || "default"} sx={{ fontWeight: 600 }} />
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
            <Box display="flex" justifyContent="space-between" alignItems="center" px={3} py={2}
                sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                <Box>
                    <Typography variant="h6" fontWeight="700">{editId ? "Edit Employee" : "New Employee"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {editId ? "Update employee profile" : "Register a new employee"}
                    </Typography>
                </Box>
                {editId && <Tooltip title="Clear"><IconButton size="small" onClick={handleNew}><Close fontSize="small" /></IconButton></Tooltip>}
            </Box>

            <Box px={3} py={2.5} display="flex" flexDirection="column" gap={2}>
                {formError && <Alert severity="error" sx={{ borderRadius: 2 }}>{formError}</Alert>}

                <Grid container spacing={2}>
                    <Grid item xs={6}><AppTextField name="firstName" control={control} label="First Name *" size="small" /></Grid>
                    <Grid item xs={6}><AppTextField name="lastName" control={control} label="Last Name *" size="small" /></Grid>
                </Grid>
                <AppSelect name="department" control={control} label="Department *" options={departments} size="small" />
                <AppSelect name="designation" control={control} label="Designation *" options={designations} size="small" />
                <AppTextField name="email" control={control} label="Email Address *" type="email" size="small" />
                <AppTextField name="mobileNumber" control={control} label="Mobile Number *" size="small" />
                <AppDatePicker name="dateOfJoin" control={control} label="Date of Join *" size="small" />
                <AppSelect name="status" control={control} label="Employment Status *" options={STATUS_OPTIONS} size="small" />
            </Box>

            <Divider />
            <Box display="flex" gap={1.5} px={3} py={2} justifyContent="flex-end">
                <AppButton variant="outlined" color="inherit" onClick={handleNew} disabled={saving}>Clear</AppButton>
                <AppButton type="submit" loading={saving} startIcon={editId ? <Save /> : <Add />}>
                    {editId ? "Update Employee" : "Register Employee"}
                </AppButton>
            </Box>
        </Box>
    );

    return (
        <>
            <MasterPage
                title="Employees"
                subtitle="Manage employee records with assignments and profiles"
                breadcrumbs={[{ label: "Master Registry" }, { label: "Employees" }]}
                action={<AppButton startIcon={<Add />} onClick={handleNew}>New Employee</AppButton>}
                gridPanel={<AppDataGrid rows={rows} columns={columns} loading={loading} onRowClick={handleRowClick} exportFileName="employees.csv" placeholder="Search employees..." />}
                formPanel={formPanel}
            />
            <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm}
                loading={deleting}
                message={`Delete employee "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? All associated records will be affected.`} />
        </>
    );
}

export default Employees;
