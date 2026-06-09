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
    MapPinned,
    Users,
} from "lucide-react";

import {
    getDashboard,
    getUsers,
} from "~/services/adminService";
import { unwrapPageContent } from "~/services/apiUtils";

const DASHBOARD_REFRESH_MS = 15000;

function Dashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard({ showLoading: true });

        const intervalId = window.setInterval(() => {
            fetchDashboard();
        }, DASHBOARD_REFRESH_MS);

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                fetchDashboard();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const fetchRecentUsersFallback = async (totalUsers = 0) => {
        if (totalUsers <= 0) return [];

        try {
            const data = await getUsers(0, 10);
            return unwrapPageContent(data);
        } catch {
            return [];
        }
    };

    const fetchDashboard = async ({ showLoading = false } = {}) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            const data = await getDashboard();
            const recentUsers = Array.isArray(data?.recentUsers)
                ? data.recentUsers
                : [];
            const resolvedRecentUsers = recentUsers.length > 0
                ? recentUsers
                : await fetchRecentUsersFallback(data?.totalUsers || 0);

            setDashboardData({
                ...data,
                recentUsers: resolvedRecentUsers,
            });
        } catch (err) {
            console.log(err);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                Đang tải dashboard...
            </div>
        );
    }

    const stats = [
        {
            title: "Người dùng",
            value: dashboardData?.totalUsers || 0,
            icon: <Users size={28} />,
        },
        {
            title: "Địa điểm du lịch",
            value: dashboardData?.totalPlaces || 0,
            icon: <MapPinned size={28} />,
        },
    ];

    return (
        <div className="dashboard-page">
            <div className="dashboard-top">
                <h1>
                    Trang quản trị
                </h1>

                <p>
                    Theo dõi nhanh số lượng người dùng, địa điểm và những tài khoản mới đăng ký gần đây.
                </p>
            </div>

            <div className="stats-cards">
                {stats.map((item) => (
                    <StatsCard
                        key={item.title}
                        icon={item.icon}
                        title={item.title}
                        value={item.value}
                    />
                ))}
            </div>

            <div className="dashboard-section">
                <div className="section-header">
                    <h2>
                        Top 10 user mới đăng ký
                    </h2>
                </div>

                <UserTable
                    users={dashboardData?.recentUsers || []}
                />
            </div>
        </div>
    );
}

export default Dashboard;
