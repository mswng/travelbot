import "./Nearby.scss";

import {
    LocateFixed,
    Map,
    Search,
    Star,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";

import Pagination from "~/components/pagination/pagination";
import { getNearbyPlaces } from "~/services/placeService";

const NEARBY_RADIUS_KM = 10;
const NEARBY_LIMIT = 50;
const ITEMS_PER_PAGE = 12;

const fallbackImage =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836";

const matchesKeyword = (place, keyword) => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
        return true;
    }

    return [
        place.name,
        place.address,
        place.city,
        place.placeType,
        place.description,
    ].some((value) => value?.toLowerCase().includes(normalizedKeyword));
};

export default function Nearby() {
    const navigate = useNavigate();
    const pageTopRef = useRef(null);

    const [places, setPlaces] = useState([]);
    const [allNearbyPlaces, setAllNearbyPlaces] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [currentLocation, setCurrentLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(places.length / ITEMS_PER_PAGE);
    const paginatedPlaces = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

        return places.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentPage, places]);

    useEffect(() => {
        loadCurrentLocation();
    }, []);

    const loadCurrentLocation = () => {
        setError("");

        if (!("geolocation" in navigator)) {
            setError("Trình duyệt không hỗ trợ lấy vị trí hiện tại.");
            return;
        }

        setLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };

                setCurrentLocation(location);
                fetchNearbyPlaces(location);
                setLocating(false);
            },
            (geoError) => {
                const messages = {
                    [geoError.PERMISSION_DENIED]:
                        "Bạn đã từ chối quyền truy cập vị trí. Hãy cấp quyền Location cho trình duyệt rồi thử lại.",
                    [geoError.POSITION_UNAVAILABLE]:
                        "Không lấy được vị trí hiện tại từ thiết bị.",
                    [geoError.TIMEOUT]:
                        "Lấy vị trí quá lâu, vui lòng thử lại.",
                };

                setError(
                    messages[geoError.code] ||
                    "Không lấy được vị trí hiện tại."
                );
                setLocating(false);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 60000,
                timeout: 10000,
            }
        );
    };

    const fetchNearbyPlaces = async (location) => {
        try {
            setLoading(true);
            setError("");

            const data = await getNearbyPlaces({
                latitude: location.latitude,
                longitude: location.longitude,
                radiusKm: NEARBY_RADIUS_KM,
                limit: NEARBY_LIMIT,
            });

            setAllNearbyPlaces(data);
            setPlaces(data);
            setCurrentPage(1);

            if (data.length === 0) {
                setError(`Không tìm thấy địa điểm nào trong bán kính ${NEARBY_RADIUS_KM}km.`);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Chưa thể tải địa điểm gần bạn."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPlaces(allNearbyPlaces.filter((place) => matchesKeyword(place, keyword)));
        setCurrentPage(1);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);

        window.requestAnimationFrame(() => {
            pageTopRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    };

    const handleOpenMap = (place) => {
        navigate("/maps", {
            state: {
                selectedPlace: place,
                currentLocation,
            },
        });
    };

    return (
        <div className="nearby-page">
            <div
                className="nearby-header"
                ref={pageTopRef}
            >
                <div>
                    <h1>Gần tôi</h1>
                    <p>Địa điểm trong bán kính {NEARBY_RADIUS_KM}km từ vị trí hiện tại.</p>
                </div>

                <button
                    type="button"
                    onClick={loadCurrentLocation}
                    disabled={locating}
                >
                    <LocateFixed size={18} />
                    {locating ? "Đang lấy vị trí..." : "Cập nhật vị trí"}
                </button>
            </div>

            <div className="nearby-filters">
                <Search size={18} />
                <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            handleSearch();
                        }
                    }}
                    placeholder="Tìm trong địa điểm gần bạn..."
                />

                <button
                    type="button"
                    onClick={handleSearch}
                >
                    Tìm kiếm
                </button>
            </div>

            {loading && <p className="nearby-status">Đang tải địa điểm gần bạn...</p>}
            {error && <p className="nearby-status warning">{error}</p>}

            <div className="nearby-grid">
                {paginatedPlaces.map((place) => (
                    <article
                        className="nearby-card"
                        key={place.id}
                    >
                        <img
                            src={
                                place.primaryPhotoUrl ||
                                place.photoUrls?.[0] ||
                                fallbackImage
                            }
                            alt={place.name}
                        />

                        <div className="nearby-content">
                            <h3>{place.name}</h3>

                            <p>
                                <Star size={16} />
                                {place.rating || "N/A"}
                                {place.distanceKm !== undefined && place.distanceKm !== null && (
                                    <span>{place.distanceKm}km</span>
                                )}
                            </p>

                            <span>
                                {place.address || place.city || place.placeType || "Chưa có địa chỉ"}
                            </span>

                            <button
                                type="button"
                                onClick={() => handleOpenMap(place)}
                            >
                                <Map size={17} />
                                Xem bản đồ
                            </button>
                        </div>
                    </article>
                ))}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    );
}
