import "./Itinerary.scss";

import {
    useEffect,
    useMemo,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { unwrapPageContent } from "~/services/apiUtils";
import {
    deleteItinerary,
    generateItinerary,
    getItineraries,
} from "~/services/itineraryService";

const parseContent = (content) => {
    if (!content) return null;

    if (typeof content === "object") {
        return content;
    }

    let value = content;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        if (typeof value !== "string") {
            return value;
        }

        const candidate = extractFirstJsonObject(value);

        try {
            value = JSON.parse(candidate);
        } catch {
            try {
                value = JSON.parse(sanitizeJsonText(candidate));
            } catch {
                return null;
            }
        }
    }

    return typeof value === "string" ? null : value;
};

const extractFirstJsonObject = (text) => {
    const start = text.indexOf("{");

    if (start === -1) {
        return text;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < text.length; index += 1) {
        const char = text[index];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (char === "\\") {
            escaped = true;
            continue;
        }

        if (char === "\"") {
            inString = !inString;
            continue;
        }

        if (inString) {
            continue;
        }

        if (char === "{") {
            depth += 1;
        }

        if (char === "}") {
            depth -= 1;

            if (depth === 0) {
                return text.slice(start, index + 1);
            }
        }
    }

    return text.slice(start);
};

const sanitizeJsonText = (text) =>
    text
        .replace(
            /:\s*(\d{1,3}(?:\.\d{3})+)(?=\s*[,}])/g,
            ': "$1 VND"'
        )
        .replace(/,\s*([}\]])/g, "$1");

const normalizeContent = (payload) => {
    if (!payload) return null;

    if (payload.days || payload.itinerary || payload.schedule) {
        return payload;
    }

    if (payload.content) {
        const nestedContent = parseContent(payload.content);

        if (nestedContent) {
            return normalizeContent(nestedContent);
        }
    }

    return payload;
};

const dayPeriodLabels = {
    morning: "Buổi sáng",
    afternoon: "Buổi chiều",
    evening: "Buổi tối",
};

const getActivityTime = (item) => {
    if (item.start_time && item.end_time) {
        return `${item.start_time} - ${item.end_time}`;
    }

    return item.time || item.start_time || "";
};

const formatDisplayDate = (date) => {
    if (!date) {
        return "";
    }

    const value = String(date).trim();
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (isoMatch) {
        return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
    }

    return value;
};

const addDays = (dateValue, daysToAdd) => {
    if (!dateValue) {
        return "";
    }

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    date.setDate(date.getDate() + daysToAdd);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
};

const getDayLabel = (dayItem, index, startDate) => {
    const dayNumber = dayItem.day || index + 1;
    const date =
        formatDisplayDate(dayItem.date) ||
        addDays(startDate, index);

    return date
        ? `Ngày ${dayNumber}: ${date}`
        : `Ngày ${dayNumber}`;
};

const toReadableLabel = (key) =>
    ({
        name: "Tên",
        address: "Địa chỉ",
        area: "Khu vực",
        suggested_hotel_type: "Loại lưu trú",
        estimated_price_per_night: "Giá mỗi đêm",
        reason: "Lý do chọn",
        recommended_area: "Khu vực đề xuất",
        hotel_suggestions: "Gợi ý khách sạn",
        why_choose: "Vì sao nên chọn",
        why_this_area: "Lý do chọn khu vực",
        total_trip_budget: "Tổng ngân sách chuyến đi",
        budget_estimate: "Dự toán chi phí",
        meals: "Ăn uống",
        accommodation: "Lưu trú",
        transportation: "Di chuyển",
        transport: "Di chuyển",
        tickets: "Vé tham quan",
        ticket_price: "Giá vé",
        estimated_cost: "Chi phí dự kiến",
        other_costs: "Chi phí khác",
        daily_budget: "Ngân sách ngày",
        route_summary: "Cung đường",
        public_transport: "Phương tiện công cộng",
        private_transports: "Phương tiện cá nhân/riêng",
    }[key] ||
        key
            .replaceAll("_", " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2"));

