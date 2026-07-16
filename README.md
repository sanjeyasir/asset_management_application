# Enterprise Asset Management System (EAMS)

A modern, scalable, enterprise-grade Asset Management System built with **React**, **Vite**, **Material UI**, and **Firebase**. The application is designed using a modular architecture that supports future expansion into a complete Enterprise Asset Management (EAM/ERP) solution.

---

## 🚀 Features

### Authentication
- Firebase Authentication
- Secure Login & Logout
- Protected Routes
- Persistent Authentication
- Automatic Session Restoration
- Auto Logout after 3 hours of inactivity

### Dashboard
- Executive Dashboard
- KPI Summary Cards
- Asset Statistics
- Employee Statistics
- Recent Activities
- Quick Actions
- Interactive Charts

### Master Data Management
- Employee Master
- Department Master
- Designation Master
- Asset Category Master
- Location Master
- Asset Master

Each module includes:

- Create
- Edit
- Delete
- View
- Search
- Pagination
- Sorting
- Form Validation
- Responsive Data Grid

### Asset Management
- Asset Registration
- Asset Assignment
- Asset Categories
- QR Code Generation
- Barcode Support (Future)
- Warranty Tracking
- Location Tracking
- Department Mapping

### Notifications
- Snackbar Notifications
- Success Messages
- Error Handling
- Warning Messages

### Audit Logging
- Login History
- CRUD Activity Tracking
- Timestamp Logging
- User Activity Logs

### Email Notifications
- Firebase Cloud Functions
- Nodemailer Integration
- SMTP Support
- Password Reset Emails
- Asset Assignment Notifications
- Warranty Reminder Emails

---

# 🛠 Technology Stack

## Frontend

- React 19
- Vite
- Material UI
- React Router
- React Hook Form
- Yup Validation
- TanStack React Query
- Axios
- DayJS

## Backend

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Cloud Functions

## Development

- ESLint
- Prettier

---

# 📂 Project Structure

```text
src/
│
├── assets/
├── components/
│   ├── common/
│   ├── dialogs/
│   ├── forms/
│   ├── layout/
│   ├── tables/
│   └── ui/
│
├── config/
│   └── firebase.js
│
├── constants/
├── contexts/
├── hooks/
├── layouts/
│
├── pages/
│   ├── Dashboard/
│   ├── Login/
│   ├── Employees/
│   ├── Departments/
│   ├── Designations/
│   ├── AssetCategories/
│   ├── Locations/
│   ├── Assets/
│   ├── Reports/
│   └── Settings/
│
├── routes/
│
├── services/
│   ├── authService.js
│   ├── employeeService.js
│   ├── departmentService.js
│   ├── designationService.js
│   ├── assetCategoryService.js
│   ├── locationService.js
│   ├── assetService.js
│   ├── emailService.js
│   └── auditService.js
│
├── themes/
├── utils/
├── validators/
│
├── App.jsx
└── main.jsx
```

---

# 🔐 Authentication

The application uses **Firebase Authentication** with secure session management.

### Features

- Secure Login
- Protected Routes
- Session Persistence
- Automatic Session Recovery
- Automatic Logout after 3 hours of inactivity

---

# 🗄 Database

Cloud Firestore Collections

```text
users
employees
departments
designations
assetCategories
locations
assets
auditLogs
notifications
```

---

# 📊 Modules

## Dashboard

- KPI Cards
- Asset Overview
- Employee Overview
- Charts
- Recent Activities
- Quick Actions

---

## Employee Master

Maintain:

- Employee ID
- Name
- Department
- Designation
- Email
- Mobile
- Date Joined
- Employment Status

---

## Department Master

Maintain:

- Department Name
- Department Code
- Description
- Status

---

## Designation Master

Maintain:

- Designation Name
- Description
- Status

---

## Asset Category Master

Supports hierarchical categories.

Example:

```text
IT Equipment
    ├── Laptop
    ├── Desktop
    ├── Printer

Networking
    ├── Router
    ├── Switch
    ├── Firewall

Furniture
    ├── Chair
    ├── Table
    ├── Cupboard
```

---

## Location Master

Maintain:

- Building
- Floor
- Department
- Description

---

## Asset Master

Maintain:

- Asset Number
- Asset Name
- Category
- Serial Number
- QR Code
- Barcode
- Purchase Date
- Purchase Cost
- Warranty
- Vendor
- Assigned Employee
- Department
- Location
- Asset Status

---

# 📧 Email Notifications

Email notifications are sent through **Firebase Cloud Functions** using **Nodemailer**.

Supported notifications include:

- Employee Creation
- Asset Assignment
- Asset Return
- Password Reset
- Warranty Expiry Reminders

---

# 📋 Data Grid Features

Every master page includes:

- Search
- Pagination
- Sorting
- Filtering
- Responsive Layout
- Export to CSV
- Export to Excel
- Column Visibility
- Loading Skeletons

---

# ✅ Form Validation

Validation is implemented using:

- React Hook Form
- Yup

Supports:

- Required Fields
- Email Validation
- Phone Validation
- Duplicate Checking
- Date Validation
- Length Validation

---

# 🔒 Security

The application is secured using Firebase Authentication and Firestore Security Rules.

Features include:

- Protected Routes
- Authentication Guard
- Role-Based Access (Foundation)
- Firestore Security Rules
- Secure Service Layer

---

# 📜 Audit Logging

Every significant system event is logged, including:

- Login
- Logout
- Record Creation
- Record Updates
- Record Deletion

Each log captures:

- User
- Timestamp
- Action
- Collection
- Previous Value
- Updated Value

---

# 🎨 UI & UX

The interface follows modern enterprise design principles inspired by:

- SAP Fiori
- Microsoft Dynamics 365
- Oracle Fusion
- Odoo

Features include:

- Responsive Design
- Material UI
- Light/Dark Theme Ready
- Breadcrumb Navigation
- Professional Dashboard
- Reusable Components
- Mobile-Friendly Layout

---

# 🚀 Getting Started

## Clone the Repository

```bash
git clone <repository-url>
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Firebase

Create a `.env` file in the project root and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

> **Note:** Never commit your `.env` file to version control.

---

## Start the Development Server

```bash
npm run dev
```

---

## Build for Production

```bash
npm run build
```

---

## Preview Production Build

```bash
npm run preview
```

---

# 🛣 Future Roadmap

The architecture is designed to support future modules such as:

- Asset Requests
- Asset Assignment Workflow
- Asset Transfers
- Asset Maintenance
- Preventive Maintenance
- Vendors
- Purchase Orders
- Asset Disposal
- Asset History
- Reports & Analytics
- Barcode Scanner
- QR Code Scanner
- Push Notifications
- Role-Based Access Control (RBAC)
- Multi-Company Support
- Multi-Location Support
- Progressive Web App (PWA)
- Offline Synchronization

---

# 🤝 Contributing

Contributions are welcome. Please follow the project's coding standards, maintain modularity, and ensure all new features include appropriate validation, error handling, and documentation.

---

# 📄 License

This project is intended for internal enterprise use. Licensing terms may vary depending on deployment requirements.

---

## 👨‍💻 Developed By

**Sanjey Asirvatham**

Senior Digital Transformation Executive

Enterprise Application Developer | React | Firebase | Microsoft Power Platform | Node.js | Cloud Solutions