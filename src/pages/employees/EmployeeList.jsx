import {
    Typography,
    Button,
    Box
} from "@mui/material";


import {
    Link
} from "react-router-dom";



function EmployeeList() {


    return (

        <Box>


            <Typography
                variant="h4"
                gutterBottom
            >

                Employee Management

            </Typography>



            <Button

                component={Link}

                to="/employees/create"

                variant="contained"

            >

                Add Employee

            </Button>



        </Box>

    );

}


export default EmployeeList;