import {
    Routes,
    Route
} from "react-router-dom";


import Login from "../pages/Login/index";
import Dashboard from "../pages/Dashboard/index";
import Layout from "../components/layout/Layout";

import Employees from "../pages/employees/index";
import Departments from "../pages/Departments/index";
import Designations from "../pages/Designations/index";
import Locations from "../pages/Locations/index";
import AssetCategories from "../pages/AssetCategories/index";
import Assets from "../pages/Assets/index";

import ProtectedRoute from "./ProtectedRoute";



function AppRoutes() {

    return (

        <Routes>


            {/* Public Route */}

            <Route
                path="/"
                element={<Login />}
            />



            {/* Protected ERP Routes */}

            <Route

                element={

                    <ProtectedRoute>

                        <Layout />

                    </ProtectedRoute>

                }

            >


                <Route

                    path="/dashboard"

                    element={<Dashboard />}

                />



                <Route

                    path="/employees"

                    element={<Employees />}

                />



                <Route

                    path="/departments"

                    element={<Departments />}

                />



                <Route

                    path="/designations"

                    element={<Designations />}

                />



                <Route

                    path="/locations"

                    element={<Locations />}

                />



                <Route

                    path="/asset-categories"

                    element={<AssetCategories />}

                />



                <Route

                    path="/assets"

                    element={<Assets />}

                />


            </Route>



        </Routes>

    );

}


export default AppRoutes;