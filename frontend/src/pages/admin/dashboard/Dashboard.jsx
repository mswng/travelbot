import "./Dashboard.scss";

import {
    useEffect,
    useState,
} from "react";

import StatsCard
from "~/components/dashborad/StatsCard/StatsCard";

import UserTable
from "~/components/dashborad/UserTable/UserTable";

import {
    Users,
    MapPinned,
    FileText,
} from "lucide-react";

import {
    getDashboard,
} from "~/services/adminService";

function Dashboard() {

    /* STATE */

    const [dashboardData, setDashboardData] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    /* FETCH */

    useEffect(() => {

        fetchDashboard();

    }, []);

    const fetchDashboard = async () => {

        try {

            setLoading(true);

            const data =
                await getDashboard();

            console.log(data);

            setDashboardData(data);

        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);
        }
    };

    /* LOADING */

    if (loading) {

        return (

            <div className="dashboard-loading">

                Loading dashboard...

            </div>
        );
    }

    /* STATS */

    const stats = [

        {
            title: "Người dùng",

            value:
                dashboardData?.totalUsers || 0,

            icon:
                <Users size={28} />,
        },

        {
            title: "Địa điểm du lịch",

            value:
                dashboardData?.totalPlaces || 0,

            icon:
                <MapPinned size={28} />,
        },
    ];

    return (

        <div className="dashboard-page">

            {/* HEADER */}

            <div className="dashboard-top">

                <h1>
                    Trang quản trị
                </h1>

                <p>
                    Chào mừng đến với trang quản trị của TravelBot!
                    <br />

                    Tại đây, bạn có thể theo dõi và quản lý tất cả
                    các hoạt động trên nền tảng của chúng tôi.
                    <br />

                    Dưới đây là tổng quan về số liệu thống kê,
                    người dùng và bài viết gần đây nhất.
                </p>

            </div>

            {/* STATS */}

            <div className="stats-cards">

                {stats.map((item, index) => (

                    <StatsCard
                        key={index}
                        icon={item.icon}
                        title={item.title}
                        value={item.value}
                    />

                ))}

            </div>

            {/* RECENT USERS */}

            <div className="dashboard-section">

                <div className="section-header">

                    <h2>
                        Người dùng gần đây
                    </h2>

                </div>

                <UserTable
                    users={
                        dashboardData?.recentUsers || []
                    }
                />

            </div>

        </div>
    );
}

export default Dashboard;