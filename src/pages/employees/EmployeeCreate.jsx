import { useState } from "react";
import {
    Typography,
    TextField,
    Button,
    Stack,
    Paper
} from "@mui/material";

import employeeService from "../../services/employeeService";

function EmployeeCreate() {

    const [employee, setEmployee] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        department: "",
        designation: "",
        joiningDate: "",
        status: "Active"
    });

    const handleChange = (e) => {
        setEmployee({
            ...employee,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        try {

            await employeeService.createEmployee({
                ...employee,
                createdAt: new Date()
            });

            alert("Employee created successfully!");

            setEmployee({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                department: "",
                designation: "",
                joiningDate: "",
                status: "Active"
            });

        } catch (error) {
            console.error(error);
            alert("Failed to create employee.");
        }
    };

    return (
        <Paper
            elevation={3}
            sx={{
                maxWidth: 600,
                p: 4,
                margin: "30px auto"
            }}
        >
            <Typography variant="h4" gutterBottom>
                Create Employee
            </Typography>

            <Stack spacing={2}>

                <TextField
                    label="First Name"
                    name="firstName"
                    value={employee.firstName}
                    onChange={handleChange}
                    fullWidth
                />

                <TextField
                    label="Last Name"
                    name="lastName"
                    value={employee.lastName}
                    onChange={handleChange}
                    fullWidth
                />

                <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={employee.email}
                    onChange={handleChange}
                    fullWidth
                />

                <TextField
                    label="Phone Number"
                    name="phone"
                    value={employee.phone}
                    onChange={handleChange}
                    fullWidth
                />

                <TextField
                    label="Department"
                    name="department"
                    value={employee.department}
                    onChange={handleChange}
                    fullWidth
                />

                <TextField
                    label="Designation"
                    name="designation"
                    value={employee.designation}
                    onChange={handleChange}
                    fullWidth
                />

                <TextField
                    label="Joining Date"
                    name="joiningDate"
                    type="date"
                    value={employee.joiningDate}
                    onChange={handleChange}
                    InputLabelProps={{
                        shrink: true
                    }}
                    fullWidth
                />

                <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                >
                    Save Employee
                </Button>

            </Stack>
        </Paper>
    );
}

export default EmployeeCreate;