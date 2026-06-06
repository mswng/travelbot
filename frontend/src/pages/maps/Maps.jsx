import "leaflet/dist/leaflet.css";
import "./Maps.scss";

import L from "leaflet";
import {
    LocateFixed,
    MapPin,
    Navigation,
    Route,
    Search,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    MapContainer,
    Marker,
    Polyline,
    Popup,
    TileLayer,
    useMap,
} from "react-leaflet";
import { useLocation } from "react-router-dom";

import { unwrapPageContent } from "~/services/apiUtils";
import {
    getPublicPlaceById,
    getNearbyPlaces,
    getPublicPlaces,
} from "~/services/placeService";

const NEARBY_RADIUS_KM = 10;
const NEARBY_LIMIT = 50;
const CURRENT_LOCATION_ID = "current-location";

const fallbackPlaces = [
    {
        id: "fallback-1",
        name: "Nhà thờ Đức Bà",
        address: "Quận 1, TP. Hồ Chí Minh",
        latitude: 10.7798,
        longitude: 106.699,
    },
    {
        id: "fallback-2",
        name: "Landmark 81",
        address: "Bình Thạnh, TP. Hồ Chí Minh",
        latitude: 10.795,
        longitude: 106.7218,
    },
];

const currentLocationIcon = L.divIcon({
    className: "map-marker current",
    html: "<span></span>",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

const placeIcon = L.divIcon({
    className: "map-marker place",
    html: "<span></span>",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
});

const buildCurrentLocationPlace = (latitude, longitude) => ({
    id: CURRENT_LOCATION_ID,
    name: "Vị trí hiện tại của tôi",
    address: "Tọa độ lấy từ trình duyệt",
    latitude,
    longitude,
});

const toNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number) ? number : null;
};

const calculateDistanceKm = (from, to) => {
    if (!from || !to) {
        return null;
    }

    const earthRadiusKm = 6371;
    const toRadians = (degrees) => degrees * Math.PI / 180;
    const latDistance = toRadians(to.latitude - from.latitude);
    const lngDistance = toRadians(to.longitude - from.longitude);
    const fromLat = toRadians(from.latitude);
    const toLat = toRadians(to.latitude);
    const haversine =
        Math.sin(latDistance / 2) ** 2 +
        Math.cos(fromLat) *
        Math.cos(toLat) *
        Math.sin(lngDistance / 2) ** 2;
    const distance =
        2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

    return Math.round(distance * 100) / 100;
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

const withDistanceFrom = (location, places) =>
    places.map((place) => ({
        ...place,
        distanceKm: calculateDistanceKm(location, place),
    }));

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
    ].some((value) => value?.toLowerCase().includes(normalizedKeyword));
};

const formatRouteDistance = (meters) => {
    if (!Number.isFinite(meters)) {
        return "";
    }

    return `${(meters / 1000).toFixed(1)}km`;
};

