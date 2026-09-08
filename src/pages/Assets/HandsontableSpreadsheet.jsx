import React, { useRef, useMemo, useState } from "react";
import { HotTable } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";
import { Card, Input, Button, Space, Typography, Tag, Tooltip } from "antd";
import {
  SearchOutlined,
  FileExcelOutlined,
  EyeOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import ExcelJS from "exceljs";

// Register all Handsontable modules
registerAllModules();

const { Text } = Typography;

export default function HandsontableSpreadsheet({
  assets = [],
  activeCategory = "all",
  categories = [],
  departments = [],
  locations = [],
  employees = [],
  onSelectAsset,
  onRefresh
}) {
  const hotRef = useRef(null);
  const [spreadsheetSearch, setSpreadsheetSearch] = useState("");

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || id || "";
  const getDepartmentName = (id) => departments.find((d) => d.id === id)?.name || id || "";
  const getLocationName = (id) => locations.find((l) => l.id === id)?.name || id || "";
  
  const getEmployeeName = (asset) => {
    if (asset.assignedEmployeeName) return asset.assignedEmployeeName;
    if (asset.assignedEmployee) {
      const emp = employees.find((e) => e.id === asset.assignedEmployee);
      if (emp) return emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
    }
    return "";
  };

  const getEmployeeEmail = (asset) => {
    if (asset.assignedEmployeeEmail) return asset.assignedEmployeeEmail;
    if (asset.assignedEmployee) {
      const emp = employees.find((e) => e.id === asset.assignedEmployee);
      if (emp) return emp.email || "";
    }
    return "";
  };

  // Filter assets by search query and category
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Category filter
      if (activeCategory !== "all") {
        const catName = getCategoryName(asset.category).toLowerCase().replace(/\s+/g, "");
        const targetCat = activeCategory.toLowerCase().replace(/\s+/g, "");
        if (!catName.includes(targetCat) && asset.category !== activeCategory) {
          return false;
        }
      }

      // Search filter
      if (spreadsheetSearch.trim()) {
        const q = spreadsheetSearch.toLowerCase();
        const match =
          asset.assetName?.toLowerCase().includes(q) ||
          asset.assetNumber?.toLowerCase().includes(q) ||
          asset.serialNumber?.toLowerCase().includes(q) ||
          asset.companyName?.toLowerCase().includes(q) ||
          asset.brand?.toLowerCase().includes(q) ||
          asset.model?.toLowerCase().includes(q) ||
          getEmployeeName(asset).toLowerCase().includes(q) ||
          asset.hostname?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [assets, activeCategory, spreadsheetSearch, categories, employees]);

  // Determine Columns based on category
  const { colHeaders, columns, data } = useMemo(() => {
    const cat = activeCategory.toLowerCase();

    if (cat.includes("laptop")) {
      const headers = [
        "No", "Asset No", "FA Number", "Company", "Location", "Department", "Hostname",
        "Employee / User", "Email", "Brand", "Model", "Processor", "Generation",
        "Screen Size", "RAM", "Storage", "Graphics", "OS", "Win Version",
        "Serial Number", "Purchase Date", "Supplier", "Invoice No", "Aging", "Previous User", "Remarks", "Status"
      ];
      const cols = [
        { data: "_index", readOnly: true, width: 45 },
        { data: "assetNumber", readOnly: true, width: 90 },
        { data: "faNumber", width: 100 },
        { data: "companyName", width: 100 },
        { data: "locationName", width: 110 },
        { data: "departmentName", width: 110 },
        { data: "hostname", width: 110 },
        { data: "employeeName", width: 130 },
        { data: "employeeEmail", width: 140 },
        { data: "brand", width: 90 },
        { data: "model", width: 120 },
        { data: "processor", width: 120 },
        { data: "generation", width: 90 },
        { data: "screenSize", width: 90 },
        { data: "ram", width: 80 },
        { data: "storage", width: 100 },
        { data: "graphicCard", width: 100 },
        { data: "operatingSystem", width: 110 },
        { data: "windowsVersion", width: 90 },
        { data: "serialNumber", width: 130 },
        { data: "purchaseDate", width: 100 },
        { data: "supplierName", width: 120 },
        { data: "invoiceNumber", width: 100 },
        { data: "aging", width: 90 },
        { data: "previousUser", width: 110 },
        { data: "remarks", width: 140 },
        { data: "status", width: 90 }
      ];
      const rows = filteredAssets.map((a, i) => ({
        _raw: a,
        _index: i + 1,
        assetNumber: a.assetNumber || "",
        faNumber: a.faNumber || "",
        companyName: a.companyName || "",
        locationName: getLocationName(a.location),
        departmentName: getDepartmentName(a.department),
        hostname: a.hostname || "",
        employeeName: getEmployeeName(a),
        employeeEmail: getEmployeeEmail(a),
        brand: a.brand || "",
        model: a.model || "",
        processor: a.processor || "",
        generation: a.generation || "",
        screenSize: a.screenSize || "",
        ram: a.ram || "",
        storage: a.storage || "",
        graphicCard: a.graphicCard || "",
        operatingSystem: a.operatingSystem || "",
        windowsVersion: a.windowsVersion || "",
        serialNumber: a.serialNumber || "",
        purchaseDate: a.purchaseDate || "",
        supplierName: a.supplierName || a.vendor || "",
        invoiceNumber: a.invoiceNumber || "",
        aging: a.aging || "",
        previousUser: a.previousUser || "",
        remarks: a.remarks || "",
        status: a.status || "Available"
      }));
      return { colHeaders: headers, columns: cols, data: rows };
    }

    if (cat.includes("desktop")) {
      const headers = [
        "No", "Asset No", "FA Number", "Company", "Location", "Department", "Hostname",
        "Employee / User", "Email", "CPU Brand", "CPU Model", "Processor", "Gen", "RAM", "Storage",
        "OS", "CPU Serial", "Monitor Brand", "Monitor Model", "Monitor Serial", "Monitor FA",
        "Purchase Date", "Supplier", "Invoice", "Aging", "Remarks", "Status"
      ];
      const cols = [
        { data: "_index", readOnly: true, width: 45 },
        { data: "assetNumber", readOnly: true, width: 90 },
        { data: "faNumber", width: 100 },
        { data: "companyName", width: 100 },
        { data: "locationName", width: 110 },
        { data: "departmentName", width: 110 },
        { data: "hostname", width: 110 },
        { data: "employeeName", width: 130 },
        { data: "employeeEmail", width: 140 },
        { data: "brand", width: 90 },
        { data: "model", width: 110 },
        { data: "processor", width: 110 },
        { data: "generation", width: 80 },
        { data: "ram", width: 80 },
        { data: "storage", width: 100 },
        { data: "operatingSystem", width: 100 },
        { data: "serialNumber", width: 120 },
        { data: "monitorBrand", width: 100 },
        { data: "monitorModel", width: 110 },
        { data: "monitorSerialNumber", width: 120 },
        { data: "monitorFaNumber", width: 100 },
        { data: "purchaseDate", width: 100 },
        { data: "supplierName", width: 110 },
        { data: "invoiceNumber", width: 100 },
        { data: "aging", width: 90 },
        { data: "remarks", width: 130 },
        { data: "status", width: 90 }
      ];
      const rows = filteredAssets.map((a, i) => ({
        _raw: a,
        _index: i + 1,
        assetNumber: a.assetNumber || "",
        faNumber: a.faNumber || "",
        companyName: a.companyName || "",
        locationName: getLocationName(a.location),
        departmentName: getDepartmentName(a.department),
        hostname: a.hostname || "",
        employeeName: getEmployeeName(a),
        employeeEmail: getEmployeeEmail(a),
        brand: a.brand || "",
        model: a.model || "",
        processor: a.processor || "",
        generation: a.generation || "",
        ram: a.ram || "",
        storage: a.storage || "",
        operatingSystem: a.operatingSystem || "",
        serialNumber: a.serialNumber || "",
        monitorBrand: a.monitorBrand || "",
        monitorModel: a.monitorModel || "",
        monitorSerialNumber: a.monitorSerialNumber || "",
        monitorFaNumber: a.monitorFaNumber || "",
        purchaseDate: a.purchaseDate || "",
        supplierName: a.supplierName || a.vendor || "",
        invoiceNumber: a.invoiceNumber || "",
        aging: a.aging || "",
        remarks: a.remarks || "",
        status: a.status || "Available"
      }));
      return { colHeaders: headers, columns: cols, data: rows };
    }

    if (cat.includes("dongle")) {
      const headers = [
        "No", "Asset No", "Company", "Location", "Department", "Employee / User",
        "Email", "Brand", "Model", "Serial Number", "IMEI", "SIM Number",
        "SIM IMEI", "Package Name", "Monthly Amount", "Activated Date", "Disconnected Date", "Remarks", "Status"
      ];
      const cols = [
        { data: "_index", readOnly: true, width: 45 },
        { data: "assetNumber", readOnly: true, width: 90 },
        { data: "companyName", width: 100 },
        { data: "locationName", width: 110 },
        { data: "departmentName", width: 110 },
        { data: "employeeName", width: 130 },
        { data: "employeeEmail", width: 140 },
        { data: "brand", width: 90 },
        { data: "model", width: 110 },
        { data: "serialNumber", width: 130 },
        { data: "imeiNumber", width: 130 },
        { data: "simNumber", width: 120 },
        { data: "simImeiNo", width: 120 },
        { data: "packageName", width: 130 },
        { data: "amount", width: 90 },
        { data: "activatedDate", width: 100 },
        { data: "disconnectedDate", width: 110 },
        { data: "remarks", width: 130 },
        { data: "status", width: 90 }
      ];
      const rows = filteredAssets.map((a, i) => ({
        _raw: a,
        _index: i + 1,
        assetNumber: a.assetNumber || "",
        companyName: a.companyName || "",
        locationName: getLocationName(a.location),
        departmentName: getDepartmentName(a.department),
        employeeName: getEmployeeName(a),
        employeeEmail: getEmployeeEmail(a),
        brand: a.brand || "",
        model: a.model || "",
        serialNumber: a.serialNumber || "",
        imeiNumber: a.imeiNumber || "",
        simNumber: a.simNumber || "",
        simImeiNo: a.simImeiNo || "",
        packageName: a.packageName || "",
        amount: a.amount || "",
        activatedDate: a.activatedDate || "",
        disconnectedDate: a.disconnectedDate || "",
        remarks: a.remarks || "",
        status: a.status || "Available"
      }));
      return { colHeaders: headers, columns: cols, data: rows };
    }

    // Default / All Assets view
    const headers = [
      "No", "Asset No", "Asset Name", "Category", "Company", "Serial Number", "FA Number",
      "Employee / User", "Department", "Location", "Brand", "Model", "Purchase Date", "Status"
    ];
    const cols = [
      { data: "_index", readOnly: true, width: 45 },
      { data: "assetNumber", readOnly: true, width: 95 },
      { data: "assetName", width: 150 },
      { data: "categoryName", width: 120 },
      { data: "companyName", width: 110 },
      { data: "serialNumber", width: 140 },
      { data: "faNumber", width: 100 },
      { data: "employeeName", width: 130 },
      { data: "departmentName", width: 110 },
      { data: "locationName", width: 110 },
      { data: "brand", width: 90 },
      { data: "model", width: 110 },
      { data: "purchaseDate", width: 100 },
      { data: "status", width: 95 }
    ];
    const rows = filteredAssets.map((a, i) => ({
      _raw: a,
      _index: i + 1,
      assetNumber: a.assetNumber || "",
      assetName: a.assetName || `${a.brand || ""} ${a.model || ""}`.trim() || "Asset",
      categoryName: getCategoryName(a.category),
      companyName: a.companyName || "",
      serialNumber: a.serialNumber || "",
      faNumber: a.faNumber || "",
      employeeName: getEmployeeName(a),
      departmentName: getDepartmentName(a.department),
      locationName: getLocationName(a.location),
      brand: a.brand || "",
      model: a.model || "",
      purchaseDate: a.purchaseDate || "",
      status: a.status || "Available"
    }));
    return { colHeaders: headers, columns: cols, data: rows };
  }, [activeCategory, filteredAssets, categories, departments, locations, employees]);

  // Export to Excel using ExcelJS
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Cloud ERP Asset Tracker";
    workbook.created = new Date();

    const sheetName = activeCategory === "all" ? "All Assets" : activeCategory;
    const worksheet = workbook.addWorksheet(sheetName.substring(0, 31));

    // Add headers
    const cleanHeaders = colHeaders.filter((h) => h !== "No");
    const headerRow = worksheet.addRow(cleanHeaders);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" }
    };
    headerRow.height = 24;

    // Add data rows
    data.forEach((row) => {
      const rowValues = columns
        .filter((c) => c.data !== "_index")
        .map((c) => row[c.data] || "");
      worksheet.addRow(rowValues);
    });

    // Auto-fit column widths
    worksheet.columns.forEach((col) => {
      let maxLen = 12;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const len = cell.value ? cell.value.toString().length : 0;
        if (len > maxLen) maxLen = Math.min(len + 3, 40);
      });
      col.width = maxLen;
    });

    // Generate buffer & download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Asset_Registry_${sheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Row selection handler
  const handleAfterSelectionEnd = (row) => {
    if (row >= 0 && row < data.length) {
      const selectedRow = data[row];
      if (selectedRow && selectedRow._raw && onSelectAsset) {
        onSelectAsset(selectedRow._raw);
      }
    }
  };

  return (
    <div>
      {/* Spreadsheet Action Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          padding: "12px 16px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderBottom: "none",
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 260 }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder="Search spreadsheet (Serial, Custodian, Hostname, Brand)..."
            value={spreadsheetSearch}
            onChange={(e) => setSpreadsheetSearch(e.target.value)}
            style={{ maxWidth: 380, borderRadius: 8 }}
            allowClear
          />
          <Text type="secondary" style={{ fontSize: "0.82rem" }}>
            Showing <strong>{filteredAssets.length}</strong> items
          </Text>
        </div>

        <Space>
          <Tooltip title="Double click any row to view full asset details and QR code">
            <Tag color="indigo" icon={<InfoCircleOutlined />} style={{ padding: "4px 8px", borderRadius: 6, fontWeight: 500 }}>
              Click row to view details
            </Tag>
          </Tooltip>
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            style={{ borderRadius: 8 }}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            style={{
              borderRadius: 8,
              background: "#10b981",
              borderColor: "#10b981",
              fontWeight: 600
            }}
          >
            Export to Excel (.xlsx)
          </Button>
        </Space>
      </div>

      {/* Handsontable Container */}
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderBottomLeftRadius: 14,
          borderBottomRightRadius: 14,
          overflow: "hidden",
          background: "#ffffff"
        }}
      >
        <HotTable
          ref={hotRef}
          data={data}
          colHeaders={colHeaders}
          columns={columns}
          rowHeaders={false}
          width="100%"
          height={520}
          autoWrapRow={true}
          autoWrapCol={true}
          manualColumnResize={true}
          manualRowResize={false}
          columnSorting={true}
          contextMenu={true}
          stretchH="none"
          selectionMode="single"
          afterSelectionEnd={handleAfterSelectionEnd}
          licenseKey="non-commercial-and-evaluation"
          className="ht-theme-main"
          readOnly={true}
        />
      </div>
    </div>
  );
}
