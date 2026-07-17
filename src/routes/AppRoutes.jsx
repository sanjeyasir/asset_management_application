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

import ProtectedRoute, { ResetPasswordRoute, PageAccessGuard } from "./ProtectedRoute";
import ResetPassword from "../pages/ResetPassword/index";



function AppRoutes() {

    return (

        <Routes>


            {/* Public Route */}

            <Route
                path="/"
                element={<Login />}
            />

            <Route
                path="/reset-password"
                element={
                    <ResetPasswordRoute>
                        <ResetPassword />
                    </ResetPasswordRoute>
                }
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

                    element={
                        <PageAccessGuard allowedRoles={["Admin"]}>
                            <Employees />
                        </PageAccessGuard>
                    }

                />



                <Route

                    path="/departments"

                    element={
                        <PageAccessGuard allowedRoles={["Admin"]}>
                            <Departments />
                        </PageAccessGuard>
                    }

                />



                <Route

                    path="/designations"

                    element={
                        <PageAccessGuard allowedRoles={["Admin"]}>
                            <Designations />
                        </PageAccessGuard>
                    }

                />



                <Route

                    path="/locations"

                    element={
                        <PageAccessGuard allowedRoles={["Admin", "Manager"]}>
                            <Locations />
                        </PageAccessGuard>
                    }

                />



                <Route

                    path="/asset-categories"

                    element={
                        <PageAccessGuard allowedRoles={["Admin", "Manager"]}>
                            <AssetCategories />
                        </PageAccessGuard>
                    }

                />



                <Route

                    path="/assets"

                    element={
                        <PageAccessGuard allowedRoles={["Admin", "Manager", "Employee"]}>
                            <Assets />
                        </PageAccessGuard>
                    }

                />


            </Route>



        </Routes>

    );

}


export default AppRoutes;