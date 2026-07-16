import * as yup from "yup";

// Helper for phone validation (at least 10 digits, optional symbols like +, -, spaces)
const phoneRegex = /^\+?[0-9\s\-]{10,15}$/;

export const departmentSchema = yup.object().shape({
    name: yup.string().trim().required("Department Name is required").min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
    code: yup.string().trim().uppercase().required("Department Code is required").min(2, "Code must be at least 2 characters").max(10, "Code cannot exceed 10 characters"),
    description: yup.string().trim().max(200, "Description cannot exceed 200 characters"),
    active: yup.boolean().default(true)
});

export const designationSchema = yup.object().shape({
    name: yup.string().trim().required("Designation Name is required").min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
    description: yup.string().trim().max(200, "Description cannot exceed 200 characters"),
    active: yup.boolean().default(true)
});

export const locationSchema = yup.object().shape({
    name: yup.string().trim().required("Location Name is required").min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
    building: yup.string().trim().required("Building is required").max(50, "Building name too long"),
    floor: yup.string().trim().required("Floor is required").max(10, "Floor too long"),
    description: yup.string().trim().max(200, "Description cannot exceed 200 characters"),
    active: yup.boolean().default(true)
});

export const categorySchema = yup.object().shape({
    name: yup.string().trim().required("Category Name is required").min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
    parentCategory: yup.string().trim().nullable(),
    description: yup.string().trim().max(200, "Description cannot exceed 200 characters"),
    active: yup.boolean().default(true)
});

export const employeeSchema = yup.object().shape({
    firstName: yup.string().trim().required("First Name is required").min(2, "Min 2 characters").max(50, "Max 50 characters"),
    lastName: yup.string().trim().required("Last Name is required").min(2, "Min 2 characters").max(50, "Max 50 characters"),
    department: yup.string().required("Department is required"),
    designation: yup.string().required("Designation is required"),
    email: yup.string().trim().required("Email is required").email("Invalid email format"),
    mobileNumber: yup.string().trim().required("Mobile number is required").matches(phoneRegex, "Invalid phone number format (needs 10-15 digits)"),
    dateOfJoin: yup.string().required("Date of Join is required"),
    status: yup.string().required("Employment Status is required").oneOf(["Active", "Terminated", "On Leave"], "Invalid Status"),
});

export const assetSchema = yup.object().shape({
    assetName: yup.string().trim().required("Asset Name is required").min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
    serialNumber: yup.string().trim().required("Serial Number is required").min(2, "Serial number too short").max(50, "Serial number too long"),
    category: yup.string().required("Category is required"),
    department: yup.string().required("Department is required"),
    location: yup.string().required("Location is required"),
    assignedEmployee: yup.string().nullable().when("status", {
        is: "Assigned",
        then: () => yup.string().required("Employee assignment is required when asset status is 'Assigned'"),
        otherwise: () => yup.string().nullable().transform((curr, orig) => orig === "" ? null : curr)
    }),
    purchaseDate: yup.string().required("Purchase Date is required"),
    purchaseCost: yup.number().typeError("Purchase Cost must be a number").required("Purchase Cost is required").positive("Cost must be greater than zero"),
    warrantyExpiry: yup.string().required("Warranty Expiry is required").test(
        "is-after-purchase",
        "Warranty expiry date must be after purchase date",
        function(value) {
            const { purchaseDate } = this.parent;
            if (!purchaseDate || !value) return true;
            return new Date(value) >= new Date(purchaseDate);
        }
    ),
    vendor: yup.string().trim().required("Vendor is required").min(2, "Vendor name too short").max(100, "Vendor name too long"),
    status: yup.string().required("Asset Status is required").oneOf(["Available", "Assigned", "Maintenance", "Repair", "Disposed", "Lost"], "Invalid status")
});
