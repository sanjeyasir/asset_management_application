import React, { useState } from "react";
import { Modal, Form, Input, Select, Row, Col, Alert, Button } from "antd";
import { UserAddOutlined, BankOutlined, MailOutlined } from "@ant-design/icons";
import employeeService from "../../services/employeeService";

const { Option } = Select;

const DEFAULT_COMPANIES = ["Ravi", "Eco Solutions", "Hayleys", "Corporate HQ"];

export default function QuickEmployeeModal({
  open,
  onClose,
  onEmployeeCreated,
  departments = [],
  locations = [],
  designations = []
}) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleFinish = async (values) => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        fullName: values.fullName?.trim(),
        companyName: values.companyName?.trim() || "Ravi",
        email: values.email?.trim() || "",
        department: values.department || "",
        designation: values.designation || "",
        location: values.location || "",
        status: "Active"
      };

      const newEmp = await employeeService.createEmployee(payload);
      form.resetFields();
      if (onEmployeeCreated) {
        onEmployeeCreated(newEmp);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create employee.");
    } finally {
      setSaving(false);
    }
  };

  return (
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
            <UserAddOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a" }}>
              Quick Add Employee
            </div>
            <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 400 }}>
              Create employee record referenced by Employee Name & Company
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={() => {
        form.resetFields();
        setError("");
        onClose();
      }}
      footer={null}
      width={560}
      centered
      styles={{ content: { borderRadius: 16 } }}
    >
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16, marginTop: 8, borderRadius: 8 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ companyName: "Ravi" }}
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col span={14}>
            <Form.Item
              name="fullName"
              label={<span style={{ fontWeight: 600, color: "#334155" }}>Employee Name</span>}
              rules={[{ required: true, message: "Please enter employee name" }]}
            >
              <Input placeholder="e.g. Sanjey Asirvatham" size="large" style={{ borderRadius: 8 }} />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item
              name="companyName"
              label={<span style={{ fontWeight: 600, color: "#334155" }}>Company</span>}
              rules={[{ required: true, message: "Please select/type company" }]}
            >
              <Select
                placeholder="Select or enter"
                size="large"
                style={{ borderRadius: 8 }}
                showSearch
                allowClear
              >
                {DEFAULT_COMPANIES.map((c) => (
                  <Option key={c} value={c}>
                    {c}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="email"
          label={<span style={{ fontWeight: 600, color: "#334155" }}>Work Email Address (Optional)</span>}
        >
          <Input
            prefix={<MailOutlined style={{ color: "#94a3b8" }} />}
            placeholder="e.g. sanjey@company.com"
            size="large"
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="department"
              label={<span style={{ fontWeight: 600, color: "#334155" }}>Department</span>}
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
              label={<span style={{ fontWeight: 600, color: "#334155" }}>Site / Location</span>}
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

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
          <Button
            onClick={() => {
              form.resetFields();
              setError("");
              onClose();
            }}
            style={{ borderRadius: 8 }}
            disabled={saving}
          >
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
            Create & Select Employee
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
