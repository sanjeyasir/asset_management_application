import React, { useRef, useState } from "react";
import {
  Drawer,
  Tag,
  Descriptions,
  Button,
  Space,
  Divider,
  Row,
  Col,
  Card,
  Typography,
  Tooltip,
  Popconfirm,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  Alert
} from "antd";
import {
  DesktopOutlined,
  QrcodeOutlined,
  PrinterOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  BankOutlined,
  BarcodeOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DownloadOutlined,
  CopyOutlined,
  HistoryOutlined,
  PlusOutlined,
  ToolOutlined,
  FileTextOutlined,
  SwapOutlined,
  ClockCircleOutlined
} from "@ant-design/icons";
import { QRCodeSVG } from "qrcode.react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import assetService from "../../services/assetService";

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const LOG_TYPES = [
  { value: "MAINTENANCE", label: "🔧 Maintenance / Service", color: "#f59e0b" },
  { value: "REPAIR", label: "🛠️ Repair & Part Replacement", color: "#ef4444" },
  { value: "UPGRADE", label: "⚡ Hardware Upgrade", color: "#8b5cf6" },
  { value: "INSPECTION", label: "🔍 Physical Audit & Inspection", color: "#06b6d4" },
  { value: "NOTE", label: "📝 General Note", color: "#6366f1" }
];