const formatReadableValue = (value) => {
    if (value === null || value === undefined) {
        return "";
    }

    if (typeof value === "string" || typeof value === "number") {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => formatReadableValue(item))
            .filter(Boolean)
            .join("\n");
    }

    if (typeof value === "object") {
        return Object.entries(value)
            .map(([key, itemValue]) => {
                const formattedValue = formatReadableValue(itemValue);

                return formattedValue
                    ? `${toReadableLabel(key)}: ${formattedValue}`
                    : "";
            })
            .filter(Boolean)
            .join("\n");
    }

    return String(value);
};

const looksLikeDayList = (value) =>
    Array.isArray(value) &&
    value.some((item) =>
        item &&
        typeof item === "object" &&
        (
            item.day ||
            item.date ||
            item.title ||
            item.activities ||
            item.schedules ||
            item.morning ||
            item.afternoon ||
            item.evening
        )
    );

const findDayList = (payload) => {
    if (!payload || typeof payload !== "object") {
        return null;
    }

    const directDays =
        payload.days ||
        payload.itinerary ||
        payload.schedule ||
        payload.daily_itinerary ||
        payload.dailyItinerary ||
        payload.plan ||
        payload.trip_plan;

    if (looksLikeDayList(directDays)) {
        return directDays;
    }

    for (const value of Object.values(payload)) {
        if (looksLikeDayList(value)) {
            return value;
        }

        if (value && typeof value === "object" && !Array.isArray(value)) {
            const nestedDays = findDayList(value);

            if (nestedDays) {
                return nestedDays;
            }
        }
    }

    return null;
};

const flattenReadableEntries = (payload, parentKey = "") => {
    if (!payload || typeof payload !== "object") {
        return [];
    }

    return Object.entries(payload).flatMap(([key, value]) => {
        if ([
            "days",
            "itinerary",
            "schedule",
            "activities",
            "items",
            "hotel_base",
            "transportation",
            "total_trip_budget",
        ].includes(key)) {
            return [];
        }

        const label = parentKey
            ? `${parentKey} - ${toReadableLabel(key)}`
            : toReadableLabel(key);

        if (
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
        ) {
            return flattenReadableEntries(value, label);
        }

        const formattedValue = formatReadableValue(value);

        return formattedValue
            ? [{ label, value: formattedValue }]
            : [];
    });
};

const getExtraSectionValue = (content, key) => {
    if (key === "budget_estimate") {
        return [
            content?.total_trip_budget
                ? `Tổng ngân sách chuyến đi: ${formatReadableValue(content.total_trip_budget)}`
                : "",
            formatReadableValue(content?.budget_estimate),
        ].filter(Boolean).join("\n");
    }

    return formatReadableValue(content?.[key]);
};

const extraSections = [
    {
        key: "budget_estimate",
        label: "Dự toán chi phí",
    },
    {
        key: "accommodation",
        label: "Lưu trú",
    },
    {
        key: "packing_tips",
        label: "Chuẩn bị hành lý",
    },
    {
        key: "important_notes",
        label: "Lưu ý quan trọng",
    },
];

