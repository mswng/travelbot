import "./AdminLayouts.scss";

import AdminSidebar
from "~/components/adminLayouts/adminSidebar/adminSidebar.jsx";

import AdminHeader
from "~/components/adminLayouts/adminHeader/adminHeader.jsx";

import AdminFooter
from "~/components/adminLayouts/adminFooter/adminFooter.jsx";

export default function AdminLayout({
    children,
}) {

    return (

        <div className="admin-layout">

            {/* SIDEBAR */}

            <AdminSidebar />

            {/* MAIN */}

            <div className="admin-main">

                <AdminHeader />

                <div className="admin-content">

                    {children}

                </div>

                <AdminFooter />

            </div>
        </div>
    );
}