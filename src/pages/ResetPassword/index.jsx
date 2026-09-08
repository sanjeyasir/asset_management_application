import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, Alert, Spin } from "antd";
import { LockOutlined, KeyOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import authService from "../../services/authService";

const { Title, Text } = Typography;

export default function ResetPassword() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { currentUser, completeFirstLogin } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const { password, confirmPassword } = values;
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await authService.changePasswordOnFirstLogin(currentUser, password);
      showNotification("Password updated successfully! Welcome to your dashboard.", "success");
      completeFirstLogin();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 50%), #f8fafc",
        padding: "24px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <Card
        bordered
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 20,
          boxShadow: "0 10px 35px rgba(0, 0, 0, 0.05)",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          zIndex: 1
        }}
        styles={{ body: { padding: "40px 32px" } }}
      >
        <Spin spinning={loading} size="large" tip="Updating Password...">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 28 }}>
            <div
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                borderRadius: "16px",
                padding: "14px",
                display: "flex",
                boxShadow: "0 6px 16px rgba(16, 185, 129, 0.25)",
                marginBottom: 16,
                color: "#ffffff"
              }}
            >
              <KeyOutlined style={{ fontSize: 32 }} />
            </div>
            <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#0f172a" }}>
              Setup New Password
            </Title>
            <Text type="secondary" style={{ marginTop: 4, fontSize: "0.9rem" }}>
              Please set a strong, secure password for your initial sign in.
            </Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError("")}
              style={{ marginBottom: 20, borderRadius: 8 }}
            />
          )}

          <Form name="reset_password_form" layout="vertical" requiredMark={false} onFinish={onFinish}>
            <Form.Item
              name="password"
              label={<span style={{ color: "#475569", fontWeight: 600 }}>New Password</span>}
              rules={[
                { required: true, message: "Please enter a new password." },
                { min: 6, message: "Password must be at least 6 characters long." }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "rgba(0,0,0,0.35)" }} />}
                placeholder="••••••••"
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span style={{ color: "#475569", fontWeight: 600 }}>Confirm New Password</span>}
              rules={[{ required: true, message: "Please confirm your new password." }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "rgba(0,0,0,0.35)" }} />}
                placeholder="••••••••"
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                style={{
                  height: 46,
                  borderRadius: 8,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "none",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)"
                }}
              >
                Update Password & Continue
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}
