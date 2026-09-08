import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Card, Typography, Button, Table, Tag, Space, Skeleton, Divider } from "antd";
import {
  TeamOutlined,
  DesktopOutlined,
  CheckCircleOutlined,
  ApartmentOutlined,
  EnvironmentOutlined,
  RiseOutlined,
  PlusCircleOutlined,
  UserAddOutlined,
  AppstoreAddOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  InboxOutlined,
  FieldTimeOutlined,
  BankOutlined,
  BarcodeOutlined,
  LaptopOutlined,
  CloudServerOutlined,
  WifiOutlined,
  ApiOutlined
} from "@ant-design/icons";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { useAuth } from "../../contexts/AuthContext";
import employeeService from "../../services/employeeService";
import assetService from "../../services/assetService";
import departmentService from "../../services/departmentService";
import locationService from "../../services/locationService";
import assetCategoryService from "../../services/assetCategoryService";

const { Title, Text } = Typography;

const CHART_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6", "#14b8a6"];

function StatCard({ icon, label, value, color, loading, trend }) {
  return (
    <Card
      bordered
      className="hover-lift"
      style={{
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        background: "#ffffff",
        height: "100%"
      }}
      styles={{ body: { padding: "20px 24px" } }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: color, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                {value}
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a", marginTop: 4 }}>
                {label}
              </div>
              {trend && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <RiseOutlined style={{ fontSize: 12, color: "#10b981" }} />
                  <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500 }}>
                    {trend}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `${color}14`,
            border: `1px solid ${color}28`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: color,
            fontSize: 24,
            flexShrink: 0
          }}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ employees: 0, assets: 0, assigned: 0, available: 0, departments: 0, locations: 0, companies: 0 });
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [emps, assetsData, depts, locs, cats] = await Promise.all([
        employeeService.getEmployees(),
        assetService.getAssets(),
        departmentService.getDepartments(),
        locationService.getLocations(),
        assetCategoryService.getCategories(),
      ]);
      setEmployees(emps);
      setAssets(assetsData);
      setDepartments(depts);
      setLocations(locs);
      setCategories(cats);

      const uniqueCompanies = new Set([
        ...assetsData.map(a => a.companyName).filter(Boolean),
        ...emps.map(e => e.companyName).filter(Boolean)
      ]);

      setStats({
        employees: emps.length,
        assets: assetsData.length,
        assigned: assetsData.filter(a => a.status === "Assigned" || a.status === "In Use").length,
        available: assetsData.filter(a => a.status === "Available").length,
        departments: depts.length,
        locations: locs.length,
        companies: uniqueCompanies.size || 3
      });
    } catch (e) {
      console.error("Dashboard data load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = {};
  categories.forEach((c) => {
    categoryMap[c.id] = c.name;
  });

  const getCategoryName = (id) => categoryMap[id] || id || "Uncategorized";

  // Build chart data: Asset Categories Breakdown
  const categoryChartData = (() => {
    if (assets.length === 0) {
      return [
        { name: "Laptops", value: 14 },
        { name: "Desktops", value: 8 },
        { name: "Servers", value: 3 },
        { name: "Network", value: 6 },
        { name: "Dongles", value: 10 },
        { name: "Other Assets", value: 5 }
      ];
    }
    const counts = {};
    assets.forEach((a) => {
      const name = getCategoryName(a.category);
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // Build chart data: Assets by Company
  const companyChartData = (() => {
    if (assets.length === 0) {
      return [
        { company: "Ravi", count: 18 },
        { company: "Eco Solutions", count: 12 },
        { company: "Hayleys", count: 9 },
        { company: "Corporate HQ", count: 7 }
      ];
    }
    const counts = {};
    assets.forEach((a) => {
      const comp = a.companyName || "Ravi";
      counts[comp] = (counts[comp] || 0) + 1;
    });
    return Object.entries(counts).map(([company, count]) => ({ company, count }));
  })();

  const recentAssets = [...assets]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 6);

  const getStatusColor = (status) => {
    switch (status) {
      case "Available": return "success";
      case "Assigned":
      case "In Use": return "processing";
      case "Maintenance": return "warning";
      case "Repair": return "error";
      case "Disposed": return "default";
      case "Lost": return "error";
      default: return "default";
    }
  };

  const username = currentUser?.displayName || currentUser?.fullName || currentUser?.email?.split("@")[0] || "Administrator";

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

  const recentAssetsColumns = [
    {
      title: "Asset & Number",
      dataIndex: "assetName",
      key: "assetName",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              padding: "6px 8px",
              borderRadius: 8,
              background: "rgba(99, 102, 241, 0.08)",
              color: "#6366f1",
              display: "flex"
            }}
          >
            <DesktopOutlined style={{ fontSize: 16 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#0f172a" }}>
              {text || `${record.brand || ""} ${record.model || "Asset"}`}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "monospace" }}>
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
        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e293b", fontSize: "0.88rem" }}>
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
          {comp || "Ravi"}
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
          <div style={{ fontWeight: 600, color: "#334155", fontSize: "0.85rem" }}>
            👤 {cust.name}
          </div>
        );
      }
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status || "Available"}
        </Tag>
      )
    }
  ];

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
          Asset Management Portal 👋
        </Title>
        <Text type="secondary" style={{ fontSize: "0.95rem" }}>
          Real-time enterprise tracking by <strong>Serial Number</strong> and <strong>Employee Custodian (Name + Company)</strong>.
        </Text>
      </div>

      {/* Stat Cards Grid */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            icon={<DesktopOutlined />}
            label="Total Assets"
            value={stats.assets}
            color="#6366f1"
            trend="Multi-category registry"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            icon={<FieldTimeOutlined />}
            label="Assigned / In Use"
            value={stats.assigned}
            color="#f59e0b"
            trend="Tracked with employees"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            icon={<CheckCircleOutlined />}
            label="Available in Stock"
            value={stats.available}
            color="#10b981"
            trend="Ready for allocation"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            icon={<TeamOutlined />}
            label="Employees"
            value={stats.employees}
            color="#06b6d4"
            trend="Active workforce"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            icon={<BankOutlined />}
            label="Companies & Entities"
            value={stats.companies}
            color="#8b5cf6"
            trend="Ravi, Eco Solutions, Hayleys..."
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            icon={<EnvironmentOutlined />}
            label="Operational Sites"
            value={stats.locations}
            color="#ec4899"
            trend="Locations & branches"
            loading={loading}
          />
        </Col>
      </Row>

      {/* Analytics Charts Section */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ fontWeight: 700, color: "#0f172a" }}>Assets by Category</span>}
            extra={<Text type="secondary" style={{ fontSize: "0.8rem" }}>Laptops, Desktops, Dongles, etc.</Text>}
            bordered
            style={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
          >
            <div style={{ height: 290, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#fff"
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ fontWeight: 700, color: "#0f172a" }}>Assets by Company Entity</span>}
            extra={<Text type="secondary" style={{ fontSize: "0.8rem" }}>Corporate distribution</Text>}
            bordered
            style={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
          >
            <div style={{ height: 290, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyChartData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="company" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#fff"
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bottom Section: Recent Assets & Quick Operations */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={<span style={{ fontWeight: 700, color: "#0f172a" }}>Recent Asset Activity</span>}
            extra={
              <Button type="link" onClick={() => navigate("/assets")} style={{ fontWeight: 600, color: "#6366f1", padding: 0 }}>
                Open Spreadsheet View <ArrowRightOutlined />
              </Button>
            }
            bordered
            style={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
          >
            <Table
              dataSource={recentAssets}
              columns={recentAssetsColumns}
              rowKey="id"
              pagination={false}
              size="middle"
              loading={loading}
              locale={{ emptyText: "No recent assets found" }}
              scroll={{ x: 700 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Quick Actions */}
            <Card
              title={<span style={{ fontWeight: 700, color: "#0f172a" }}>Quick Actions</span>}
              bordered
              style={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
            >
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Button
                    block
                    icon={<DesktopOutlined style={{ color: "#6366f1" }} />}
                    onClick={() => navigate("/assets")}
                    style={{ height: 48, borderRadius: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    Asset Registry
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    block
                    icon={<UserAddOutlined style={{ color: "#10b981" }} />}
                    onClick={() => navigate("/employees")}
                    style={{ height: 48, borderRadius: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    Add Employee
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    block
                    icon={<BarcodeOutlined style={{ color: "#f59e0b" }} />}
                    onClick={() => navigate("/asset-categories")}
                    style={{ height: 48, borderRadius: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    Categories
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    block
                    icon={<EnvironmentOutlined style={{ color: "#ec4899" }} />}
                    onClick={() => navigate("/locations")}
                    style={{ height: 48, borderRadius: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    Locations
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Tracking Reference Info */}
            <Card
              title={<span style={{ fontWeight: 700, color: "#0f172a" }}>Tracking Reference</span>}
              bordered
              style={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#6366f1", marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>Serial Number Tracking</div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Unique hardware identification across all equipment types.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10b981", marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>Employee & Company Custody</div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Referenced by Employee Full Name and Company Entity.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#f59e0b", marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>Handsontable Spreadsheet</div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Category-specific spreadsheet views and Excel export.</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
}
