import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Row, Col, Card, Typography, Button, Table, Tag, Avatar, Space, Divider, Spin } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  DesktopOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import assetCategoryService from "../../services/assetCategoryService";

const { Title, Text } = Typography;

export function EmployeePortal() {
  const { currentUser, logout } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (currentUser) {
      const fetchAssets = async () => {
        setLoadingAssets(true);
        try {
          const [assetSnap, catList] = await Promise.all([
            getDocs(collection(db, "assets")),
            assetCategoryService.getCategories()
          ]);
          const allAssets = assetSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));

          const myName = (currentUser.fullName || `${currentUser.firstName || ""} ${currentUser.lastName || ""}`).trim().toLowerCase();
          const myEmail = (currentUser.email || "").toLowerCase();
          const myUid = currentUser.uid || currentUser.id || "";

          const userAssets = allAssets.filter((a) => {
            if (a.assignedEmployee === myUid) return true;
            if (myEmail && (a.assignedEmployeeEmail?.toLowerCase() === myEmail || a.email?.toLowerCase() === myEmail)) return true;
            if (myName && a.assignedEmployeeName?.toLowerCase() === myName) return true;
            return false;
          });

          setAssets(userAssets);
          setCategories(catList);
        } catch (err) {
          console.error("Error loading employee assets:", err);
        } finally {
          setLoadingAssets(false);
        }
      };
      fetchAssets();
    } else {
      setAssets([]);
    }
  }, [currentUser]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const username = currentUser.fullName || `${currentUser.firstName || ""} ${currentUser.lastName || ""}` || currentUser.email || "Employee";
  const initials = (currentUser.firstName ? `${currentUser.firstName[0]}${currentUser.lastName?.[0] || ""}` : username.substring(0, 2)).toUpperCase();

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || id || "—";

  const columns = [
    {
      title: "Asset Name",
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
            <div style={{ fontWeight: 700, color: "#0f172a" }}>{text}</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "monospace" }}>
              {record.assetNumber || record.assetTag || "—"}
            </div>
          </div>
        </div>
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
      title: "Serial Number",
      dataIndex: "serialNumber",
      key: "serialNumber",
      render: (sn) => (
        <span style={{ fontFamily: "monospace", color: "#475569" }}>{sn || "—"}</span>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Faulty" ? "error" : "success"} style={{ fontWeight: 600 }}>
          {status || "Assigned"}
        </Tag>
      )
    }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
      {/* Top Header */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 32px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff"
            }}
          >
            <DatabaseOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a" }}>
              Enterprise Employee Portal
            </span>
            <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
              Self Service & Equipment Management
            </div>
          </div>
        </div>

        <Button
          type="default"
          danger
          icon={<LogoutOutlined />}
          onClick={logout}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Sign Out
        </Button>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, width: "100%", margin: "32px auto", padding: "0 24px", flexGrow: 1 }}>
        <Row gutter={[24, 24]}>
          {/* Profile Card */}
          <Col xs={24} md={8}>
            <Card
              bordered
              style={{ borderRadius: 16, border: "1px solid #e2e8f0", background: "#ffffff" }}
              styles={{ body: { padding: "32px 24px" } }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 24 }}>
                <Avatar
                  size={76}
                  style={{
                    backgroundColor: "#10b981",
                    fontSize: 28,
                    fontWeight: 700,
                    marginBottom: 12,
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)"
                  }}
                >
                  {initials}
                </Avatar>
                <Title level={4} style={{ margin: 0, fontWeight: 800, color: "#0f172a" }}>
                  {username}
                </Title>
                <Tag color="blue" style={{ marginTop: 8, fontWeight: 700 }}>
                  {currentUser.role || "Employee"}
                </Tag>
              </div>

              <Divider style={{ margin: "16px 0" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <IdcardOutlined style={{ fontSize: 18, color: "#6366f1" }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Employee ID</div>
                    <div style={{ fontWeight: 700, color: "#0f172a", fontFamily: "monospace" }}>
                      {currentUser.employeeId || "—"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <MailOutlined style={{ fontSize: 18, color: "#6366f1" }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Email Address</div>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.88rem" }}>
                      {currentUser.email || "—"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <PhoneOutlined style={{ fontSize: 18, color: "#6366f1" }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Phone Number</div>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.88rem" }}>
                      {currentUser.mobileNumber || "—"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <CalendarOutlined style={{ fontSize: 18, color: "#6366f1" }} />
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Date Joined</div>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.88rem" }}>
                      {currentUser.dateOfJoin || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* Assigned Equipment Table */}
          <Col xs={24} md={16}>
            <Card
              title={
                <span style={{ fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                  <DesktopOutlined style={{ color: "#6366f1" }} /> Assigned Equipment ({assets.length})
                </span>
              }
              bordered
              style={{ borderRadius: 16, border: "1px solid #e2e8f0", background: "#ffffff" }}
            >
              <Table
                dataSource={assets}
                columns={columns}
                rowKey="id"
                loading={loadingAssets}
                pagination={false}
                locale={{ emptyText: "No equipment or assets currently assigned to your profile." }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default EmployeePortal;
