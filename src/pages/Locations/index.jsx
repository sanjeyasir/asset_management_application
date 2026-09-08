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
  EnvironmentOutlined,
  FileExcelOutlined
} from "@ant-design/icons";
import { useNotification } from "../../contexts/NotificationContext";
import locationService from "../../services/locationService";

const { Title, Text } = Typography;

export default function Locations() {
  const { showNotification } = useNotification();
  const [form] = Form.useForm();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await locationService.getLocations();
      setLocations(data);
    } catch {
      showNotification("Failed to load locations.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingLoc(null);
    setFormError("");
    form.resetFields();
    form.setFieldsValue({ active: true });
    setModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingLoc(record);
    setFormError("");
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      active: record.active ?? true
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (values) => {
    setSaving(true);
    setFormError("");
    try {
      if (editingLoc) {
        await locationService.updateLocation(editingLoc.id, values);
        showNotification("Location updated successfully.", "success");
      } else {
        await locationService.createLocation(values);
        showNotification("New location registered successfully.", "success");
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      setFormError(e.message || "Failed to save location.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await locationService.deleteLocation(id);
      showNotification(`Location "${name}" deleted.`, "success");
      loadData();
    } catch (e) {
      showNotification(e.message || "Failed to delete location.", "error");
    }
  };

  const handleExportCSV = () => {
    if (filteredLocations.length === 0) return;
    const headers = ["Location Name", "Status"];
    const rows = filteredLocations.map((l) => [
      `"${l.name || ""}"`,
      `"${l.active ? "Active" : "Inactive"}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `locations_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLocations = locations.filter((l) => {
    if (!searchText) return true;
    return l.name?.toLowerCase().includes(searchText.toLowerCase());
  });

  const columns = [
    {
      title: "Location / Site Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              padding: "8px",
              borderRadius: 8,
              background: "rgba(236, 72, 153, 0.08)",
              color: "#ec4899",
              display: "flex"
            }}
          >
            <EnvironmentOutlined style={{ fontSize: 18 }} />
          </div>
          <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.92rem" }}>
            {text}
          </span>
        </div>
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
          <Tooltip title="Edit Location">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#10b981", fontSize: 16 }} />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Location">
            <Popconfirm
              title="Delete Location"
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
            Locations & Sites
          </Title>
          <Text type="secondary" style={{ fontSize: "0.92rem" }}>
            Manage physical office branches, warehouses, server rooms, and operational facilities.
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
              New Location
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Filter Bar */}
      <Card
        bordered
        style={{ marginBottom: 20, borderRadius: 14, border: "1px solid #e2e8f0" }}
        styles={{ body: { padding: "16px 20px" } }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Search locations..."
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
          dataSource={filteredLocations}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={
          <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0f172a" }}>
            {editingLoc ? "Edit Location" : "Add New Location"}
          </span>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={460}
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
            label={<span style={{ color: "#475569", fontWeight: 600 }}>Location Name</span>}
            rules={[{ required: true, message: "Location Name is required." }]}
          >
            <Input placeholder="e.g. Headquarters - Floor 3" size="large" style={{ borderRadius: 8 }} />
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
              {editingLoc ? "Save Changes" : "Create Location"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
