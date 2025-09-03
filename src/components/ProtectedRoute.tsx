import type { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Box, CircularProgress } from "@mui/material";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();


    if (loading) {
        return (
            <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}