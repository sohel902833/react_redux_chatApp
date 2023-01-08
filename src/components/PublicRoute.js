import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const PublicRoute = ({ children }) => {
  const isLoggedIn = useAuth();
  return isLoggedIn ? <Navigate to="/inbox" /> : children;
};

export default PublicRoute;
