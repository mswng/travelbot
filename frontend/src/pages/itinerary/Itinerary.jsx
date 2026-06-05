import "./Itinerary.scss";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { unwrapPageContent } from "~/services/apiUtils";
import {
    deleteItinerary,
    generateItinerary,
    getItineraries,
} from "~/services/itineraryService";

const parseContent = (content) => {
    if (!content) return null;

    try {
        return JSON.parse(content);
    } catch {
        return null;
    }
};

export default function Itinerary() {
    const [form, setForm] = useState({
        destination: "Da Nang",
        durationDays: 3,
        startDate: "",
        preferences: "am thuc, bien, van hoa",
        budget: "trung binh",
    });
    const [itineraries, setItineraries] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchItineraries();
    }, []);

    const selectedContent = useMemo(
        () => parseContent(selected?.content),
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
                "Khong tai duoc lich trinh. Hay dang nhap neu API yeu cau token."
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
                "Khong tao duoc lich trinh"
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

    const renderStructuredContent = () => {
        const days =
            selectedContent?.days ||
            selectedContent?.itinerary ||
            selectedContent?.schedule;

        if (!Array.isArray(days)) return null;

        return days.map((dayItem, index) => {
            const items =
                dayItem.schedules ||
                dayItem.activities ||
                dayItem.items ||
                [];

            return (
                <div
                    className="day-section"
                    key={index}
                >
                    <div className="day-info">
                        <h2>{dayItem.date || `Ngay ${index + 1}`}</h2>
                        <span>{dayItem.weekday || dayItem.title || ""}</span>
                    </div>

                    <div className="day-content">
                        <div className="day-title">
                            {dayItem.day || dayItem.title || `Ngay ${index + 1}`}
                        </div>

                        {items.map((item, idx) => (
                            <div
                                className="timeline-item"
                                key={idx}
                            >
                                <div className="timeline-time">
                                    {item.time || ""}
                                </div>

                                <div className="timeline-center">
                                    <div className="timeline-dot" />

                                    {idx !== items.length - 1 && (
                                        <div className="timeline-line" />
                                    )}
                                </div>

                                <div className="timeline-card">
                                    <h3>{item.title || item.name || "Hoat dong"}</h3>
                                    <p>{item.description || item.detail || ""}</p>

                                    {(item.note || item.tips) && (
                                        <div className="timeline-note">
                                            <strong>Ghi chu:</strong>
                                            <span>{item.note || item.tips}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="itinerary-page">
            <div className="itinerary-header">
                <h1>Tao lich trinh AI</h1>
                <p>Nhap nhu cau, goi API generate va xem cac lich trinh da luu.</p>
            </div>

            <form
                className="itinerary-form"
                onSubmit={handleGenerate}
            >
                <input
                    name="destination"
                    value={form.destination}
                    onChange={handleChange}
                    placeholder="Diem den"
                />

                <input
                    type="number"
                    min="1"
                    name="durationDays"
                    value={form.durationDays}
                    onChange={handleChange}
                    placeholder="So ngay"
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
                    placeholder="So thich"
                />

                <select
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                >
                    <option value="tiet kiem">Tiet kiem</option>
                    <option value="trung binh">Trung binh</option>
                    <option value="cao cap">Cao cap</option>
                </select>

                <button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Dang tao..." : "Tao lich trinh"}
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
                        Xoa
                    </button>
                </div>
            )}

            <div className="itinerary-wrapper">
                {renderStructuredContent() || (
                    <pre className="itinerary-raw">
                        {selected?.content || "Chua co lich trinh nao."}
                    </pre>
                )}
            </div>
        </div>
    );
}
