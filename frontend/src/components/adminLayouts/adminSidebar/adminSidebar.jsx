import "./adminSidebar.scss";

import {
    LayoutDashboard,
    Users,
    FileText,
    LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { logout } from "~/services/authService";

export default function AdminSidebar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        localStorage.removeItem("rememberUser");
        navigate("/admin/login", { replace: true });
    };

    return (
        <aside className="admin-sidebar">

            <div className="sidebar-logo">

                <h2>TravelBot</h2>

                <span>Trang admin</span>

            </div>

            <nav className="sidebar-menu">

                <a href="/admin">
                    <LayoutDashboard size={20} />
                    Dashboard
                </a>

                <a href="/admin/users">
                    <Users size={20} />
                    Người dùng
                </a>

                <a href="/admin/places">
                    <FileText size={20} />
                    Địa điểm
                </a>


            </nav>

            <button
                className="logout-btn"
                type="button"
                onClick={handleLogout}
            >

                <LogOut size={18} />
                Đăng xuất

            </button>

        </aside>
    );
}
