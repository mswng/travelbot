import "./adminHeader.scss";

import {
    Search,
    User,
} from "lucide-react";

export default function AdminHeader() {
    return (
        <header className="admin-header">
            <div className="search-box">
                <Search size={18} />

                <input
                    type="text"
                    placeholder="Tìm kiếm..."
                />
            </div>

            <div className="header-right">
                <div className="admin-profile">
                    <div className="admin-avatar-icon">
                        <User size={22} />
                    </div>

                    <div>
                        <h4>Admin</h4>

                        <span>
                            Quản trị viên
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
