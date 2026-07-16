import {
    Typography
} from "@mui/material";


import {
    useParams
} from "react-router-dom";



function EmployeeEdit() {


    const {
        id
    } = useParams();



    return (

        <>


            <Typography
                variant="h4"
            >

                Edit Employee

            </Typography>



            <Typography>

                Employee ID:
                {id}

            </Typography>


        </>

    );

}


export default EmployeeEdit;