export default function Itinerary() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        destination: "Địa điểm bạn muốn đi du lịch, ví dụ: Đà Nẵng",
        durationDays: 3,
        startDate: "",
        preferences: "Sở thích của bạn, ví dụ: thích đi biển, không thích đi bộ nhiều",
        budget: "Trung bình",
    });
    const [itineraries, setItineraries] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchItineraries();
    }, []);

    const selectedContent = useMemo(
        () => normalizeContent(parseContent(selected?.content ?? selected)),
        [selected]
    );

    const fetchItineraries = async () => {
        try {
            const data = await getItineraries({
                page: 0,
                size: 10,
            });
            const list = unwrapPageContent(data);
            setItineraries(list);
            setSelected((prev) => prev || list[0] || null);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không thể tải được lịch trình. Hay đăng nhập nếu API yêu cầu token."
            );
        }
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleGenerate = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const created = await generateItinerary({
                ...form,
                durationDays: Number(form.durationDays),
                startDate: form.startDate || null,
            });

            setSelected(created);
            await fetchItineraries();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không thể tạo được lịch trình"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const ok = window.confirm("Xoa lich trinh nay?");
        if (!ok) return;

        await deleteItinerary(id);
        setSelected(null);
        fetchItineraries();
    };

    const handleOpenMap = (value) => {
        const keyword = formatReadableValue(value).trim();

        if (!keyword) {
            return;
        }

        navigate(`/maps?keyword=${encodeURIComponent(keyword)}`);
    };

    const renderStructuredContent = () => {
        const days = findDayList(selectedContent);

        if (!Array.isArray(days)) return null;

        return (
            <>
                {selectedContent?.overview && (
                    <section className="itinerary-overview">
                        <h2>Tổng quan</h2>
                        <p>{formatReadableValue(selectedContent.overview)}</p>
                    </section>
                )}

                {days.map((dayItem, index) => {
                    const items =
                        dayItem.schedules ||
                        dayItem.activities ||
                        dayItem.items ||
                        Object.entries(dayPeriodLabels)
                            .filter(([key]) => dayItem[key])
                            .map(([key, label]) => ({
                                time: label,
                                title: label,
                                description: dayItem[key],
                            }));

                    return (
                        <div
                            className="day-section"
                            key={index}
                        >
                            <div className="day-info">
                                <h2>{getDayLabel(dayItem, index, selected?.startDate)}</h2>
                                <span>{dayItem.weekday || dayItem.title || ""}</span>
                            </div>

                            <div className="day-content">
                                <div className="day-title">
                                    {dayItem.title || `Ngày ${dayItem.day || index + 1}`}
                                </div>

                                {dayItem.start_from && (
                                    <div className="day-route-summary">
                                        <strong>Xuất phát:</strong>
                                        <span>{formatReadableValue(dayItem.start_from)}</span>
                                    </div>
                                )}

                                {items.map((item, idx) => (
                                    <div
                                        className="timeline-item"
                                        key={idx}
                                    >
                                        <div className="timeline-time">
                                            {getActivityTime(item)}
                                        </div>

                                        <div className="timeline-center">
                                            <div className="timeline-dot" />

                                            {idx !== items.length - 1 && (
                                                <div className="timeline-line" />
                                            )}
                                        </div>

                                        <div className="timeline-card">
                                            <h3>{item.title || item.name || "Hoạt động"}</h3>
                                            {item.location && (
                                                <div className="timeline-location">
                                                    {item.location}
                                                </div>
                                            )}

                                            <p>{formatReadableValue(item.description || item.detail)}</p>

                                            <div className="timeline-meta-grid">
                                                {item.ticket_price && (
                                                    <div>
                                                        <strong>Giá vé</strong>
                                                        <span>{formatReadableValue(item.ticket_price)}</span>
                                                    </div>
                                                )}

                                                {item.estimated_cost && (
                                                    <div>
                                                        <strong>Chi phí</strong>
                                                        <span>{formatReadableValue(item.estimated_cost)}</span>
                                                    </div>
                                                )}

                                                {item.transport && (
                                                    <div>
                                                        <strong>Di chuyển</strong>
                                                        <span>{formatReadableValue(item.transport)}</span>
                                                    </div>
                                                )}

                                                {item.from_location && (
                                                    <div>
                                                        <strong>Đi từ</strong>
                                                        <span>{formatReadableValue(item.from_location)}</span>
                                                    </div>
                                                )}

                                                {item.travel_time && (
                                                    <div>
                                                        <strong>Thời gian đi</strong>
                                                        <span>{formatReadableValue(item.travel_time)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {item.notes && (
                                                <div className="timeline-note">
                                                    <strong>Ghi chú</strong>
                                                    <span>{formatReadableValue(item.notes)}</span>
                                                </div>
                                            )}

                                            {item.location && (
                                                <button
                                                    className="timeline-map-btn"
                                                    type="button"
                                                    onClick={() => handleOpenMap(item.location)}
                                                >
                                                    Xem bản đồ
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {(dayItem.meals || dayItem.daily_budget || dayItem.route_summary || dayItem.tips) && (
                                    <div className="day-notes">
                                        {dayItem.route_summary && (
                                            <div className="timeline-note">
                                                <strong>Cung đường trong ngày</strong>
                                                <span>{formatReadableValue(dayItem.route_summary)}</span>
                                            </div>
                                        )}

                                        {Array.isArray(dayItem.meals) && dayItem.meals.map((meal, mealIndex) => (
                                            <div
                                                className="timeline-note"
                                                key={mealIndex}
                                            >
                                                <strong>
                                                    {[meal.time, meal.type].filter(Boolean).join(" - ") || "Bữa ăn"}
                                                </strong>
                                                <span>
                                                    {[
                                                        formatReadableValue(meal.place),
                                                        formatReadableValue(meal.suggestion),
                                                        formatReadableValue(meal.estimated_cost),
                                                    ].filter(Boolean).join(" | ")}
                                                </span>

                                                {meal.place && (
                                                    <button
                                                        className="timeline-map-btn"
                                                        type="button"
                                                        onClick={() => handleOpenMap(meal.place)}
                                                    >
                                                        Xem bản đồ
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {dayItem.meals && !Array.isArray(dayItem.meals) && (
                                            <div className="timeline-note">
                                                <strong>Bữa ăn</strong>
                                                <span>{formatReadableValue(dayItem.meals)}</span>
                                            </div>
                                        )}

                                        {dayItem.daily_budget && (
                                            <div className="timeline-note">
                                                <strong>Ngân sách ngày</strong>
                                                <span>{formatReadableValue(dayItem.daily_budget)}</span>
                                            </div>
                                        )}

                                        {dayItem.tips && (
                                            <div className="timeline-note">
                                                <strong>Lưu ý</strong>
                                                <span>{formatReadableValue(dayItem.tips)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                <section className="itinerary-extra-grid">
                    {extraSections
                        .map((section) => ({
                            ...section,
                            value: getExtraSectionValue(selectedContent, section.key),
                        }))
                        .filter((section) => section.value)
                        .map((section) => (
                            <article
                                className="itinerary-extra-card"
                                key={section.key}
                            >
                                <h3>{section.label}</h3>
                                <p>{section.value}</p>
                            </article>
                        ))}
                </section>
            </>
        );
    };

    const renderReadableFallback = () => {
        if (!selected) {
            return (
                <div className="itinerary-empty">
                    Chưa có lịch trình nào.
                </div>
            );
        }

        if (selectedContent && typeof selectedContent === "object") {
            const readableEntries = flattenReadableEntries(selectedContent);

            if (readableEntries.length > 0) {
                return (
                    <section className="itinerary-extra-grid">
                        {readableEntries.map((entry) => (
                            <article
                                className="itinerary-extra-card"
                                key={entry.label}
                            >
                                <h3>{entry.label}</h3>
                                <p>{entry.value}</p>
                            </article>
                        ))}
                    </section>
                );
            }
        }

        return (
            <div className="itinerary-empty">
                Chưa có nội dung lịch trình để hiển thị.
            </div>
        );
    };

    return (
        <div className="itinerary-page">
            <div className="itinerary-header">
                <h1>Tạo lịch trình AI</h1>
                <p>Nhập nhu cầu, gọi API generate và xem các lịch trình đã lưu.</p>
            </div>

            <form
                className="itinerary-form"
                onSubmit={handleGenerate}
            >
                <input
                    name="destination"
                    value={form.destination}
                    onChange={handleChange}
                    placeholder="Điểm đến"
                />

                <input
                    type="number"
                    min="1"
                    name="durationDays"
                    value={form.durationDays}
                    onChange={handleChange}
                    placeholder="Số ngày"
                />

                <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                />

                <input
                    name="preferences"
                    value={form.preferences}
                    onChange={handleChange}
                    placeholder="Sở thích"
                />

                <select
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                >
                    <option value="tiet kiem">Tiết kiệm</option>
                    <option value="trung binh">Trung bình</option>
                    <option value="cao cap">Cao cấp</option>
                </select>

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Đang tạo..." : "Tạo lịch trình"}
                </button>
            </form>

            {error && <p className="itinerary-error">{error}</p>}

            <div className="itinerary-list">
                {itineraries.map((item) => (
                    <button
                        key={item.id}
                        className={selected?.id === item.id ? "active" : ""}
                        onClick={() => setSelected(item)}
                    >
                        {item.title || item.destination}
                    </button>
                ))}
            </div>

            {selected && (
                <div className="itinerary-selected">
                    <div>
                        <h2>{selected.title || selected.destination}</h2>
                        <p>{selected.summary}</p>
                    </div>

                    <button onClick={() => handleDelete(selected.id)}>
                        Xóa
                    </button>
                </div>
            )}

            <div className="itinerary-wrapper">
                {renderStructuredContent() || renderReadableFallback()}
            </div>
        </div>
    );
}
