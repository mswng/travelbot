import "./Maps.scss";

import {
    MapPin,
    Navigation,
    Search,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { unwrapPageContent } from "~/services/apiUtils";
import { getPublicPlaces } from "~/services/placeService";

const fallbackPlaces = [
    {
        id: "fallback-1",
        name: "Nha tho Duc Ba",
        address: "Quan 1, TP. Ho Chi Minh",
        latitude: 10.7798,
        longitude: 106.699,
    },
    {
        id: "fallback-2",
        name: "Landmark 81",
        address: "Binh Thanh, TP. Ho Chi Minh",
        latitude: 10.795,
        longitude: 106.7218,
    },
];

const toNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number) ? number : null;
};

const normalizePlace = (place) => {
    const latitude = toNumber(place.latitude);
    const longitude = toNumber(place.longitude);

    if (latitude === null || longitude === null) {
        return null;
    }

    return {
        ...place,
        latitude,
        longitude,
    };
};

const buildOsmEmbedUrl = (place) => {
    const lat = place.latitude;
    const lng = place.longitude;
    const latDelta = 0.025;
    const lngDelta = 0.035;
    const bbox = [
        lng - lngDelta,
        lat - latDelta,
        lng + lngDelta,
        lat + latDelta,
    ].join(",");

    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
};

const buildOsmLink = (place) =>
    `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=15/${place.latitude}/${place.longitude}`;

export default function Maps() {
    const [places, setPlaces] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [keyword, setKeyword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const selectedPlace =
        places.find((place) => place.id === selectedId) || places[0];

    const mapUrl = useMemo(
        () => selectedPlace ? buildOsmEmbedUrl(selectedPlace) : "",
        [selectedPlace]
    );

    useEffect(() => {
        fetchPlaces();
    }, []);

    const fetchPlaces = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getPublicPlaces({
                keyword,
                page: 0,
                size: 50,
                sortBy: "rating",
                sortDir: "desc",
            });
            const mappedPlaces = unwrapPageContent(data)
                .map(normalizePlace)
                .filter(Boolean);

            if (mappedPlaces.length === 0) {
                setPlaces(fallbackPlaces);
                setSelectedId(fallbackPlaces[0].id);
                setError("Chua co dia diem nao co toa do, dang hien du lieu mau.");
                return;
            }

            setPlaces(mappedPlaces);
            setSelectedId(mappedPlaces[0].id);
        } catch (err) {
            setPlaces(fallbackPlaces);
            setSelectedId(fallbackPlaces[0].id);
            setError(
                err.response?.data?.message ||
                "Khong tai duoc dia diem tu server, dang hien du lieu mau."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="maps-page">
            <aside className="maps-sidebar">
                <div className="maps-title">
                    <span>
                        <MapPin size={20} />
                    </span>

                    <div>
                        <h1>Ban do dia diem</h1>
                        <p>OpenStreetMap, khong can API key.</p>
                    </div>
                </div>

                <div className="maps-search">
                    <Search size={18} />
                    <input
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                fetchPlaces();
                            }
                        }}
                        placeholder="Tim dia diem..."
                    />
                    <button
                        type="button"
                        onClick={fetchPlaces}
                    >
                        Tim
                    </button>
                </div>

                {loading && (
                    <p className="maps-status">Dang tai ban do...</p>
                )}

                {error && (
                    <p className="maps-status warning">{error}</p>
                )}

                <div className="maps-place-list">
                    {places.map((place) => (
                        <button
                            key={place.id}
                            className={
                                place.id === selectedPlace?.id
                                    ? "active"
                                    : ""
                            }
                            type="button"
                            onClick={() => setSelectedId(place.id)}
                        >
                            <strong>{place.name}</strong>
                            <span>
                                {place.address || place.city || "Chua co dia chi"}
                            </span>
                        </button>
                    ))}
                </div>
            </aside>

            <section className="map-panel">
                {selectedPlace && (
                    <>
                        <iframe
                            title={`OpenStreetMap - ${selectedPlace.name}`}
                            className="map-container"
                            src={mapUrl}
                            loading="lazy"
                        />

                        <div className="map-floating-info">
                            <div>
                                <h2>{selectedPlace.name}</h2>
                                <p>
                                    {selectedPlace.address ||
                                        selectedPlace.city ||
                                        `${selectedPlace.latitude}, ${selectedPlace.longitude}`}
                                </p>
                            </div>

                            <a
                                href={buildOsmLink(selectedPlace)}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Navigation size={16} />
                                Mo OSM
                            </a>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