const formatRouteDuration = (seconds) => {
    if (!Number.isFinite(seconds)) {
        return "";
    }

    const minutes = Math.round(seconds / 60);

    if (minutes < 60) {
        return `${minutes} phút`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes > 0
        ? `${hours} giờ ${remainingMinutes} phút`
        : `${hours} giờ`;
};

const buildOsmLink = (place) =>
    `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=15/${place.latitude}/${place.longitude}`;

const buildOsmDirectionsLink = (from, to) =>
    `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${from.latitude},${from.longitude};${to.latitude},${to.longitude}`;

function MapAutoFit({
    currentLocation,
    routePositions,
    selectedPlace,
}) {
    const map = useMap();

    useEffect(() => {
        if (routePositions.length > 0) {
            map.fitBounds(routePositions, {
                padding: [44, 44],
                maxZoom: 16,
            });
            return;
        }

        if (selectedPlace) {
            map.setView(
                [selectedPlace.latitude, selectedPlace.longitude],
                selectedPlace.id === CURRENT_LOCATION_ID ? 15 : 16
            );
            return;
        }

        if (currentLocation) {
            map.setView(
                [currentLocation.latitude, currentLocation.longitude],
                15
            );
        }
    }, [currentLocation, map, routePositions, selectedPlace]);

    return null;
}

export default function Maps() {
    const navigationLocation = useLocation();
    const selectedPlaceFromNavigation = navigationLocation.state?.selectedPlace;
    const currentLocationFromNavigation = navigationLocation.state?.currentLocation;
    const searchParams = useMemo(
        () => new URLSearchParams(navigationLocation.search),
        [navigationLocation.search]
    );
    const initialKeyword = searchParams.get("keyword") || "";
    const initialCity = searchParams.get("city") || "";
    const initialType = searchParams.get("type") || "";
    const initialPlaceId = searchParams.get("placeId") || "";
    const [places, setPlaces] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [keyword, setKeyword] = useState(initialKeyword);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const [routeError, setRouteError] = useState("");
    const [loading, setLoading] = useState(false);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState("");
    const [locationError, setLocationError] = useState("");

    const selectedPlace =
        places.find((place) => place.id === selectedId) || places[0];

    const mapCenter = useMemo(() => {
        const place = selectedPlace || currentLocation || fallbackPlaces[0];

        return [place.latitude, place.longitude];
    }, [currentLocation, selectedPlace]);

    const routePositions = routeInfo?.positions || [];

    useEffect(() => {
        if (initialPlaceId) {
            fetchPlaceById(initialPlaceId);
            return;
        }

        if (initialKeyword || initialCity || initialType || initialPlaceId) {
            fetchPlaces(initialKeyword, {
                city: initialCity,
                placeType: initialType,
                selectedPlaceId: initialPlaceId,
            });
            return;
        }

        if (currentLocationFromNavigation) {
            setCurrentLocation(currentLocationFromNavigation);
            fetchNearbyPlaces(currentLocationFromNavigation);
            return;
        }

        handleUseCurrentLocation(true);
    }, []);

    const fetchPlaceById = async (placeId) => {
        try {
            setLoading(true);
            setError("");

            const data = await getPublicPlaceById(placeId);
            const place = normalizePlace(data);

            if (!place) {
                fetchPlaces();
                return;
            }

            setPlaces([place]);
            setSelectedId(place.id);
            handleUseCurrentLocation(false, false);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không thể tải địa điểm được chọn."
            );
            fetchPlaces();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const shouldLoadRoute =
            currentLocation &&
            selectedPlace &&
            selectedPlace.id !== CURRENT_LOCATION_ID;

        if (!shouldLoadRoute) {
            setRouteInfo(null);
            setRouteError("");
            setRouteLoading(false);
            return;
        }

        const controller = new AbortController();

        fetchRoute(currentLocation, selectedPlace, controller.signal);

        return () => controller.abort();
    }, [currentLocation, selectedPlace]);

    const fetchPlaces = async (searchKeyword = keyword, filters = {}) => {
        try {
            setLoading(true);
            setError("");

            const data = await getPublicPlaces({
                keyword: searchKeyword,
                city: filters.city,
                placeType: filters.placeType,
                page: 0,
                size: 50,
                sortBy: "rating",
                sortDir: "desc",
            });
            const mappedPlacesWithoutDistance = unwrapPageContent(data)
                .map(normalizePlace)
                .filter(Boolean);
            const mappedPlaces = currentLocation
                ? withDistanceFrom(currentLocation, mappedPlacesWithoutDistance)
                    .sort((a, b) => a.distanceKm - b.distanceKm)
                : mappedPlacesWithoutDistance;

            if (mappedPlaces.length === 0) {
                setPlaces(fallbackPlaces);
                setSelectedId(fallbackPlaces[0].id);
                setError("Chưa có địa điểm nào có tọa độ, đang hiển thị dữ liệu mẫu.");
                return;
            }

            const requestedPlaceId = filters.selectedPlaceId
                ? Number(filters.selectedPlaceId)
                : null;
            const hasRequestedPlace = mappedPlaces.some((place) => place.id === requestedPlaceId);

            setPlaces(mappedPlaces);
            setSelectedId(hasRequestedPlace ? requestedPlaceId : mappedPlaces[0].id);
        } catch (err) {
            setPlaces(fallbackPlaces);
            setSelectedId(fallbackPlaces[0].id);
            setError(
                err.response?.data?.message ||
                "Chưa thể tải được địa điểm từ server, đang hiển thị dữ liệu mẫu."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchNearbyPlaces = async (location, searchKeyword = keyword) => {
        const currentPlace = buildCurrentLocationPlace(
            location.latitude,
            location.longitude
        );

        try {
            setLoading(true);
            setError("");

            const data = await getNearbyPlaces({
                latitude: location.latitude,
                longitude: location.longitude,
                radiusKm: NEARBY_RADIUS_KM,
                limit: NEARBY_LIMIT,
            });
            const nearbyPlaces = data
                .map(normalizePlace)
                .filter(Boolean)
                .filter((place) => matchesKeyword(place, searchKeyword));
            const navigationPlace = normalizePlace(selectedPlaceFromNavigation || {});
            const nextPlaces =
                navigationPlace &&
                !nearbyPlaces.some((place) => place.id === navigationPlace.id)
                    ? [navigationPlace, ...nearbyPlaces]
                    : nearbyPlaces;

            setPlaces([currentPlace, ...nextPlaces]);
            setSelectedId(navigationPlace?.id || currentPlace.id);

            if (nextPlaces.length === 0) {
                setError(`Không tìm thấy địa điểm nào trong bán kính ${NEARBY_RADIUS_KM}km.`);
            }
        } catch (err) {
            setPlaces([currentPlace]);
            setSelectedId(currentPlace.id);
            setError(
                err.response?.data?.message ||
                "Chưa thể tải địa điểm gần bạn từ server."
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchRoute = async (from, to, signal) => {
        try {
            setRouteLoading(true);
            setRouteError("");

            const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
                { signal }
            );

            if (!response.ok) {
                throw new Error("OSRM route request failed");
            }

            const data = await response.json();
            const route = data.routes?.[0];

            if (!route) {
                throw new Error("Route not found");
            }

            setRouteInfo({
                distance: route.distance,
                duration: route.duration,
                positions: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
            });
        } catch (err) {
            if (err.name !== "AbortError") {
                setRouteInfo(null);
                setRouteError("Chưa thể tải tuyến đường tới địa điểm này.");
            }
        } finally {
            if (!signal.aborted) {
                setRouteLoading(false);
            }
        }
    };

    const handleUseCurrentLocation = (fallbackOnError = false, loadNearby = true) => {
        setLocationError("");

        if (!("geolocation" in navigator)) {
            setLocationError("Trình duyệt không hỗ trợ lấy vị trí hiện tại.");

            if (fallbackOnError) {
                fetchPlaces();
            }

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
                if (loadNearby) {
                    fetchNearbyPlaces(location);
                }
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

                setLocationError(
                    messages[geoError.code] ||
                    "Không lấy được vị trí hiện tại."
                );
                setLocating(false);

                if (fallbackOnError) {
                    fetchPlaces();
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 60000,
                timeout: 10000,
            }
        );
    };

    const handleSearch = () => {
        const searchKeyword = keyword.trim();

        if (!searchKeyword && currentLocation) {
            fetchNearbyPlaces(currentLocation, "");
            return;
        }

        fetchPlaces(searchKeyword);
    };

    return (
        <div className="maps-page">
            <aside className="maps-sidebar">
                <div className="maps-title">
                    <span>
                        <MapPin size={20} />
                    </span>

                    <div>
                        <h1>Bản đồ địa điểm</h1>
                        <p>Gợi ý địa điểm trong bán kính {NEARBY_RADIUS_KM}km.</p>
                    </div>
                </div>

                <div className="maps-search">
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
                        Tìm
                    </button>
                </div>

                <button
                    className="maps-location-btn"
                    type="button"
                    onClick={() => handleUseCurrentLocation()}
                    disabled={locating}
                >
                    <LocateFixed size={18} />
                    {locating ? "Đang lấy vị trí..." : "Dùng vị trí hiện tại"}
                </button>

                {loading && (
                    <p className="maps-status">Đang tải địa điểm gần bạn...</p>
                )}

                {routeLoading && (
                    <p className="maps-status">Đang tải tuyến đường...</p>
                )}

                {error && (
                    <p className="maps-status warning">{error}</p>
                )}

                {locationError && (
                    <p className="maps-status warning">{locationError}</p>
                )}

                {routeError && (
                    <p className="maps-status warning">{routeError}</p>
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
                                {place.distanceKm !== undefined && place.distanceKm !== null
                                    ? `${place.distanceKm}km - `
                                    : ""}
                                {place.address || place.city || "Chưa có địa chỉ"}
                            </span>
                        </button>
                    ))}
                </div>
            </aside>

            <section className="map-panel">
                {selectedPlace && (
                    <>
                        <MapContainer
                            center={mapCenter}
                            className="map-container"
                            zoom={15}
                            scrollWheelZoom
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {currentLocation && (
                                <Marker
                                    icon={currentLocationIcon}
                                    position={[
                                        currentLocation.latitude,
                                        currentLocation.longitude,
                                    ]}
                                >
                                    <Popup>Vị trí hiện tại của tôi</Popup>
                                </Marker>
                            )}

                            {places
                                .filter((place) => place.id !== CURRENT_LOCATION_ID)
                                .map((place) => (
                                    <Marker
                                        key={place.id}
                                        icon={placeIcon}
                                        position={[place.latitude, place.longitude]}
                                    >
                                        <Popup>{place.name}</Popup>
                                    </Marker>
                                ))}

                            {routePositions.length > 0 && (
                                <Polyline
                                    pathOptions={{
                                        color: "#2563eb",
                                        opacity: 0.9,
                                        weight: 6,
                                    }}
                                    positions={routePositions}
                                />
                            )}

                            <MapAutoFit
                                currentLocation={currentLocation}
                                routePositions={routePositions}
                                selectedPlace={selectedPlace}
                            />
                        </MapContainer>

                        <div className="map-floating-info">
                            <div>
                                <h2>{selectedPlace.name}</h2>
                                <p>
                                    {routeInfo
                                        ? `${formatRouteDistance(routeInfo.distance)} - ${formatRouteDuration(routeInfo.duration)} đi ô tô - `
                                        : selectedPlace.distanceKm !== undefined && selectedPlace.distanceKm !== null
                                            ? `${selectedPlace.distanceKm}km từ vị trí của bạn - `
                                            : ""}
                                    {selectedPlace.address ||
                                        selectedPlace.city ||
                                        `${selectedPlace.latitude}, ${selectedPlace.longitude}`}
                                </p>
                            </div>

                            <div className="map-actions">
                                {currentLocation && selectedPlace.id !== CURRENT_LOCATION_ID && (
                                    <a
                                        href={buildOsmDirectionsLink(currentLocation, selectedPlace)}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <Route size={16} />
                                        Chỉ đường
                                    </a>
                                )}

                                <a
                                    href={buildOsmLink(selectedPlace)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Navigation size={16} />
                                    Mở OSM
                                </a>
                            </div>
                        </div>
                    </>
                )}

                {!selectedPlace && (
                    <div className="map-empty-state">
                        <MapPin size={32} />
                        <p>Chưa có địa điểm có tọa độ để hiển thị bản đồ.</p>
                    </div>
                )}
            </section>
        </div>
    );
}
