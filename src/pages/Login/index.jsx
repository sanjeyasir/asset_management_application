import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Card, Typography, Alert, Spin, Modal } from "antd";
import {
  MailOutlined,
  LockOutlined,
  DatabaseOutlined
} from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import authService from "../../services/authService";

const { Title, Text } = Typography;

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const { currentUser, login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      if (currentUser.isFirstLogin) {
        navigate("/reset-password");
      } else {
        navigate("/dashboard");
      }
    }
  }, [currentUser, navigate]);

  const onFinish = async (values) => {
    setError("");
    setLoading(true);
    try {
      await login(values.email, values.password);
      showNotification("Welcome back!", "success");
    } catch (err) {
      let errMsg = err.message || "";
      if (errMsg.includes("user-not-found") || errMsg.includes("invalid-credential")) {
        errMsg = "Invalid email or password. Please try again.";
      } else if (errMsg.includes("wrong-password")) {
        errMsg = "Incorrect password. Please verify and retry.";
      } else {
        errMsg = errMsg.replace(/^Error:\s*/, "") || "Login failed. Please check your credentials.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail) {
      setForgotError("Please enter your registered email address.");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    try {
      await authService.submitResetRequest(forgotEmail);
      showNotification("Password reset request submitted to Administrator.", "success");
      setForgotOpen(false);
      setForgotEmail("");
    } catch (err) {
      setForgotError(err.message || "Failed to submit reset request.");
    } finally {
      setForgotLoading(false);
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
      {/* Decorative Glow Blobs */}
      <div
        style={{
          position: "absolute",
          width: 350,
          height: 350,
          borderRadius: "50%",
          filter: "blur(90px)",
          background: "rgba(99, 102, 241, 0.08)",
          top: "-5%",
          left: "5%",
          zIndex: 0
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: "50%",
          filter: "blur(110px)",
          background: "rgba(16, 185, 129, 0.05)",
          bottom: "-5%",
          right: "5%",
          zIndex: 0
        }}
      />

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
        <Spin spinning={loading} size="large" tip="Signing In...">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 28 }}>
            <div
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                borderRadius: "16px",
                padding: "14px",
                display: "flex",
                boxShadow: "0 6px 16px rgba(99, 102, 241, 0.25)",
                marginBottom: 16,
                color: "#ffffff"
              }}
            >
              <DatabaseOutlined style={{ fontSize: 32 }} />
            </div>
            <Title level={2} style={{ margin: 0, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Enterprise Assets
            </Title>
            <Text type="secondary" style={{ marginTop: 4, fontSize: "0.9rem" }}>
              Cloud ERP Resource & Lifecycle Hub
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

          <Form name="login_form" layout="vertical" requiredMark={false} onFinish={onFinish}>
            <Form.Item
              name="email"
              label={<span style={{ color: "#475569", fontWeight: 600 }}>Email Address</span>}
              rules={[
                { required: true, message: "Please enter your email address." },
                { type: "email", message: "Please enter a valid email address." }
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "rgba(0,0,0,0.35)" }} />}
                placeholder="name@company.com"
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ color: "#475569", fontWeight: 600 }}>Password</span>}
              rules={[{ required: true, message: "Please enter your password." }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "rgba(0,0,0,0.35)" }} />}
                placeholder="••••••••"
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
              <Button
                type="link"
                onClick={() => {
                  setForgotError("");
                  setForgotEmail("");
                  setForgotOpen(true);
                }}
                style={{ color: "#6366f1", fontWeight: 600, padding: 0, height: "auto" }}
              >
                Forgot Password?
              </Button>
            </div>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                style={{
                  height: 46,
                  borderRadius: 8,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  border: "none",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.25)"
                }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>

      {/* Forgot Password Modal */}
      <Modal
        title="Request Password Reset"
        open={forgotOpen}
        onCancel={() => !forgotLoading && setForgotOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setForgotOpen(false)} disabled={forgotLoading} style={{ borderRadius: 8 }}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleForgotSubmit}
            loading={forgotLoading}
            style={{
              borderRadius: 8,
              fontWeight: 700,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              border: "none"
            }}
          >
            Submit Request
          </Button>
        ]}
        centered
        styles={{ content: { borderRadius: 16, background: "#ffffff" } }}
      >
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 14 }}>
          <Text type="secondary">
            Enter your registered email address below. Your system administrator will review and issue a temporary login password.
          </Text>

          {forgotError && <Alert message={forgotError} type="error" showIcon style={{ borderRadius: 8 }} />}

          <div>
            <div style={{ marginBottom: 6, color: "#475569", fontWeight: 600 }}>Email Address</div>
            <Input
              prefix={<MailOutlined style={{ color: "rgba(0,0,0,0.35)" }} />}
              placeholder="name@company.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              size="large"
              style={{ borderRadius: 8 }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
