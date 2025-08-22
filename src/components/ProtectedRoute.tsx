import type { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  
    const { user, loading } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    return children;
}