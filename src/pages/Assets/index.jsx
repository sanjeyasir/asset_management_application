import React, { useState, useEffect, useCallback, useRef } from "react";
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
  InputNumber,
  Tooltip,
  Typography,
  Alert,
  Popconfirm,
  Tabs,
  Radio,
  Divider,
  Segmented
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  QrcodeOutlined,
  TableOutlined,
  AppstoreOutlined,
  UserAddOutlined,
  LaptopOutlined,
  DesktopOutlined,
  CloudServerOutlined,
  WifiOutlined,
  VideoCameraOutlined,
  ApiOutlined,
  BarcodeOutlined,
  FileExcelOutlined,
  ClearOutlined,
  EyeOutlined,
  BankOutlined,
  FilterOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNotification } from "../../contexts/NotificationContext";
import assetService from "../../services/assetService";
import assetCategoryService from "../../services/assetCategoryService";
import departmentService from "../../services/departmentService";
import locationService from "../../services/locationService";
import employeeService from "../../services/employeeService";

import HandsontableSpreadsheet from "./HandsontableSpreadsheet";
import AssetDetailDrawer from "./AssetDetailDrawer";
import QuickEmployeeModal from "./QuickEmployeeModal";

const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_OPTIONS = [
  { value: "Available", label: "Available" },
  { value: "Assigned", label: "Assigned" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Repair", label: "Repair" },
  { value: "Disposed", label: "Disposed" },
  { value: "Lost", label: "Lost" }
];

const COMPANY_OPTIONS = ["Ravi", "Eco Solutions", "Hayleys", "Corporate HQ"];

const CATEGORY_TABS = [
  { key: "all", label: "All Assets", icon: <AppstoreOutlined /> },
  { key: "laptops", label: "Laptops", icon: <LaptopOutlined /> },
  { key: "desktops", label: "Desktops", icon: <DesktopOutlined /> },
  { key: "servers", label: "Servers", icon: <CloudServerOutlined /> },
  { key: "network", label: "Network Equipments", icon: <WifiOutlined /> },
  { key: "projectors", label: "Projectors", icon: <VideoCameraOutlined /> },
  { key: "dongles", label: "Dongles", icon: <ApiOutlined /> },
  { key: "other", label: "Other Assets", icon: <BarcodeOutlined /> }
];

export default function Assets() {
  const { showNotification } = useNotification();
  const [form] = Form.useForm();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);

  // View state: "spreadsheet" | "table"
  const [viewMode, setViewMode] = useState("spreadsheet");
  const [activeTab, setActiveTab] = useState("all");

  // Filter and Search states
  const [searchText, setSearchText] = useState("");
  const [companyFilter, setCompanyFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  // Asset Details Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Quick Employee Modal
  const [quickEmpModalOpen, setQuickEmpModalOpen] = useState(false);

  // Register / Edit Asset Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Watch selected category in form for dynamic fields
  const [selectedFormCategory, setSelectedFormCategory] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [assetsData, cats, depts, locs, emps] = await Promise.all([
        assetService.getAssets(),
        assetCategoryService.getCategories(),
        departmentService.getDepartments(),
        locationService.getLocations(),
        employeeService.getEmployees()
      ]);
      setAssets(assetsData);
      setCategories(cats.filter((c) => c.active !== false));
      setDepartments(depts.filter((d) => d.active !== false));
      setLocations(locs.filter((l) => l.active !== false));
      setEmployees(emps.filter((e) => e.status !== "Inactive"));
    } catch (e) {
      showNotification("Failed to load asset data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Create Asset Modal
  const handleOpenCreate = (presetCategory = null) => {
    setEditingAsset(null);
    setFormError("");
    form.resetFields();

    let defaultCatId = "";
    if (presetCategory && presetCategory !== "all") {
      const matched = categories.find((c) => c.name.toLowerCase().includes(presetCategory.toLowerCase()));
      if (matched) defaultCatId = matched.id;
    } else if (categories.length > 0) {
      defaultCatId = categories[0].id;
    }

    setSelectedFormCategory(defaultCatId);
    form.setFieldsValue({
      category: defaultCatId,
      status: "Available",
      companyName: "Ravi"
    });
    setModalOpen(true);
  };

  // Open Edit Asset Modal
  const handleOpenEdit = (record) => {
    setEditingAsset(record);
    setFormError("");
    form.resetFields();
    setSelectedFormCategory(record.category || "");
    form.setFieldsValue({
      assetName: record.assetName,
      serialNumber: record.serialNumber,
      faNumber: record.faNumber,
      category: record.category,
      companyName: record.companyName || "Ravi",
      department: record.department,
      location: record.location,
      status: record.status || "Available",
      assignedEmployee: record.assignedEmployee || undefined,
      assignedEmployeeName: record.assignedEmployeeName || "",
      assignedEmployeeEmail: record.assignedEmployeeEmail || "",
      hostname: record.hostname || "",
      brand: record.brand || "",
      model: record.model || "",
      processor: record.processor || "",
      generation: record.generation || "",
      screenSize: record.screenSize || "",
      ram: record.ram || "",
      storage: record.storage || "",
      graphicCard: record.graphicCard || "",
      operatingSystem: record.operatingSystem || "",
      windowsVersion: record.windowsVersion || "",
      previousUser: record.previousUser || "",
      monitorBrand: record.monitorBrand || "",
      monitorModel: record.monitorModel || "",
      monitorSerialNumber: record.monitorSerialNumber || "",
      monitorFaNumber: record.monitorFaNumber || "",
      imeiNumber: record.imeiNumber || "",
      simNumber: record.simNumber || "",
      simImeiNo: record.simImeiNo || "",
      packageName: record.packageName || "",
      amount: record.amount || "",
      activatedDate: record.activatedDate ? dayjs(record.activatedDate) : null,
      disconnectedDate: record.disconnectedDate ? dayjs(record.disconnectedDate) : null,
      purchaseDate: record.purchaseDate ? dayjs(record.purchaseDate) : null,
      supplierName: record.supplierName || record.vendor || "",
      invoiceNumber: record.invoiceNumber || "",
      aging: record.aging || "",
      purchaseCost: record.purchaseCost || 0,
      remarks: record.remarks || ""
    });
    setModalOpen(true);
  };

  // Submit Create / Edit Asset
  const handleFormSubmit = async (values) => {
    setSaving(true);
    setFormError("");
    try {
      let empName = values.assignedEmployeeName || "";
      let empEmail = values.assignedEmployeeEmail || "";
      let company = values.companyName || "";

      if (values.assignedEmployee) {
        const emp = employees.find((e) => e.id === values.assignedEmployee);
        if (emp) {
          empName = emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
          empEmail = emp.email || "";
          if (emp.companyName && !company) {
            company = emp.companyName;
          }
        }
      }

      const payload = {
        ...values,
        companyName: company,
        assignedEmployeeName: empName,
        assignedEmployeeEmail: empEmail,
        purchaseDate: values.purchaseDate ? values.purchaseDate.format("YYYY-MM-DD") : "",
        activatedDate: values.activatedDate ? values.activatedDate.format("YYYY-MM-DD") : "",
        disconnectedDate: values.disconnectedDate ? values.disconnectedDate.format("YYYY-MM-DD") : "",
        purchaseCost: Number(values.purchaseCost) || 0
      };

      if (editingAsset) {
        await assetService.updateAsset(editingAsset.id, payload);
        showNotification("Asset details updated successfully.", "success");
      } else {
        await assetService.createAsset(payload);
        showNotification("New asset registered with Serial & QR Code.", "success");
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      setFormError(e.message || "Failed to save asset.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Asset
  const handleDelete = async (id, name) => {
    try {
      await assetService.deleteAsset(id);
      showNotification(`Asset "${name || "Asset"}" deleted successfully.`, "success");
      loadData();
    } catch (e) {
      showNotification(e.message || "Delete failed.", "error");
    }
  };

  // Handle Quick Employee Created
  const handleEmployeeCreated = (newEmp) => {
    setEmployees((prev) => [...prev, newEmp]);
    form.setFieldsValue({
      assignedEmployee: newEmp.id,
      assignedEmployeeName: newEmp.fullName,
      assignedEmployeeEmail: newEmp.email,
      companyName: newEmp.companyName || form.getFieldValue("companyName")
    });
    showNotification(`Employee ${newEmp.fullName} (${newEmp.companyName}) created & selected.`, "success");
  };

  // Helper Name Resolvers
  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || id || "—";
  const getDepartmentName = (id) => departments.find((d) => d.id === id)?.name || id || "—";
  const getLocationName = (id) => locations.find((l) => l.id === id)?.name || id || "—";
  
  const getCustodianDisplay = (record) => {
    if (record.assignedEmployeeName) {
      return {
        name: record.assignedEmployeeName,
        company: record.companyName
      };
    }
    if (record.assignedEmployee) {
      const emp = employees.find((e) => e.id === record.assignedEmployee);
      if (emp) {
        return {
          name: emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
          company: emp.companyName || record.companyName
        };
      }
    }
    return null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Available": return "success";
      case "Assigned": return "processing";
      case "Maintenance": return "warning";
      case "Repair": return "error";
      case "Disposed": return "default";
      case "Lost": return "error";
      default: return "default";
    }
  };

  // Filtered Assets for Table View
  const filteredAssets = assets.filter((asset) => {
    // Tab category filter
    if (activeTab !== "all") {
      const catName = getCategoryName(asset.category).toLowerCase().replace(/\s+/g, "");
      const tabKey = activeTab.toLowerCase().replace(/\s+/g, "");
      if (!catName.includes(tabKey) && asset.category !== activeTab) {
        return false;
      }
    }

    // Company filter
    if (companyFilter && asset.companyName !== companyFilter) {
      return false;
    }

    // Status filter
    if (statusFilter && asset.status !== statusFilter) {
      return false;
    }

    // Search query
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      const custodian = getCustodianDisplay(asset);
      const match =
        asset.assetName?.toLowerCase().includes(q) ||
        asset.assetNumber?.toLowerCase().includes(q) ||
        asset.serialNumber?.toLowerCase().includes(q) ||
        asset.faNumber?.toLowerCase().includes(q) ||
        asset.companyName?.toLowerCase().includes(q) ||
        asset.brand?.toLowerCase().includes(q) ||
        asset.model?.toLowerCase().includes(q) ||
        custodian?.name?.toLowerCase().includes(q) ||
        asset.hostname?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Calculate category counts
  const getCategoryCount = (key) => {
    if (key === "all") return assets.length;
    return assets.filter((a) => {
      const catName = getCategoryName(a.category).toLowerCase().replace(/\s+/g, "");
      return catName.includes(key.toLowerCase().replace(/\s+/g, ""));
    }).length;
  };

  // Table Columns for Standard View
  const tableColumns = [
    {
      title: "Asset Details",
      key: "assetDetails",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              padding: "10px",
              borderRadius: 10,
              background: "rgba(99, 102, 241, 0.08)",
              color: "#6366f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <DesktopOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <div
              style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem", cursor: "pointer" }}
              onClick={() => {
                setSelectedAsset(record);
                setDrawerOpen(true);
              }}
            >
              {record.assetName || `${record.brand || ""} ${record.model || "Asset"}`}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#64748b", fontFamily: "monospace" }}>
              {record.assetNumber || "—"} {record.faNumber ? `• FA: ${record.faNumber}` : ""}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Serial Number",
      dataIndex: "serialNumber",
      key: "serialNumber",
      render: (serial) => (
        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e293b", fontSize: "0.9rem" }}>
          {serial || "—"}
        </span>
      )
    },
    {
      title: "Company",
      dataIndex: "companyName",
      key: "companyName",
      render: (comp) => (
        <Tag color="blue" style={{ fontWeight: 600 }}>
          {comp || "—"}
        </Tag>
      )
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (catId) => (
        <Tag color="purple" style={{ fontWeight: 600 }}>
          {getCategoryName(catId)}
        </Tag>
      )
    },
    {
      title: "Custodian / Employee",
      key: "custodian",
      render: (_, record) => {
        const cust = getCustodianDisplay(record);
        if (!cust) return <span style={{ color: "#94a3b8", fontSize: "0.82rem" }}>Unassigned</span>;
        return (
          <div>
            <div style={{ fontWeight: 700, color: "#334155", fontSize: "0.88rem" }}>
              {cust.name}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
              {cust.company ? `🏢 ${cust.company}` : ""}
            </div>
          </div>
        );
      }
    },
    {
      title: "Site / Dept",
      key: "locationDept",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, color: "#475569", fontSize: "0.85rem" }}>
            {getDepartmentName(record.department)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            📍 {getLocationName(record.location)}
          </div>
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)} style={{ fontWeight: 600 }}>
          {status || "Available"}
        </Tag>
      )
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Asset Details & QR">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: "#6366f1", fontSize: 16 }} />}
              onClick={() => {
                setSelectedAsset(record);
                setDrawerOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit Asset">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#10b981", fontSize: 16 }} />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete Asset">
            <Popconfirm
              title="Delete Asset"
              description={`Are you sure you want to delete "${record.assetName || "this asset"}"?`}
              onConfirm={() => handleDelete(record.id, record.assetName)}
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

  const selectedCategoryName = getCategoryName(selectedFormCategory).toLowerCase();
  const isFormDesktop = selectedCategoryName.includes("desktop");
  const isFormDongle = selectedCategoryName.includes("dongle");
  const isFormCompute = selectedCategoryName.includes("laptop") || selectedCategoryName.includes("desktop") || selectedCategoryName.includes("server");

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Page Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            Asset Inventory & Requests
          </Title>
          <Text type="secondary" style={{ fontSize: "0.92rem" }}>
            Track assets by <strong>Serial Number</strong> and <strong>Employee (Name + Company)</strong> across all categories.
          </Text>
        </Col>
        <Col>
          <Space size="middle">
            {/* View Switcher */}
            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val)}
              options={[
                {
                  label: (
                    <div style={{ padding: "4px 8px", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                      <TableOutlined />
                      <span>Spreadsheet View</span>
                    </div>
                  ),
                  value: "spreadsheet"
                },
                {
                  label: (
                    <div style={{ padding: "4px 8px", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                      <AppstoreOutlined />
                      <span>Cards / Table</span>
                    </div>
                  ),
                  value: "table"
                }
              ]}
              style={{
                background: "#f1f5f9",
                borderRadius: 10,
                padding: 3
              }}
            />

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenCreate(activeTab)}
              size="large"
              style={{
                borderRadius: 8,
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                border: "none",
                fontWeight: 700,
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)"
              }}
            >
              Register Asset
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Category Tabs */}
      <Card
        bordered
        style={{
          marginBottom: 16,
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          background: "#ffffff"
        }}
        styles={{ body: { padding: "12px 16px" } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          type="line"
          items={CATEGORY_TABS.map((tab) => ({
            key: tab.key,
            label: (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: "0.92rem" }}>
                {tab.icon}
                {tab.label}
                <Tag
                  color={activeTab === tab.key ? "indigo" : "default"}
                  style={{
                    marginLeft: 4,
                    borderRadius: 10,
                    fontSize: "0.72rem",
                    fontWeight: 700
                  }}
                >
                  {getCategoryCount(tab.key)}
                </Tag>
              </span>
            )
          }))}
        />
      </Card>

      {/* Main Content Area */}
      {viewMode === "spreadsheet" ? (
        <HandsontableSpreadsheet
          assets={assets}
          activeCategory={activeTab}
          categories={categories}
          departments={departments}
          locations={locations}
          employees={employees}
          onSelectAsset={(asset) => {
            setSelectedAsset(asset);
            setDrawerOpen(true);
          }}
          onRefresh={loadData}
        />
      ) : (
        <>
          {/* Filter Bar */}
          <Card
            bordered
            style={{ marginBottom: 16, borderRadius: 14, border: "1px solid #e2e8f0" }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={10} md={9}>
                <Input
                  prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                  placeholder="Search by serial, asset name, custodian, company..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  style={{ borderRadius: 8 }}
                />
              </Col>
              <Col xs={12} sm={7} md={5}>
                <Select
                  placeholder="Filter by Company"
                  value={companyFilter}
                  onChange={(val) => setCompanyFilter(val)}
                  allowClear
                  style={{ width: "100%", borderRadius: 8 }}
                >
                  {COMPANY_OPTIONS.map((c) => (
                    <Option key={c} value={c}>
                      🏢 {c}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} sm={7} md={5}>
                <Select
                  placeholder="Filter by Status"
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  allowClear
                  style={{ width: "100%", borderRadius: 8 }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <Option key={s.value} value={s.value}>
                      {s.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              {(searchText || companyFilter || statusFilter) && (
                <Col>
                  <Button
                    icon={<ClearOutlined />}
                    onClick={() => {
                      setSearchText("");
                      setCompanyFilter(null);
                      setStatusFilter(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                </Col>
              )}
            </Row>
          </Card>

          {/* Ant Design Table */}
          <Card
            bordered
            style={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              dataSource={filteredAssets}
              columns={tableColumns}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} assets`
              }}
              scroll={{ x: 1000 }}
            />
          </Card>
        </>
      )}

      {/* Asset Detail Drawer */}
      <AssetDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        asset={selectedAsset}
        onEdit={(asset) => handleOpenEdit(asset)}
        onDelete={handleDelete}
        onAssetUpdated={(updatedAsset) => {
          setSelectedAsset(updatedAsset);
          setAssets((prev) => prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)));
        }}
        categories={categories}
        departments={departments}
        locations={locations}
        employees={employees}
      />

      {/* Quick Employee Modal */}
      <QuickEmployeeModal
        open={quickEmpModalOpen}
        onClose={() => setQuickEmpModalOpen(false)}
        onEmployeeCreated={handleEmployeeCreated}
        departments={departments}
        locations={locations}
      />

      {/* Register / Edit Asset Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(99, 102, 241, 0.1)",
                color: "#6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18
              }}
            >
              <DesktopOutlined />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>
                {editingAsset ? "Edit Asset Details" : "Register New Asset"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                Track by Serial Number and Employee (Name + Company)
              </div>
            </div>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={780}
        centered
        styles={{ content: { borderRadius: 16, background: "#ffffff" } }}
      >
        {formError && <Alert message={formError} type="error" showIcon style={{ marginBottom: 16, borderRadius: 8 }} />}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          requiredMark={true}
          style={{ marginTop: 16, maxHeight: "70vh", overflowY: "auto", paddingRight: 4 }}
        >
          {/* Section 1: Identification & Base Info */}
          <div style={{ fontWeight: 700, color: "#334155", marginBottom: 12, fontSize: "0.95rem" }}>
            1. Asset Identification & Category
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Category</span>}
                rules={[{ required: true, message: "Please select a category." }]}
              >
                <Select
                  placeholder="Select category"
                  size="large"
                  style={{ borderRadius: 8 }}
                  onChange={(val) => setSelectedFormCategory(val)}
                >
                  {categories.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="assetName"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Asset Name / Title</span>}
                rules={[{ required: true, message: "Asset Name is required." }]}
              >
                <Input placeholder="e.g. Dell Latitude 5420 Core i5" size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="serialNumber"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Hardware Serial Number (Primary Track)</span>}
                rules={[{ required: true, message: "Serial Number is required." }]}
              >
                <Input placeholder="e.g. C02G789XQ05 / CN-08K90" size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="faNumber"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Fixed Asset (FA) Number</span>}
              >
                <Input placeholder="e.g. FA-0021" size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="companyName"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Company</span>}
                rules={[{ required: true, message: "Please specify company." }]}
              >
                <Select placeholder="Select company" size="large" style={{ borderRadius: 8 }} showSearch allowClear>
                  {COMPANY_OPTIONS.map((c) => (
                    <Option key={c} value={c}>
                      🏢 {c}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Lifecycle Status</span>}
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

          <Divider style={{ margin: "16px 0" }} />

          {/* Section 2: Custodian & Location */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: "#334155", fontSize: "0.95rem" }}>
              2. Custodian Assignment (Employee & Company Reference)
            </div>
            <Button
              type="dashed"
              icon={<UserAddOutlined />}
              onClick={() => setQuickEmpModalOpen(true)}
              style={{ borderRadius: 6, fontWeight: 600, color: "#6366f1", borderColor: "#c7d2fe" }}
            >
              + Add New Employee
            </Button>
          </div>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="assignedEmployee"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Assign to Employee (Select or Leave Unassigned)</span>}
              >
                <Select
                  placeholder="Select active employee"
                  size="large"
                  style={{ borderRadius: 8 }}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children || "").toString().toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={(val) => {
                    const emp = employees.find((e) => e.id === val);
                    if (emp) {
                      if (emp.companyName && !form.getFieldValue("companyName")) {
                        form.setFieldsValue({ companyName: emp.companyName });
                      }
                      form.setFieldsValue({ status: "Assigned" });
                    }
                  }}
                >
                  {employees.map((e) => (
                    <Option key={e.id} value={e.id}>
                      [{e.companyName || "Company"}] {e.fullName || `${e.firstName || ""} ${e.lastName || ""}`.trim()} {e.email ? `(${e.email})` : ""}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="department"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Department</span>}
              >
                <Select placeholder="Select department" size="large" style={{ borderRadius: 8 }} allowClear>
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
                name="location"
                label={<span style={{ color: "#475569", fontWeight: 600 }}>Physical Site Location</span>}
              >
                <Select placeholder="Select location" size="large" style={{ borderRadius: 8 }} allowClear>
                  {locations.map((l) => (
                    <Option key={l.id} value={l.id}>
                      {l.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Section 3: Technical Specifications */}
          {isFormCompute && (
            <>
              <Divider style={{ margin: "16px 0" }} />
              <div style={{ fontWeight: 700, color: "#334155", marginBottom: 12, fontSize: "0.95rem" }}>
                3. Technical Specifications & Hardware
              </div>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="brand" label={<span style={{ color: "#475569", fontWeight: 600 }}>Brand</span>}>
                    <Input placeholder="e.g. Dell, HP, Lenovo, Apple" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="model" label={<span style={{ color: "#475569", fontWeight: 600 }}>Model</span>}>
                    <Input placeholder="e.g. Latitude 5420 / T14" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="hostname" label={<span style={{ color: "#475569", fontWeight: 600 }}>Hostname</span>}>
                    <Input placeholder="e.g. RAVI-LAP-04" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="processor" label={<span style={{ color: "#475569", fontWeight: 600 }}>Processor</span>}>
                    <Input placeholder="e.g. Intel Core i5 11th Gen" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="generation" label={<span style={{ color: "#475569", fontWeight: 600 }}>Generation</span>}>
                    <Input placeholder="e.g. 11th Gen, M3" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="ram" label={<span style={{ color: "#475569", fontWeight: 600 }}>RAM Memory</span>}>
                    <Input placeholder="e.g. 16GB DDR4" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="storage" label={<span style={{ color: "#475569", fontWeight: 600 }}>Storage (SSD/HDD)</span>}>
                    <Input placeholder="e.g. 512GB NVMe SSD" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="operatingSystem" label={<span style={{ color: "#475569", fontWeight: 600 }}>Operating System</span>}>
                    <Input placeholder="e.g. Windows 11 Pro" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="windowsVersion" label={<span style={{ color: "#475569", fontWeight: 600 }}>OS Version</span>}>
                    <Input placeholder="e.g. 23H2" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="graphicCard" label={<span style={{ color: "#475569", fontWeight: 600 }}>Graphic Card</span>}>
                    <Input placeholder="e.g. Intel Iris Xe / Nvidia RTX" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="previousUser" label={<span style={{ color: "#475569", fontWeight: 600 }}>Previous User</span>}>
                    <Input placeholder="e.g. John Perera" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Section: Monitor Details (Desktops) */}
          {isFormDesktop && (
            <>
              <Divider style={{ margin: "16px 0" }} />
              <div style={{ fontWeight: 700, color: "#334155", marginBottom: 12, fontSize: "0.95rem" }}>
                🖥️ Desktop Monitor Details
              </div>

              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="monitorBrand" label={<span style={{ color: "#475569", fontWeight: 600 }}>Monitor Brand</span>}>
                    <Input placeholder="e.g. Dell" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="monitorModel" label={<span style={{ color: "#475569", fontWeight: 600 }}>Monitor Model</span>}>
                    <Input placeholder="e.g. P2419H" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="monitorSerialNumber" label={<span style={{ color: "#475569", fontWeight: 600 }}>Monitor Serial</span>}>
                    <Input placeholder="e.g. CN-08K90" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="monitorFaNumber" label={<span style={{ color: "#475569", fontWeight: 600 }}>Monitor FA</span>}>
                    <Input placeholder="e.g. FA-MON-001" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Section: Dongles & Cellular */}
          {isFormDongle && (
            <>
              <Divider style={{ margin: "16px 0" }} />
              <div style={{ fontWeight: 700, color: "#334155", marginBottom: 12, fontSize: "0.95rem" }}>
                📶 Dongle & SIM Specifications
              </div>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="brand" label={<span style={{ color: "#475569", fontWeight: 600 }}>Brand</span>}>
                    <Input placeholder="e.g. Huawei / ZTE" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="model" label={<span style={{ color: "#475569", fontWeight: 600 }}>Model</span>}>
                    <Input placeholder="e.g. E3372" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="imeiNumber" label={<span style={{ color: "#475569", fontWeight: 600 }}>IMEI Number</span>}>
                    <Input placeholder="e.g. 8654120489..." size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="simNumber" label={<span style={{ color: "#475569", fontWeight: 600 }}>SIM Number</span>}>
                    <Input placeholder="e.g. 077 123 4567" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="simImeiNo" label={<span style={{ color: "#475569", fontWeight: 600 }}>SIM IMEI</span>}>
                    <Input placeholder="e.g. 8994..." size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="packageName" label={<span style={{ color: "#475569", fontWeight: 600 }}>Package Name</span>}>
                    <Input placeholder="e.g. Dialog Business Unlimited" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="amount" label={<span style={{ color: "#475569", fontWeight: 600 }}>Monthly Cost</span>}>
                    <Input placeholder="e.g. 2500 LKR" size="large" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="activatedDate" label={<span style={{ color: "#475569", fontWeight: 600 }}>Activated Date</span>}>
                    <DatePicker size="large" style={{ width: "100%", borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="disconnectedDate" label={<span style={{ color: "#475569", fontWeight: 600 }}>Disconnected Date</span>}>
                    <DatePicker size="large" style={{ width: "100%", borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {/* Section 4: Procurement & Financials */}
          <Divider style={{ margin: "16px 0" }} />
          <div style={{ fontWeight: 700, color: "#334155", marginBottom: 12, fontSize: "0.95rem" }}>
            4. Procurement & Supplier Details
          </div>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="purchaseDate" label={<span style={{ color: "#475569", fontWeight: 600 }}>Purchase Date</span>}>
                <DatePicker size="large" style={{ width: "100%", borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="supplierName" label={<span style={{ color: "#475569", fontWeight: 600 }}>Supplier / Vendor</span>}>
                <Input placeholder="e.g. ABC Technologies" size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="invoiceNumber" label={<span style={{ color: "#475569", fontWeight: 600 }}>Invoice Number</span>}>
                <Input placeholder="e.g. INV-9842" size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="aging" label={<span style={{ color: "#475569", fontWeight: 600 }}>Aging</span>}>
                <Input placeholder="e.g. 2 Years 3 Months" size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="remarks" label={<span style={{ color: "#475569", fontWeight: 600 }}>Remarks / Notes</span>}>
                <Input placeholder="e.g. Excellent condition" size="large" style={{ borderRadius: 8 }} />
              </Form.Item>
            </Col>
          </Row>

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
              {editingAsset ? "Save Changes" : "Register Asset"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
