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
  TagsOutlined,
  ApartmentOutlined,
  FileExcelOutlined
} from "@ant-design/icons";
import { useNotification } from "../../contexts/NotificationContext";
import assetCategoryService from "../../services/assetCategoryService";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function AssetCategories() {
  const { showNotification } = useNotification();
  const [form] = Form.useForm();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assetCategoryService.getCategories();
      setCategories(data);
    } catch {
      showNotification("Failed to load asset categories.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingCat(null);
    setFormError("");
    form.resetFields();
    form.setFieldsValue({ active: true, parentCategory: null });
    setModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setEditingCat(record);
    setFormError("");
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      parentCategory: record.parentCategory || null,
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
        parentCategory: values.parentCategory || ""
      };
      if (editingCat) {
        await assetCategoryService.updateCategory(editingCat.id, payload);
        showNotification("Category updated successfully.", "success");
      } else {
        await assetCategoryService.createCategory(payload);
        showNotification("New category created successfully.", "success");
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      setFormError(e.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    try {
      await assetCategoryService.deleteCategory(id);
      showNotification(`Category "${name}" deleted.`, "success");
      loadData();
    } catch (e) {
      showNotification(e.message || "Failed to delete category.", "error");
    }
  };

  const handleExportCSV = () => {
    if (filteredCategories.length === 0) return;
    const headers = ["Category Name", "Parent Category", "Description", "Status"];
    const rows = filteredCategories.map((c) => [
      `"${c.name || ""}"`,
      `"${getParentName(c.parentCategory) || "Root"}"`,
      `"${c.description || ""}"`,
      `"${c.active ? "Active" : "Inactive"}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `asset_categories_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getParentName = (parentId) => categories.find((c) => c.id === parentId)?.name || null;

  const parentOptions = categories.filter((c) => !editingCat || c.id !== editingCat.id);

  const filteredCategories = categories.filter((c) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return c.name?.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search);
  });

  const columns = [
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
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
            <TagsOutlined style={{ fontSize: 18 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.92rem" }}>
              {text}
            </div>
            {record.parentCategory && (
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                ↳ Subcategory of {getParentName(record.parentCategory) || "Parent"}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: "Hierarchy Level",
      dataIndex: "parentCategory",
      key: "parentCategory",
      render: (parentId) => (
        parentId ? (
          <Tag color="purple" style={{ fontWeight: 600 }}>
            {getParentName(parentId) || "Sub-Category"}
          </Tag>
        ) : (
          <Tag color="blue" style={{ fontWeight: 600 }}>
            Root Category
          </Tag>
        )
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
          <Tooltip title="Edit Category">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#10b981", fontSize: 16 }} />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Category">
            <Popconfirm
              title="Delete Category"
              description={`Delete "${record.name}"? Ensure no assets or subcategories are attached.`}
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
            Asset Categories
          </Title>
          <Text type="secondary" style={{ fontSize: "0.92rem" }}>
            Define hierarchical classifications, parent/child groups, and equipment category taxonomies.
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
              New Category
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
              placeholder="Search categories..."
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
          dataSource={filteredCategories}
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
            {editingCat ? "Edit Category" : "Add New Category"}
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
            label={<span style={{ color: "#475569", fontWeight: 600 }}>Category Name</span>}
            rules={[{ required: true, message: "Category Name is required." }]}
          >
            <Input placeholder="e.g. Laptops & Workstations" size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            name="parentCategory"
            label={<span style={{ color: "#475569", fontWeight: 600 }}>Parent Category (Optional)</span>}
          >
            <Select placeholder="Leave empty for Root Category" allowClear size="large" style={{ borderRadius: 8 }}>
              {parentOptions.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ color: "#475569", fontWeight: 600 }}>Description (Optional)</span>}
          >
            <TextArea placeholder="Category description or usage guidelines" rows={3} style={{ borderRadius: 8 }} />
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
              {editingCat ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
