import "./Itinerary.scss";

const itineraryData = [
    {
        date: "29/04",
        day: "Ngày 1",
        weekday: "Thứ 2",

        schedules: [
            {
                time: "07:30",
                title:
                    "Di chuyển từ TP.HCM đến Quy Nhơn",

                description:
                    "Xuất phát sớm để tránh kẹt xe và nghỉ ngơi trên đường.",

                note:
                    "Chuẩn bị đồ ăn nhẹ và nước uống.",
            },

            {
                time: "11:30",
                title:
                    "Ăn trưa và checkin resort",

                description:
                    "Dùng bữa trưa gần biển sau đó về resort nhận phòng.",

                note:
                    "Checkin từ 14:00, có thể vào sớm nếu còn phòng.",
            },

            {
                time: "15:00",
                title:
                    "Tắm biển & chụp ảnh",

                description:
                    "Khám phá bãi biển riêng của resort và thư giãn.",

                note:
                    "Mang theo kem chống nắng.",
            },

            {
                time: "18:30",
                title:
                    "Ăn tối hải sản",

                description:
                    "Thưởng thức các món hải sản nổi tiếng Quy Nhơn.",

                note:
                    "Nên đặt bàn trước giờ cao điểm.",
            },

            {
                time: "21:00",
                title:
                    "Cafe & dạo biển đêm",

                description:
                    "Ngắm biển đêm và thư giãn cùng bạn bè.",

                note:
                    "Có thể ghé surf bar gần biển.",
            },
        ],
    },

    {
        date: "30/04",
        day: "Ngày 2",
        weekday: "Thứ 3",

        schedules: [
            {
                time: "06:00",
                title:
                    "Ngắm bình minh",

                description:
                    "Dậy sớm ngắm bình minh và chụp ảnh.",

                note:
                    "Thời điểm đẹp nhất khoảng 5:45 - 6:15.",
            },

            {
                time: "08:00",
                title:
                    "Khám phá Kỳ Co",

                description:
                    "Di chuyển bằng cano ra đảo Kỳ Co.",

                note:
                    "Chuẩn bị đồ bơi và khăn.",
            },
        ],
    },
];

export default function Itinerary() {

    return (
        <div className="itinerary-page">

            <div className="itinerary-header">

                <h1>
                    Lịnh trình cụ thể
                </h1>

                <p>
                    Kế hoạch du lịch chi tiết cho chuyến đi của bạn.
                </p>

            </div>

            <div className="itinerary-wrapper">

                {itineraryData.map((dayItem, index) => (

                    <div
                        className="day-section"
                        key={index}
                    >

                        {/* LEFT DATE */}

                        <div className="day-info">

                            <h2>
                                {dayItem.date}
                            </h2>

                            <span>
                                {dayItem.weekday}
                            </span>

                        </div>

                        {/* RIGHT CONTENT */}

                        <div className="day-content">

                            <div className="day-title">
                                {dayItem.day}
                            </div>

                            {dayItem.schedules.map(
                                (item, idx) => (

                                    <div
                                        className="timeline-item"
                                        key={idx}
                                    >

                                        {/* TIME */}

                                        <div className="timeline-time">
                                            {item.time}
                                        </div>

                                        {/* DOT */}

                                        <div className="timeline-center">

                                            <div className="timeline-dot" />

                                            {idx !==
                                                dayItem.schedules.length - 1 && (
                                                <div className="timeline-line" />
                                            )}

                                        </div>

                                        {/* CONTENT */}

                                        <div className="timeline-card">

                                            <h3>
                                                {item.title}
                                            </h3>

                                            <p>
                                                {item.description}
                                            </p>

                                            <div className="timeline-note">

                                                <strong>
                                                    Ghi chú:
                                                </strong>

                                                <span>
                                                    {item.note}
                                                </span>

                                            </div>

                                        </div>

                                    </div>
                                )
                            )}

                        </div>

                    </div>
                ))}

            </div>

        </div>
    );
}