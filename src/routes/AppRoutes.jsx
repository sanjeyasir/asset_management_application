import {
    Routes,
    Route
} from "react-router-dom";


import Login from "../pages/Login";

import Dashboard from "../pages/Dashboard";


import Layout from "../components/layout/Layout";


import EmployeeList from "../pages/employees/EmployeeList";

import EmployeeCreate from "../pages/employees/EmployeeCreate";

import EmployeeEdit from "../pages/employees/EmployeeEdit";



function AppRoutes() {


    return (

        <Routes>


            <Route
                path="/"
                element={<Login />}
            />



            <Route element={<Layout />}>


                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />



                <Route
                    path="/employees"
                    element={<EmployeeList />}
                />



                <Route
                    path="/employees/create"
                    element={<EmployeeCreate />}
                />



                <Route
                    path="/employees/edit/:id"
                    element={<EmployeeEdit />}
                />


            </Route>


        </Routes>

    );

}


export default AppRoutes;