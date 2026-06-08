import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const StaffRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    const isStaff = user && (user.role === 'Admin' || user.role === 'Volunteer');
    return isStaff ? <Outlet /> : <Navigate to="/login" />;
};

export default StaffRoute;
