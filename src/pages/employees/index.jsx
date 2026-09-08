import React, { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  DatePicker,
  Tooltip,
  Typography,
  Alert,
  Popconfirm,
  Tabs,
  Avatar,
  Badge
} from "antd";
import {
  UserAddOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  TeamOutlined,
  MailOutlined,
  PhoneOutlined,
  ClearOutlined,
  FileExcelOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNotification } from "../../contexts/NotificationContext";
import employeeService from "../../services/employeeService";
import departmentService from "../../services/departmentService";
import designationService from "../../services/designationService";
import authService from "../../services/authService";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebase";

const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "On Leave", label: "On Leave" },
  { value: "Terminated", label: "Terminated" }
];

const ROLE_OPTIONS = [
  { value: "Admin", label: "Admin" },
  { value: "Manager", label: "Manager" },
  { value: "Employee", label: "Employee" }
];

export default function Employees() {
  const { showNotification } = useNotification();
  const [form] = Form.useForm();
  const [approvalForm] = Form.useForm();

  const [activeTab, setActiveTab] = useState("directory");
  const [employees, setEmployees] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Search and Filter
  const [searchText, setSearchText] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState(null);
  const [roleFilter, setRoleFilter] = useState(null);

  // Employee Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Approval Modal
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [approving, setApproving] = useState(false);
  const [approvalError, setApprovalError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, depts, desigs] = await Promise.all([
        employeeService.getEmployees(),
        departmentService.getDepartments(),
        designationService.getDesignations()
      ]);
      setEmployees(emps);
      setDepartments(depts.filter((d) => d.active));
      setDesignations(desigs.filter((d) => d.active));
    } catch {
      showNotification("Failed to load employee directory.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const reqQ = query(collection(db, "passwordResetRequests"), orderBy("requestedAt", "desc"));
      const snap = await getDocs(reqQ);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setResetRequests(data);
    } catch (err) {
      console.error("Failed to load reset requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadRequests();
  }, [loadData, loadRequests]);

  // Open Create
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormError("");
    form.resetFields();
    form.setFieldsValue({
      role: "Employee",
      status: "Active"
    });
    setModalOpen(true);
  };

  // Open Edit
  const handleOpenEdit = (record) => {
    setEditingEmployee(record);
    setFormError("");
    form.resetFields();
    form.setFieldsValue({
      firstName: record.firstName,
      lastName: record.lastName,
      companyName: record.companyName || "Ravi",
      email: record.email,
      mobileNumber: record.mobileNumber,
      department: record.department,
      designation: record.designation,
      role: record.role || "Employee",
      status: record.status || "Active",
      dateOfJoin: record.dateOfJoin ? dayjs(record.dateOfJoin) : null
    });
    setModalOpen(true);
  };

  // Submit Create / Edit
  const handleFormSubmit = async (values) => {
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...values,
        dateOfJoin: values.dateOfJoin ? values.dateOfJoin.format("YYYY-MM-DD") : ""
      };

      if (editingEmployee) {
        const { password, ...updatePayload } = payload;
        await employeeService.updateEmployee(editingEmployee.id, updatePayload);
        showNotification("Employee profile updated successfully.", "success");
      } else {
        if (!values.password || values.password.length < 6) {
          throw new Error("Initial password must be at least 6 characters.");
        }
        await employeeService.createEmployee(payload);
        showNotification("Employee and authentication account created.", "success");
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      setFormError(e.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (id, fullName) => {
    try {
      await employeeService.deleteEmployee(id);
      showNotification(`Employee "${fullName}" deleted.`, "success");
      loadData();
    } catch (e) {
      showNotification(e.message || "Failed to delete employee.", "error");
    }
  };

  // Approve Password Reset
  const handleOpenApprove = (record) => {
    setApprovalTarget(record);
    setApprovalError("");
    approvalForm.resetFields();
    approvalForm.setFieldsValue({
      tempPassword: "TempPassword123!"
    });
    setApprovalOpen(true);
  };

  const handleApproveSubmit = async (values) => {
    setApproving(true);
    setApprovalError("");
    try {
      await authService.approveResetRequest(approvalTarget.id, approvalTarget.email, values.tempPassword);
      showNotification(`Password reset request for "${approvalTarget.email}" approved.`, "success");
      setApprovalOpen(false);
      loadRequests();
      loadData();
    } catch (e) {
      setApprovalError(e.message || "Approval failed.");
    } finally {
      setApproving(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) return;
    const headers = ["Employee ID", "First Name", "Last Name", "Email", "Mobile", "Department", "Designation", "Role", "Status", "Date Of Join"];
    const rows = filteredEmployees.map((e) => [
      `"${e.employeeId || ""}"`,
      `"${e.firstName || ""}"`,
      `"${e.lastName || ""}"`,
      `"${e.email || ""}"`,
      `"${e.mobileNumber || ""}"`,
      `"${getDepartmentName(e.department)}"`,
      `"${getDesignationName(e.designation)}"`,
      `"${e.role || ""}"`,
      `"${e.status || ""}"`,
      `"${e.dateOfJoin || ""}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `employees_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDepartmentName = (id) => departments.find((d) => d.id === id)?.name || id || "—";
  const getDesignationName = (id) => designations.find((d) => d.id === id)?.name || id || "—";

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "success";
      case "On Leave": return "warning";
      case "Terminated": return "error";
      default: return "default";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Admin": return "red";
      case "Manager": return "purple";
      case "Employee": return "blue";
      default: return "default";
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
    const matchSearch =
      !searchText ||
      fullName.includes(searchText.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.mobileNumber?.includes(searchText);

    const matchDept = !departmentFilter || emp.department === departmentFilter;
    const matchRole = !roleFilter || emp.role === roleFilter;

    return matchSearch && matchDept && matchRole;
  });

  const pendingRequestsCount = resetRequests.filter((r) => r.status === "Pending").length;

  const employeeColumns = [
    {
      title: "Employee Profile",
      key: "profile",
      render: (_, record) => {
        const initials = `${record.firstName?.[0] || ""}${record.lastName?.[0] || ""}`.toUpperCase();
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar style={{ backgroundColor: "#6366f1", fontWeight: 700, flexShrink: 0 }}>
              {initials || <TeamOutlined />}
            </Avatar>
            <div>
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.92rem" }}>
                {record.firstName} {record.lastName}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                {record.email}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      title: "Company",
      dataIndex: "companyName",
      key: "companyName",
      render: (comp) => (
        <Tag color="blue" style={{ fontWeight: 600 }}>
          {comp || "Ravi"}
        </Tag>
      )
    },
    {
      title: "Employee ID",
      dataIndex: "employeeId",
      key: "employeeId",
      render: (id) => (
        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#475569", background: "#f1f5f9", padding: "3px 8px", borderRadius: 6 }}>
          {id || "—"}
        </span>
      )
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (deptId) => (
        <Tag color="purple" style={{ fontWeight: 600 }}>
          {getDepartmentName(deptId)}
        </Tag>
      )
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      render: (desigId) => (
        <span style={{ fontWeight: 500, color: "#334155" }}>
          {getDesignationName(desigId)}
        </span>
      )
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={getRoleColor(role || "Employee")}>
          {role || "Employee"}
        </Tag>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status || "Active"}
        </Tag>
      )
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Profile">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#10b981", fontSize: 16 }} />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Employee">
            <Popconfirm
              title="Delete Employee"
              description={`Delete "${record.firstName} ${record.lastName}"? Account access will be revoked.`}
              onConfirm={() => handleDelete(record.id, `${record.firstName} ${record.lastName}`)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" danger icon={<DeleteOutlined style={{ fontSize: 16 }} />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  const requestColumns = [
    {
      title: "Requester Email",
      dataIndex: "email",
      key: "email",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 700, color: "#0f172a" }}>{record.fullName || "Staff Member"}</div>
          <div style={{ color: "#64748b", fontSize: "0.8rem" }}>{text}</div>
        </div>
      )
    },
    {
      title: "Requested Date",
      dataIndex: "requestedAt",
      key: "requestedAt",
      render: (date) => (
        <span style={{ fontSize: "0.85rem", color: "#475569" }}>
          {date ? new Date(date).toLocaleString() : "—"}
        </span>
      )
    },
    {
      title: "Request Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Approved" ? "success" : "warning"} style={{ fontWeight: 600 }}>
          {status || "Pending"}
        </Tag>
      )
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        record.status === "Pending" ? (
          <Button
            type="primary"
            icon={<KeyOutlined />}
            size="small"
            onClick={() => handleOpenApprove(record)}
            style={{
              borderRadius: 6,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              border: "none",
              fontWeight: 600
            }}
          >
            Approve & Reset
          </Button>
        ) : (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Approved
          </Tag>
        )
      )
    }
  ];

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Page Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Employees & Access Control
          </Title>
          <Text type="secondary" style={{ fontSize: "0.92rem" }}>
            Maintain corporate staff profiles, role privileges, and password reset requests.
          </Text>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleExportCSV}
              style={{ borderRadius: 8, fontWeight: 600 }}
            >
              Export CSV
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleOpenCreate}
              size="large"
              style={{
                borderRadius: 8,
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                border: "none",
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)"
              }}
            >
              New Employee
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Tabs */}
      <Card
        bordered
        style={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
        styles={{ body: { padding: "12px 24px 24px 24px" } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={[
            {
              key: "directory",
              label: (
                <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <TeamOutlined /> Employee Directory ({employees.length})
                </span>
              ),
              children: (
                <div>
                  {/* Search and Filters */}
                  <Row gutter={[16, 16]} style={{ marginBottom: 20, marginTop: 8 }} align="middle">
                    <Col xs={24} sm={10} md={8}>
                      <Input
                        prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                        placeholder="Search by name, email, badge ID..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                        style={{ borderRadius: 8 }}
                      />
                    </Col>
                    <Col xs={12} sm={7} md={5}>
                      <Select
                        placeholder="Filter by Department"
                        value={departmentFilter}
                        onChange={(val) => setDepartmentFilter(val)}
                        allowClear
                        style={{ width: "100%", borderRadius: 8 }}
                      >
                        {departments.map((d) => (
                          <Option key={d.id} value={d.id}>
                            {d.name}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col xs={12} sm={7} md={5}>
                      <Select
                        placeholder="Filter by Role"
                        value={roleFilter}
                        onChange={(val) => setRoleFilter(val)}
                        allowClear
                        style={{ width: "100%", borderRadius: 8 }}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <Option key={r.value} value={r.value}>
                            {r.label}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    {(searchText || departmentFilter || roleFilter) && (
                      <Col>
                        <Button
                          icon={<ClearOutlined />}
                          onClick={() => {
                            setSearchText("");
                            setDepartmentFilter(null);
                            setRoleFilter(null);
                          }}
                        >
                          Clear
                        </Button>
                      </Col>
                    )}
                  </Row>

                  <Table
                    dataSource={filteredEmployees}
                    columns={employeeColumns}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `Total ${total} employees`
                    }}
                    scroll={{ x: 900 }}
                  />
                </div>
              )
            },
            {
              key: "requests",
              label: (
                <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <KeyOutlined /> Password Reset Requests
                  {pendingRequestsCount > 0 && (
                    <Badge count={pendingRequestsCount} style={{ backgroundColor: "#ef4444" }} />
                  )}
                </span>
              ),
              children: (
                <div style={{ marginTop: 12 }}>
                  <Table
                    dataSource={resetRequests}
                    columns={requestColumns}
                    rowKey="id"
                    loading={loadingRequests}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: "No pending password reset requests" }}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* Register / Edit Employee Modal */}
      <Modal
        title={
          <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a" }}>
            {editingEmployee ? "Edit Employee Profile" : "Register New Employee"}
          </span>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={680}
        centered
        styles={{ content: { borderRadius: 16, background: "#ffffff" } }}
      >
        {formError && <Alert message={formError} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          requiredMark={true}
          style={{ marginTop: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>First Name</span>}
                rules={[{ required: true, message: "First Name is required." }]}
              >
                <Input placeholder="John" size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Last Name</span>}
                rules={[{ required: true, message: "Last Name is required." }]}
              >
                <Input placeholder="Doe" size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="companyName"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Company Entity</span>}
                rules={[{ required: true, message: "Company is required." }]}
                initialValue="Ravi"
              >
                <Select size="large" style={{ borderRadius: 8 }} showSearch allowClear>
                  {["Ravi", "Eco Solutions", "Hayleys", "Corporate HQ"].map((c) => (
                    <Option key={c} value={c}>
                      🏢 {c}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Email Address</span>}
                rules={[
                  { required: true, message: "Email is required." },
                  { type: "email", message: "Please enter a valid email." }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="john.doe@company.com" size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="mobileNumber"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Mobile Number</span>}
                rules={[{ required: true, message: "Mobile number is required." }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="+1 (555) 000-0000" size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="department"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Department</span>}
                rules={[{ required: true, message: "Department is required." }]}
              >
                <Select placeholder="Select department" size="large" style={{ borderRadius: 8 }}>
                  {departments.map((d) => (
                    <Option key={d.id} value={d.id}>
                      {d.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="designation"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Designation</span>}
                rules={[{ required: true, message: "Designation is required." }]}
              >
                <Select placeholder="Select designation" size="large" style={{ borderRadius: 8 }}>
                  {designations.map((d) => (
                    <Option key={d.id} value={d.id}>
                      {d.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>System Role</span>}
                rules={[{ required: true, message: "Role is required." }]}
              >
                <Select placeholder="Select system role" size="large" style={{ borderRadius: 8 }}>
                  {ROLE_OPTIONS.map((r) => (
                    <Option key={r.value} value={r.value}>
                      {r.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Employment Status</span>}
                rules={[{ required: true, message: "Status is required." }]}
              >
                <Select placeholder="Select status" size="large" style={{ borderRadius: 8 }}>
                  {STATUS_OPTIONS.map((s) => (
                    <Option key={s.value} value={s.value}>
                      {s.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dateOfJoin"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Date of Joining</span>}
                rules={[{ required: true, message: "Date of joining is required." }]}
              >
                <DatePicker size="large" style={{ width: "100%", borderRadius: 8 }} />
              </Form.Item>
            </Col>
            {!editingEmployee && (
              <Col span={12}>
                <Form.Item
                  name="password"
                  label={<span style={{ color: "#475569", fontWeight: 600 }}>Initial Password</span>}
                  rules={[
                    { required: true, message: "Initial password is required." },
                    { min: 6, message: "Minimum 6 characters." }
                  ]}
                >
                  <Input.Password placeholder="••••••••" size="large" style={{ borderRadius: 8 }} />
                </Form.Item>
              </Col>
            )}
          </Row>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
            <Button onClick={() => setModalOpen(false)} style={{ borderRadius: 8 }} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              style={{
                borderRadius: 8,
                fontWeight: 700,
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                border: "none",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)"
              }}
            >
              {editingEmployee ? "Save Profile" : "Create Account"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Password Reset Approval Modal */}
      <Modal
        title={
          <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a" }}>
            Approve Password Reset Request
          </span>
        }
        open={approvalOpen}
        onCancel={() => setApprovalOpen(false)}
        footer={null}
        width={440}
        centered
        styles={{ content: { borderRadius: 16, background: "#ffffff" } }}
      >
        {approvalError && <Alert message={approvalError} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

        <div style={{ marginTop: 8, marginBottom: 16 }}>
          <Text type="secondary">
            Assign a temporary password for <strong>{approvalTarget?.fullName}</strong> ({approvalTarget?.email}). They will be prompted to change this on their next sign in.
          </Text>
        </div>

        <Form
          form={approvalForm}
          layout="vertical"
          onFinish={handleApproveSubmit}
        >
          <Form.Item
            name="tempPassword"
            label={<span style={{ color: "#475569", fontWeight: 600 }}>Temporary Password</span>}
            rules={[
              { required: true, message: "Temporary password is required." },
              { min: 6, message: "Minimum 6 characters." }
            ]}
          >
            <Input size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <Button onClick={() => setApprovalOpen(false)} style={{ borderRadius: 8 }} disabled={approving}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={approving}
              style={{
                borderRadius: 8,
                fontWeight: 700,
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                border: "none"
              }}
            >
              Confirm & Issue Password
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
