import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
    Box, Grid, Typography, IconButton, Divider, Tooltip, Alert, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from "@mui/material";
import {
    Add, Edit, Delete, Save, Close, People, VpnKey
} from "@mui/icons-material";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";

import AppDataGrid from "../../components/tables/AppDataGrid";
import AppButton from "../../components/common/AppButton";
import AppTextField from "../../components/common/AppTextField";
import AppSelect from "../../components/common/AppSelect";
import AppDatePicker from "../../components/common/AppDatePicker";
import DeleteDialog from "../../components/dialogs/DeleteDialog";
import MasterPage from "../../components/layout/MasterPage";
import authService from "../../services/authService";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";

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
    role: yup.string().required("Role is required"),
    password: yup.string().notRequired(),
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
    role: "Employee",
    password: "",
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

    const [tabIndex, setTabIndex] = useState(0);
    const [resetRequests, setResetRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [approvalTarget, setApprovalTarget] = useState(null);
    const [tempPassword, setTempPassword] = useState("");
    const [approving, setApproving] = useState(false);
    const [approvalError, setApprovalError] = useState("");

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

    const loadRequests = useCallback(async () => {
        setLoadingRequests(true);
        try {
            const reqQ = query(collection(db, "passwordResetRequests"), orderBy("requestedAt", "desc"));
            const snap = await getDocs(reqQ);
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setResetRequests(data);
        } catch (err) {
            console.error("Failed to load password reset requests:", err);
        } finally {
            setLoadingRequests(false);
        }
    }, []);

    useEffect(() => { 
        load(); 
        loadRequests();
    }, [load, loadRequests]);

    const handleRowClick = (params) => {
        const r = params.row;
        setEditId(r.id);
        setFormError("");
        reset({
            firstName: r.firstName || "", lastName: r.lastName || "",
            department: r.department || "", designation: r.designation || "",
            email: r.email || "", mobileNumber: r.mobileNumber || "",
            dateOfJoin: r.dateOfJoin || "", role: r.role || "Employee",
            password: "", status: r.status || "Active"
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
                // Remove password from edit payload
                const { password, ...updateData } = data;
                await employeeService.updateEmployee(editId, updateData);
                showNotification("Employee updated successfully.", "success");
            } else {
                if (!data.password) {
                    throw new Error("Initial password is required for new registration.");
                }
                if (data.password.length < 6) {
                    throw new Error("Initial password must be at least 6 characters.");
                }
                await employeeService.createEmployee(data);
                showNotification("Employee and auth account created successfully.", "success");
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

    const handleApproveConfirm = async (e) => {
        e.preventDefault();
        if (!tempPassword) {
            setApprovalError("Temporary password is required.");
            return;
        }
        if (tempPassword.length < 6) {
            setApprovalError("Password must be at least 6 characters.");
            return;
        }
        setApproving(true);
        setApprovalError("");
        try {
            await authService.approveResetRequest(approvalTarget.id, approvalTarget.email, tempPassword);
            showNotification(`Password reset request for "${approvalTarget.email}" approved.`, "success");
            setApprovalTarget(null);
            setTempPassword("");
            loadRequests();
            load();
        } catch (err) {
            setApprovalError(err.message || "Failed to approve password reset.");
        } finally {
            setApproving(false);
        }
    };

    const requestColumns = [
        { field: "email", headerName: "Employee Email", flex: 1.5, renderCell: (p) => (
            <Box sx={{ py: 1 }}>
                <Typography variant="body2" fontWeight="700">{p.row.fullName || "—"}</Typography>
                <Typography variant="caption" color="text.secondary">{p.row.email}</Typography>
            </Box>
        )},
        { field: "requestedAt", headerName: "Requested Date", flex: 1, renderCell: (p) => (
            <Typography variant="caption" color="text.secondary" fontWeight="500">
                {p.value ? new Date(p.value).toLocaleString() : "—"}
            </Typography>
        )},
        { field: "status", headerName: "Status", width: 120, renderCell: (p) => (
            <Chip 
                label={p.value} 
                size="small" 
                color={p.value === "Approved" ? "success" : "warning"} 
                sx={{ fontWeight: 600 }} 
            />
        )},
        { field: "actions", headerName: "", width: 90, sortable: false, renderCell: (p) => (
            p.row.status === "Pending" ? (
                <Tooltip title="Approve & Reset Password">
                    <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setApprovalError("");
                            setTempPassword("");
                            setApprovalTarget(p.row); 
                        }}
                    >
                        <VpnKey fontSize="small" />
                    </IconButton>
                </Tooltip>
            ) : null
        )},
    ];

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
        { field: "role", headerName: "Role", width: 110, renderCell: (p) => (
            <Chip label={p.value || "Employee"} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
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
                
                <AppSelect 
                    name="role" 
                    control={control} 
                    label="Role *" 
                    options={[
                        { value: "Admin", label: "Admin" },
                        { value: "Manager", label: "Manager" },
                        { value: "Employee", label: "Employee" }
                    ]} 
                    size="small" 
                />

                {!editId && (
                    <AppTextField 
                        name="password" 
                        control={control} 
                        label="Initial Password *" 
                        type="password" 
                        size="small" 
                    />
                )}

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

    const gridPanelContent = (
        <Box display="flex" flexDirection="column" gap={2} height="100%">
            <Tabs 
                value={tabIndex} 
                onChange={(e, val) => setTabIndex(val)}
                sx={{ borderBottom: 1, borderColor: "divider" }}
            >
                <Tab label="Employee Directory" sx={{ fontWeight: 600 }} />
                <Tab 
                    label={`Password Reset Requests (${resetRequests.filter(r => r.status === "Pending").length})`} 
                    sx={{ fontWeight: 600 }} 
                />
            </Tabs>
            
            {tabIndex === 0 ? (
                <AppDataGrid 
                    rows={rows} 
                    columns={columns} 
                    loading={loading} 
                    onRowClick={handleRowClick} 
                    exportFileName="employees.csv" 
                    placeholder="Search employees..." 
                />
            ) : (
                <AppDataGrid 
                    rows={resetRequests} 
                    columns={requestColumns} 
                    loading={loadingRequests} 
                    exportFileName="reset_requests.csv" 
                    placeholder="Search requests..." 
                />
            )}
        </Box>
    );

    return (
        <>
            <MasterPage
                title="Employees"
                subtitle="Manage employee records with assignments and profiles"
                breadcrumbs={[{ label: "Master Registry" }, { label: "Employees" }]}
                action={<AppButton startIcon={<Add />} onClick={handleNew}>New Employee</AppButton>}
                gridPanel={gridPanelContent}
                formPanel={formPanel}
            />
            <DeleteDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm}
                loading={deleting}
                message={`Delete employee "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? All associated records will be affected.`} />

            <Dialog 
                open={!!approvalTarget} 
                onClose={() => !approving && setApprovalTarget(null)}
                fullWidth
                maxWidth="xs"
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <Box component="form" onSubmit={handleApproveConfirm}>
                    <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Approve Password Reset</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Enter a temporary password for <strong>{approvalTarget?.fullName}</strong> ({approvalTarget?.email}). 
                            The user will be required to change this password when they sign in.
                        </Typography>
                        {approvalError && <Alert severity="error" sx={{ borderRadius: 2 }}>{approvalError}</Alert>}
                        <TextField
                            fullWidth
                            size="small"
                            label="Temporary Password"
                            type="text"
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            disabled={approving}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                        <AppButton 
                            variant="outlined" 
                            color="inherit" 
                            onClick={() => setApprovalTarget(null)}
                            disabled={approving}
                        >
                            Cancel
                        </AppButton>
                        <AppButton 
                            type="submit" 
                            loading={approving}
                        >
                            Confirm Approval
                        </AppButton>
                    </DialogActions>
                </Box>
            </Dialog>
        </>
    );
}

export default Employees;
