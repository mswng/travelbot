import "./Nearby.scss";

import {
    useEffect,
    useState,
} from "react";

import { unwrapPageContent } from "~/services/apiUtils";
import { getPublicPlaces } from "~/services/placeService";

export default function Nearby() {
    const [places, setPlaces] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [city, setCity] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchPlaces();
    }, []);

    const fetchPlaces = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getPublicPlaces({
                keyword,
                city,
                page: 0,
                size: 12,
                sortBy: "rating",
                sortDir: "desc",
            });

            setPlaces(unwrapPageContent(data));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Khong tai duoc danh sach dia diem"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="nearby-page">
            <h1>Kham pha dia diem</h1>

            <div className="nearby-filters">
                <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tim theo ten, mo ta..."
                />

                <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Thanh pho"
                />

                <button onClick={fetchPlaces}>
                    Tim kiem
                </button>
            </div>

            {loading && <p>Dang tai dia diem...</p>}
            {error && <p>{error}</p>}

            <div className="nearby-grid">
                {places.map((place) => (
                    <div
                        className="nearby-card"
                        key={place.id}
                    >
                        <img
                            src={
                                place.primaryPhotoUrl ||
                                place.photoUrls?.[0] ||
                                "https://images.unsplash.com/photo-1504674900247-0877df9cc836"
                            }
                            alt={place.name}
                        />

                        <div className="nearby-content">
                            <h3>{place.name}</h3>

                            <p>
                                Rating {place.rating || "N/A"}
                            </p>

                            <span>
                                {place.address || place.city || place.placeType}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
