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
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";



function RootRouter() {
    const { currentUser, loading } = useAuth();
    if (loading) return null;
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }
    if (currentUser.role === "Admin" || currentUser.role === "Manager") {
        return <Navigate to="/dashboard" replace />;
    } else {
        return <Navigate to="/login" replace />;
    }
}

function AppRoutes() {
    return (
        <Routes>
            {/* Root Router redirect helper */}
            <Route path="/" element={<RootRouter />} />

            {/* Login Route (Admin & Manager Email/Password login by default) */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin" element={<Navigate to="/login" replace />} />

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



            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

    );

}


export default AppRoutes;