export default function AssetDetailDrawer({
  open,
  onClose,
  asset,
  onEdit,
  onDelete,
  onAssetUpdated,
  categories = [],
  departments = [],
  locations = [],
  employees = []
}) {
  const qrRef = useRef(null);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logForm] = Form.useForm();
  const [savingLog, setSavingLog] = useState(false);
  const [logError, setLogError] = useState("");
  const [localLogs, setLocalLogs] = useState(null);

  if (!asset) return null;

  // Use localLogs if updated, otherwise asset.logs
  const activeLogs = localLogs !== null ? localLogs : (Array.isArray(asset.logs) ? asset.logs : []);

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || id || "—";
  const getDepartmentName = (id) => departments.find((d) => d.id === id)?.name || id || "—";
  const getLocationName = (id) => locations.find((l) => l.id === id)?.name || id || "—";
  
  const getEmployeeDisplay = () => {
    if (asset.assignedEmployeeName) {
      return {
        name: asset.assignedEmployeeName,
        company: asset.companyName || "—",
        email: asset.assignedEmployeeEmail || ""
      };
    }
    if (asset.assignedEmployee) {
      const emp = employees.find((e) => e.id === asset.assignedEmployee);
      if (emp) {
        return {
          name: emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
          company: emp.companyName || asset.companyName || "—",
          email: emp.email || ""
        };
      }
    }
    return null;
  };

  const custodian = getEmployeeDisplay();

  const getStatusTag = (status) => {
    switch (status) {
      case "Assigned":
      case "In Use":
        return <Tag color="processing" style={{ fontWeight: 700, borderRadius: 6 }}>● {status}</Tag>;
      case "Available":
        return <Tag color="success" style={{ fontWeight: 700, borderRadius: 6 }}>● Available</Tag>;
      case "Maintenance":
        return <Tag color="warning" style={{ fontWeight: 700, borderRadius: 6 }}>● Maintenance</Tag>;
      case "Repair":
        return <Tag color="error" style={{ fontWeight: 700, borderRadius: 6 }}>● Repair</Tag>;
      case "Disposed":
      case "Disconnected":
        return <Tag color="default" style={{ fontWeight: 700, borderRadius: 6 }}>● {status}</Tag>;
      case "Lost":
        return <Tag color="error" style={{ fontWeight: 700, borderRadius: 6 }}>● Lost</Tag>;
      default:
        return <Tag color="blue" style={{ fontWeight: 700, borderRadius: 6 }}>{status || "Active"}</Tag>;
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const handlePrintQR = () => {
    window.print();
  };

  const handleAddLogSubmit = async (values) => {
    setSavingLog(true);
    setLogError("");
    try {
      const logEntry = {
        type: values.type,
        title: values.title?.trim(),
        description: values.description?.trim() || ""
      };
      const updated = await assetService.addAssetLog(asset.id, logEntry, "Administrator");
      setLocalLogs(updated.logs);
      if (onAssetUpdated) {
        onAssetUpdated(updated);
      }
      setLogModalOpen(false);
      logForm.resetFields();
    } catch (err) {
      setLogError(err.message || "Failed to add log record.");
    } finally {
      setSavingLog(false);
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case "CREATED":
        return <CheckCircleOutlined style={{ color: "#10b981", fontSize: 16 }} />;
      case "ASSIGNED":
        return <UserOutlined style={{ color: "#6366f1", fontSize: 16 }} />;
      case "UNASSIGNED":
        return <SwapOutlined style={{ color: "#f59e0b", fontSize: 16 }} />;
      case "STATUS_CHANGE":
        return <SwapOutlined style={{ color: "#06b6d4", fontSize: 16 }} />;
      case "MAINTENANCE":
      case "REPAIR":
        return <ToolOutlined style={{ color: "#ef4444", fontSize: 16 }} />;
      case "UPGRADE":
        return <ToolOutlined style={{ color: "#8b5cf6", fontSize: 16 }} />;
      default:
        return <FileTextOutlined style={{ color: "#64748b", fontSize: 16 }} />;
    }
  };

  const getLogTagColor = (type) => {
    switch (type) {
      case "CREATED": return "success";
      case "ASSIGNED": return "blue";
      case "UNASSIGNED": return "warning";
      case "STATUS_CHANGE": return "cyan";
      case "MAINTENANCE": return "gold";
      case "REPAIR": return "error";
      case "UPGRADE": return "purple";
      default: return "default";
    }
  };

  const catName = getCategoryName(asset.category).toLowerCase();
  const isDesktop = catName.includes("desktop") || Boolean(asset.monitorBrand || asset.monitorModel || asset.monitorSerialNumber);
  const isDongle = catName.includes("dongle") || Boolean(asset.imeiNumber || asset.simNumber || asset.packageName);
  const isCompute = catName.includes("laptop") || catName.includes("desktop") || catName.includes("server") || Boolean(asset.processor || asset.ram);

  return (
    <>
      <Drawer
        open={open}
        onClose={() => {
          setLocalLogs(null);
          onClose();
        }}
        width={680}
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", paddingRight: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)",
                  color: "#6366f1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20
                }}
              >
                <DesktopOutlined />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>
                  {asset.assetName || `${asset.brand || ""} ${asset.model || "Asset"}`}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", fontFamily: "monospace" }}>
                  {asset.assetNumber || "AST-NEW"} {asset.faNumber ? `• FA: ${asset.faNumber}` : ""}
                </div>
              </div>
            </div>
            <div>{getStatusTag(asset.status)}</div>
          </div>
        }
        styles={{
          body: { padding: "20px 24px", background: "#f8fafc" }
        }}
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Popconfirm
              title="Delete Asset"
              description="Are you sure you want to permanently delete this asset?"
              onConfirm={() => {
                onDelete(asset.id, asset.assetName);
                onClose();
              }}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }}>
                Delete
              </Button>
            </Popconfirm>

            <Space>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrintQR}
                style={{ borderRadius: 8 }}
              >
                Print QR
              </Button>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => {
                  onClose();
                  onEdit(asset);
                }}
                style={{
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  border: "none",
                  fontWeight: 600
                }}
              >
                Edit Asset
              </Button>
            </Space>
          </div>
        }
      >
        {/* Custodian & Tracking Card */}
        <Card
          bordered
          style={{
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            marginBottom: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
          }}
          styles={{ body: { padding: "16px 20px" } }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col span={14}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 700 }}>
                Current Custodian & Company
              </div>
              {custodian ? (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                    <UserOutlined style={{ color: "#6366f1" }} />
                    {custodian.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <Tag color="geekblue" style={{ borderRadius: 4, fontWeight: 600 }}>
                      🏢 {asset.companyName || custodian.company || "Default Company"}
                    </Tag>
                    {custodian.email && (
                      <Text type="secondary" style={{ fontSize: "0.8rem" }}>
                        {custodian.email}
                      </Text>
                    )}
                  </div>
                  {asset.previousUser && (
                    <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: 4 }}>
                      <span style={{ fontWeight: 600 }}>Prev User:</span> {asset.previousUser}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 6, color: "#64748b", fontWeight: 500, fontSize: "0.9rem" }}>
                  Unassigned / In Inventory Stock
                  {asset.companyName && (
                    <div style={{ marginTop: 4 }}>
                      <Tag color="cyan">Company: {asset.companyName}</Tag>
                    </div>
                  )}
                </div>
              )}
            </Col>

            <Col span={10} style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8", fontWeight: 700 }}>
                Primary Serial Number
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#f1f5f9",
                  padding: "6px 10px",
                  borderRadius: 8,
                  marginTop: 6,
                  fontFamily: "monospace",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "#0f172a"
                }}
              >
                <BarcodeOutlined style={{ color: "#6366f1" }} />
                {asset.serialNumber || "NO SERIAL"}
                {asset.serialNumber && (
                  <Tooltip title="Copy Serial">
                    <CopyOutlined
                      style={{ cursor: "pointer", color: "#94a3b8", fontSize: 13 }}
                      onClick={() => copyToClipboard(asset.serialNumber)}
                    />
                  </Tooltip>
                )}
              </div>
            </Col>
          </Row>
        </Card>

        {/* Activity & Lifecycle Logs Section */}
        <Card
          bordered
          title={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 8 }}>
                <HistoryOutlined style={{ color: "#6366f1" }} /> Asset Lifecycle & Activity Log ({activeLogs.length})
              </span>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                size="small"
                onClick={() => {
                  setLogError("");
                  logForm.resetFields();
                  logForm.setFieldsValue({ type: "MAINTENANCE" });
                  setLogModalOpen(true);
                }}
                style={{ borderRadius: 6, fontWeight: 600, color: "#6366f1", borderColor: "#c7d2fe" }}
              >
                + Add Maintenance / Log
              </Button>
            </div>
          }
          style={{
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            marginBottom: 16
          }}
          styles={{ body: { padding: "20px" } }}
        >
          {activeLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#94a3b8", fontSize: "0.85rem" }}>
              <ClockCircleOutlined style={{ fontSize: 24, marginBottom: 8, color: "#cbd5e1" }} />
              <div>No lifecycle activity logs recorded yet.</div>
            </div>
          ) : (
            <Timeline
              style={{ marginTop: 8 }}
              items={activeLogs.map((log) => ({
                dot: getLogIcon(log.type),
                children: (
                  <div style={{ paddingBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>
                          {log.title}
                        </span>
                        <Tag color={getLogTagColor(log.type)} style={{ fontSize: "0.7rem", borderRadius: 4 }}>
                          {log.type}
                        </Tag>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>
                        {log.timestamp ? dayjs(log.timestamp).format("MMM D, YYYY • h:mm A") : "—"}
                      </span>
                    </div>

                    {log.description && (
                      <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: 4, lineHeight: 1.4 }}>
                        {log.description}
                      </div>
                    )}

                    <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 4 }}>
                      Logged by: <span style={{ fontWeight: 600, color: "#64748b" }}>{log.performedBy || "System"}</span>
                    </div>
                  </div>
                )
              }))}
            />
          )}
        </Card>

        {/* Asset Specifications & Details */}
        <Card
          bordered
          title={<span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.92rem" }}>Asset Profile & Organization</span>}
          style={{
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            marginBottom: 16
          }}
          styles={{ body: { padding: "16px 20px" } }}
        >
          <Descriptions column={2} size="small" bordered={false}>
            <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Category</span>}>
              <Tag color="purple" style={{ fontWeight: 600 }}>{getCategoryName(asset.category)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Company</span>}>
              <Tag color="blue" style={{ fontWeight: 600 }}>{asset.companyName || "—"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Department</span>}>
              {getDepartmentName(asset.department)}
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Location</span>}>
              📍 {getLocationName(asset.location)}
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>FA Number</span>}>
              <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{asset.faNumber || "—"}</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Hostname</span>}>
              <span style={{ fontFamily: "monospace" }}>{asset.hostname || "—"}</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Brand</span>}>
              <span style={{ fontWeight: 700, color: "#0f172a" }}>{asset.brand || "—"}</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Model</span>}>
              <span style={{ fontWeight: 700, color: "#0f172a" }}>{asset.model || "—"}</span>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Hardware Specifications (Laptops, Desktops, Servers) */}
        {isCompute && (
          <Card
            bordered
            title={<span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.92rem" }}>Hardware & System Specs</span>}
            style={{
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              marginBottom: 16
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Descriptions column={2} size="small">
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Processor</span>}>
                <span style={{ fontWeight: 600 }}>{asset.processor || "—"}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Generation</span>}>
                {asset.generation || "—"}
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>RAM (Memory)</span>}>
                <Tag color="cyan" style={{ fontWeight: 700 }}>{asset.ram || "—"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Storage (SSD/HDD)</span>}>
                <Tag color="gold" style={{ fontWeight: 700 }}>{asset.storage || "—"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Graphic Card</span>}>
                {asset.graphicCard || "Integrated"}
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Screen Size</span>}>
                {asset.screenSize || "—"}
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Operating System</span>}>
                {asset.operatingSystem || "—"}
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>OS Version</span>}>
                {asset.windowsVersion || "—"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Monitor Specifications (Desktops) */}
        {isDesktop && (
          <Card
            bordered
            title={<span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.92rem" }}>🖥️ Desktop Monitor Details</span>}
            style={{
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              marginBottom: 16
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Descriptions column={2} size="small">
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Monitor Brand</span>}>
                {asset.monitorBrand || "—"}
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Monitor Model</span>}>
                {asset.monitorModel || "—"}
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Monitor Serial</span>}>
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{asset.monitorSerialNumber || "—"}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Monitor FA No</span>}>
                <span style={{ fontFamily: "monospace" }}>{asset.monitorFaNumber || "—"}</span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Dongle / Cellular Details */}
        {isDongle && (
          <Card
            bordered
            title={<span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.92rem" }}>📶 Cellular & SIM Details</span>}
            style={{
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              marginBottom: 16
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Descriptions column={2} size="small">
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>IMEI Number</span>}>
                <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{asset.imeiNumber || "—"}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>SIM Number</span>}>
                <span style={{ fontWeight: 700, color: "#10b981" }}>{asset.simNumber || "—"}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>SIM IMEI</span>}>
                <span style={{ fontFamily: "monospace" }}>{asset.simImeiNo || "—"}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Package Name</span>}>
                <Tag color="volcano">{asset.packageName || "—"}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Monthly Amount</span>}>
                {asset.amount ? `${asset.amount}` : "—"}
              </Descriptions.Item>
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Activated Date</span>}>
                {asset.activatedDate || "—"}
              </Descriptions.Item>
              {asset.disconnectedDate && (
                <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Disconnected</span>}>
                  <span style={{ color: "#ef4444" }}>{asset.disconnectedDate}</span>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}

        {/* Procurement & Lifecycle */}
        <Card
          bordered
          title={<span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.92rem" }}>Procurement & Financials</span>}
          style={{
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            marginBottom: 16
          }}
          styles={{ body: { padding: "16px 20px" } }}
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Purchase Date</span>}>
              {asset.purchaseDate || "—"}
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Supplier</span>}>
              {asset.supplierName || asset.vendor || "—"}
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Invoice No</span>}>
              <span style={{ fontFamily: "monospace" }}>{asset.invoiceNumber || "—"}</span>
            </Descriptions.Item>
            <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Aging</span>}>
              {asset.aging || "—"}
            </Descriptions.Item>
            {asset.purchaseCost > 0 && (
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Purchase Cost</span>}>
                ${Number(asset.purchaseCost).toLocaleString()}
              </Descriptions.Item>
            )}
            {asset.remarks && (
              <Descriptions.Item label={<span style={{ color: "#64748b", fontWeight: 600 }}>Remarks</span>} span={2}>
                <span style={{ fontStyle: "italic", color: "#475569" }}>{asset.remarks}</span>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* QR Code Identification Card */}
        <Card
          bordered
          style={{
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            textAlign: "center"
          }}
          styles={{ body: { padding: "20px" } }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              ref={qrRef}
              style={{
                padding: 12,
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 12,
                display: "inline-block",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
              }}
            >
              <QRCodeSVG
                value={asset.qrCode || `ASSET:${asset.assetNumber || asset.id}:${asset.serialNumber || ""}`}
                size={140}
                level="H"
                includeMargin
              />
            </div>
            <div style={{ fontWeight: 800, color: "#0f172a", marginTop: 10, fontSize: "0.95rem" }}>
              {asset.assetNumber || "ASSET QR TAG"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", fontFamily: "monospace" }}>
              Serial: {asset.serialNumber || "N/A"}
            </div>
          </div>
        </Card>
      </Drawer>

      {/* Add Maintenance / Service Note Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(245, 158, 11, 0.12)",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18
              }}
            >
              <ToolOutlined />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>
                Add Asset Activity & Maintenance Record
              </div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                Log service history, hardware replacement, inspection, or upgrade
              </div>
            </div>
          </div>
        }
        open={logModalOpen}
        onCancel={() => {
          setLogModalOpen(false);
          setLogError("");
        }}
        footer={null}
        width={540}
        centered
        styles={{ content: { borderRadius: 16 } }}
      >
        {logError && (
          <Alert message={logError} type="error" showIcon style={{ marginBottom: 16, marginTop: 8, borderRadius: 8 }} />
        )}

        <Form
          form={logForm}
          layout="vertical"
          onFinish={handleAddLogSubmit}
          initialValues={{ type: "MAINTENANCE" }}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="type"
            label={<span style={{ fontWeight: 600, color: "#334155" }}>Activity Type</span>}
            rules={[{ required: true, message: "Please select activity type" }]}
          >
            <Select size="large" style={{ borderRadius: 8 }}>
              {LOG_TYPES.map((t) => (
                <Option key={t.value} value={t.value}>
                  {t.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label={<span style={{ fontWeight: 600, color: "#334155" }}>Record Title / Action Summary</span>}
            rules={[{ required: true, message: "Please enter action title" }]}
          >
            <Input placeholder="e.g. Screen Replacement / RAM Upgrade to 16GB" size="large" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span style={{ fontWeight: 600, color: "#334155" }}>Detailed Notes & Service Description</span>}
          >
            <TextArea
              rows={3}
              placeholder="e.g. Replaced cracked 14-inch IPS display panel with original Dell OEM part under warranty. Tested display output and webcam."
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <Button onClick={() => setLogModalOpen(false)} style={{ borderRadius: 8 }} disabled={savingLog}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={savingLog}
              style={{
                borderRadius: 8,
                fontWeight: 700,
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                border: "none",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)"
              }}
            >
              Add Log Entry
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
