import React, { useState, useEffect, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Input,
  Tag,
  Space,
  Modal,
  Form,
  Switch,
  Tooltip,
  Typography,
  Alert,
  Popconfirm
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  FileExcelOutlined
} from "@ant-design/icons";
import { useNotification } from "../../contexts/NotificationContext";
import departmentService from "../../services/departmentService";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function Departments() {
  const { showNotification } = useNotification();
  const [form] = Form.useForm();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await departmentService.getDepartments();
      setDepartments(data);
    } catch {
      showNotification("Failed to load departments.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormError("");
    form.resetFields();
    form.setFieldsValue({ active: true });
    setModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingDept(record);
    setFormError("");
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description || "",
      active: record.active ?? true
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (values) => {
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...values,
        code: values.code ? values.code.toUpperCase() : ""
      };
      if (editingDept) {
        await departmentService.updateDepartment(editingDept.id, payload);
        showNotification("Department updated successfully.", "success");
      } else {
        await departmentService.createDepartment(payload);
        showNotification("New department registered successfully.", "success");
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      setFormError(e.message || "Failed to save department.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await departmentService.deleteDepartment(id);
      showNotification(`Department "${name}" deleted.`, "success");
      loadData();
    } catch (e) {
      showNotification(e.message || "Failed to delete department.", "error");
    }
  };

  const handleExportCSV = () => {
    if (filteredDepartments.length === 0) return;
    const headers = ["Department Name", "Code", "Description", "Status"];
    const rows = filteredDepartments.map((d) => [
      `"${d.name || ""}"`,
      `"${d.code || ""}"`,
      `"${d.description || ""}"`,
      `"${d.active ? "Active" : "Inactive"}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `departments_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDepartments = departments.filter((d) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return d.name?.toLowerCase().includes(search) || d.code?.toLowerCase().includes(search) || d.description?.toLowerCase().includes(search);
  });

  const columns = [
    {
      title: "Department Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              padding: "8px",
              borderRadius: 8,
              background: "rgba(139, 92, 246, 0.08)",
              color: "#8b5cf6",
              display: "flex"
            }}
          >
            <ApartmentOutlined style={{ fontSize: 18 }} />
          </div>
          <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.92rem" }}>
            {text}
          </span>
        </div>
      )
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (code) => (
        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#6366f1", background: "rgba(99, 102, 241, 0.08)", padding: "3px 8px", borderRadius: 6 }}>
          {code || "—"}
        </span>
      )
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (desc) => (
        <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
          {desc || "—"}
        </span>
      )
    },
    {
      title: "Status",
      dataIndex: "active",
      key: "active",
      render: (active) => (
        <Tag color={active ? "success" : "default"} style={{ fontWeight: 600 }}>
          {active ? "Active" : "Inactive"}
        </Tag>
      )
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Department">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#10b981", fontSize: 16 }} />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Department">
            <Popconfirm
              title="Delete Department"
              description={`Delete "${record.name}"? This action cannot be undone.`}
              onConfirm={() => handleDelete(record.id, record.name)}
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

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Page Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Departments
          </Title>
          <Text type="secondary" style={{ fontSize: "0.92rem" }}>
            Manage corporate organizational units, divisions, and asset ownership branches.
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
              icon={<PlusOutlined />}
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
              New Department
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Filter and Search Bar */}
      <Card
        bordered
        style={{ marginBottom: 20, borderRadius: 14, border: "1px solid #e2e8f0" }}
        styles={{ body: { padding: "16px 20px" } }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Search departments by name or code..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>
        </Row>
      </Card>

      {/* Table Card */}
      <Card
        bordered
        style={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          dataSource={filteredDepartments}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create / Edit Department Modal */}
      <Modal
        title={
          <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a" }}>
            {editingDept ? "Edit Department" : "Add New Department"}
          </span>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={500}
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
          <Form.Item
            name="name"
            label={<span style={{ color: "#475569", fontWeight: 600 }}>Department Name</span>}
            rules={[{ required: true, message: "Department Name is required." }]}
          >
            <Input placeholder="e.g. Information Technology" size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            name="code"
            label={<span style={{ color: "#475569", fontWeight: 600 }}>Department Code</span>}
            rules={[{ required: true, message: "Department Code is required." }]}
          >
            <Input placeholder="e.g. IT" size="large" style={{ borderRadius: 8, textTransform: "uppercase" }} />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ color: "#475569", fontWeight: 600 }}>Description (Optional)</span>}
          >
            <TextArea placeholder="Brief description of department function" rows={3} style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            name="active"
            valuePropName="checked"
            label={<span style={{ color: "#475569", fontWeight: 600 }}>Active Status</span>}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
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
              {editingDept ? "Save Changes" : "Create Department"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
