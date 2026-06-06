import "./DestinationSection.scss";

import {
    useEffect,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";

import Pagination from "~/components/pagination/pagination.jsx";
import {
    getPageMeta,
    unwrapPageContent,
} from "~/services/apiUtils";
import { getPublicPlaces } from "~/services/placeService";

import { getCategoryLabel } from "../CategoryTabs/CategoryTabs.jsx";
import DestinationCard from "../DestinationCard/DestinationCard.jsx";

const ITEMS_PER_PAGE = 8;
const fallbackImage =
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200";

const cityNameMap = {
    "ba ria vung tau": "Bà Rịa - Vũng Tàu",
    "can tho": "Cần Thơ",
    "da lat": "Đà Lạt",
    "da nang": "Đà Nẵng",
    danang: "Đà Nẵng",
    "ha long": "Hạ Long",
    "ha noi": "Hà Nội",
    hanoi: "Hà Nội",
    "hai phong": "Hải Phòng",
    "ho chi minh": "TP. Hồ Chí Minh",
    "ho chi minh city": "TP. Hồ Chí Minh",
    hcm: "TP. Hồ Chí Minh",
    hue: "Huế",
    "nha trang": "Nha Trang",
    "phu quoc": "Phú Quốc",
    "quy nhon": "Quy Nhơn",
    "sa pa": "Sa Pa",
    sapa: "Sa Pa",
    "vung tau": "Vũng Tàu",
};

const normalizeText = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[_-]+/g, " ");

const formatCityName = (city = "") => {
    const raw = String(city || "").trim();
    const normalized = normalizeText(raw);

    if (!raw) return "Chưa rõ thành phố";
    if (cityNameMap[normalized]) return cityNameMap[normalized];

    return raw
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getPlaceImage = (place) =>
    place.primaryPhotoUrl ||
    place.photoUrls?.[0] ||
    fallbackImage;

const getPlaceDetails = (place) =>
    [
        place.priceRange,
        place.rating ? `${place.rating} sao` : "",
        place.address || formatCityName(place.city),
    ].filter(Boolean).join(" • ");

function PlaceCards({
    places = [],
}) {
    const navigate = useNavigate();

    if (places.length === 0) {
        return <p className="home-status">Chưa có địa điểm phù hợp.</p>;
    }

    return (
        <div className="destination-grid">
            {places.map((place) => (
                <DestinationCard
                    key={place.id}
                    actionLabel="Xem bản đồ"
                    details={getPlaceDetails(place)}
                    image={getPlaceImage(place)}
                    subtitle={getCategoryLabel(place.placeType || "")}
                    title={place.name}
                    onClick={() => navigate(`/maps?placeId=${place.id}`)}
                />
            ))}
        </div>
    );
}

function DestinationSection({
    activeCategory = "",
    categoryLoading = false,
    categoryPage = 1,
    categoryPlaces = [],
    categoryTotalPages = 1,
    onCategoryPageChange,
    popularCities = [],
    topRecommendedPlaces = [],
}) {
    const [cityLoading, setCityLoading] = useState(false);
    const [cityPage, setCityPage] = useState(1);
    const [cityPlaces, setCityPlaces] = useState([]);
    const [cityTotalPages, setCityTotalPages] = useState(1);
    const [selectedCity, setSelectedCity] = useState(null);

    useEffect(() => {
        setSelectedCity(null);
    }, [activeCategory]);

    useEffect(() => {
        const fetchCityPlaces = async () => {
            if (!selectedCity) {
                setCityPlaces([]);
                setCityTotalPages(1);
                return;
            }

            try {
                setCityLoading(true);
                const data = await getPublicPlaces({
                    city: selectedCity,
                    page: cityPage - 1,
                    size: ITEMS_PER_PAGE,
                    sortBy: "rating",
                    sortDir: "desc",
                });

                setCityPlaces(unwrapPageContent(data));
                setCityTotalPages(Math.max(1, getPageMeta(data).totalPages));
            } catch {
                setCityPlaces([]);
                setCityTotalPages(1);
            } finally {
                setCityLoading(false);
            }
        };

        fetchCityPlaces();
    }, [cityPage, selectedCity]);

    const handleSelectCity = (city) => {
        setSelectedCity(city);
        setCityPage(1);
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    if (selectedCity) {
        return (
            <section className="destination-section">
                <div className="section-top">
                    <div>
                        <h2>{formatCityName(selectedCity)}</h2>
                        <p>Danh sách địa điểm trong thành phố để bạn xem nhanh trước khi mở bản đồ.</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSelectedCity(null)}
                    >
                        Quay lại
                    </button>
                </div>

                {cityLoading ? (
                    <p className="home-status">Đang tải địa điểm...</p>
                ) : (
                    <>
                        <PlaceCards places={cityPlaces} />
                        <Pagination
                            currentPage={cityPage}
                            totalPages={cityTotalPages}
                            onPageChange={setCityPage}
                        />
                    </>
                )}
            </section>
        );
    }

    if (activeCategory) {
        return (
            <section className="destination-section">
                <div className="section-top">
                    <div>
                        <h2>{getCategoryLabel(activeCategory)}</h2>
                        <p>Danh sách địa điểm thuộc nhóm này từ dữ liệu của bạn.</p>
                    </div>
                </div>

                {categoryLoading ? (
                    <p className="home-status">Đang tải địa điểm...</p>
                ) : (
                    <>
                        <PlaceCards places={categoryPlaces} />
                        <Pagination
                            currentPage={categoryPage}
                            totalPages={categoryTotalPages}
                            onPageChange={onCategoryPageChange}
                        />
                    </>
                )}
            </section>
        );
    }

    return (
        <section className="destination-section">
            <div className="section-top">
                <div>
                    <h2>Thành phố nổi bật</h2>
                    <p>Những điểm đến có nhiều địa điểm trong dữ liệu của bạn.</p>
                </div>
            </div>

            <div className="destination-grid">
                {popularCities.map((city) => (
                    <DestinationCard
                        key={city.city}
                        actionLabel="Xem thêm"
                        image={
                            city.featuredPlace?.primaryPhotoUrl ||
                            city.featuredPlace?.photoUrls?.[0] ||
                            fallbackImage
                        }
                        subtitle={`${city.totalPlaces || 0} địa điểm`}
                        title={formatCityName(city.city)}
                        onClick={() => handleSelectCity(city.city)}
                    />
                ))}
            </div>

            <div className="section-top">
                <div>
                    <h2>Top 10 nơi đáng đi</h2>
                    <p>Gợi ý dựa trên rating, mức độ đầy đủ thông tin và sự đa dạng loại địa điểm.</p>
                </div>
            </div>

            <PlaceCards places={topRecommendedPlaces} />
        </section>
    );
}

export default DestinationSection;
