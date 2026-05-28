import "./Dashboard.scss";

import StatsCard
from "~/components/dashborad/StatsCard/StatsCard";

import UserTable
from "~/components/dashborad/UserTable/UserTable";

import PostTable
from "~/components/dashborad/PostTable/PostTable";

import {
    Users,
    MapPinned,
    FileText,
} from "lucide-react";

/* STATS */

const stats = [

    {
        title: "Người dùng",
        value: "12,540",
        icon: <Users size={28} />,
    },

    {
        title: "Bài viết",
        value: "1,245",
        icon: <FileText size={28} />,
    },

    {
        title: "Địa điểm du lịch",
        value: "328",
        icon: <MapPinned size={28} />,
    },
];

/* USERS */

const users = [

    {
        id: 1,
        name: "Nguyen Van A",
        email: "admin@gmail.com",
        role: "ADMIN",
    },

    {
        id: 2,
        name: "Tran Thi B",
        email: "user@gmail.com",
        role: "USER",
    },
];

/* POSTS */

const posts = [

    {
        id: 1,
        title: "Discover Bali",
        location: "Indonesia",
        status: "Published",
    },

    {
        id: 2,
        title: "Da Lat Adventure",
        location: "Vietnam",
        status: "Draft",
    },
];

function Dashboard() {

    return (

            <div className="dashboard-page">

                {/* HEADER */}

                <div className="dashboard-top">

                    <h1>
                        Trang quản trị
                    </h1>

                    <p>
                        Chào mừng đến với trang quản trị của TravelBot! 
                        <br/>
                        Tại đây, bạn có thể theo dõi và quản lý tất cả các hoạt động trên nền tảng của chúng tôi.
                        <br/>
                        Dưới đây là tổng quan về số liệu thống kê, người dùng và bài viết gần đây nhất.
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

                {/* USERS */}

                <div className="dashboard-section">

                    <div className="section-header">

                        <h2>
                            Người dùng gần đây
                        </h2>

                    </div>

                    <UserTable users={users} />

                </div>

                {/* POSTS */}

                <div className="dashboard-section">

                    <div className="section-header">

                        <h2>
                            Bài viết gần đây
                        </h2>

                    </div>

                    <PostTable posts={posts} />

                </div>

            </div>
    );
}

export default Dashboard;