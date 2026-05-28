import "./adminHeader.scss";

import {
    Bell,
    Search,
} from "lucide-react";

export default function AdminHeader() {

    return (
        <header className="admin-header">

            <div className="search-box">

                <Search size={18} />

                <input
                    type="text"
                    placeholder="Search..."
                />

            </div>

            <div className="header-right">

                <div className="admin-profile">

                    <img
                        src="https://i.pravatar.cc/150"
                        alt=""
                    />

                    <div>

                        <h4>Admin</h4>

                        <span>
                            Super Admin
                        </span>

                    </div>

                </div>

            </div>

        </header>
    );
}