import "./Home.scss";

import {
    useEffect,
    useState,
} from "react";

import Hero from "~/components/home/Hero/Hero.jsx";
import CategoryTabs from "~/components/home/CategoryTabs/CategoryTabs.jsx";
import DestinationSection from "~/components/home/DestinationSection/DestinationSection.jsx";
import {
    getPageMeta,
    unwrapPageContent,
} from "~/services/apiUtils";
import {
    getHomeData,
    getPublicPlaces,
} from "~/services/placeService";

const normalizePlaceType = (type = "") => {
    const normalized = String(type)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    if (
        normalized.includes("hotel") ||
        normalized.includes("khach") ||
        normalized.includes("homestay") ||
        normalized.includes("resort")
    ) return "hotel";
    if (
        normalized.includes("restaurant") ||
        normalized.includes("food") ||
        normalized.includes("nha hang") ||
        normalized.includes("quan an") ||
        normalized.includes("cafe")
    ) return "food";
    if (
        normalized.includes("park") ||
        normalized.includes("cong vien")
    ) return "park";
    if (
        normalized.includes("attraction") ||
        normalized.includes("tour") ||
        normalized.includes("tham quan") ||
        normalized.includes("museum") ||
        normalized.includes("temple") ||
        normalized.includes("chua")
    ) return "attraction";

    return normalized || "other";
};

const getPlaceScore = (place) => {
    const rating = Number(place.rating || 0);
    const reviewCount = Number(place.reviewCount || place.totalReviews || place.reviewsCount || 0);

    return (
        rating * 20 +
        Math.min(reviewCount, 500) / 50 +
        (place.primaryPhotoUrl || place.photoUrls?.length ? 8 : 0) +
        (place.address ? 5 : 0) +
        (place.priceRange ? 3 : 0)
    );
};

const buildRecommendedPlaces = (places = []) => {
    const byId = new Map();

    places.forEach((place) => {
        if (place?.id) {
            byId.set(place.id, place);
        }
    });

    const sorted = Array.from(byId.values())
        .sort((a, b) => getPlaceScore(b) - getPlaceScore(a));
    const selected = [];
    const typeCounts = new Map();

    sorted.forEach((place) => {
        if (selected.length >= 10) return;

        const type = normalizePlaceType(place.placeType);
        const count = typeCounts.get(type) || 0;

        if (count < 3) {
            selected.push(place);
            typeCounts.set(type, count + 1);
        }
    });

    sorted.forEach((place) => {
        if (selected.length >= 10) return;
        if (!selected.some((item) => item.id === place.id)) {
            selected.push(place);
        }
    });

    return selected;
};

export default function Home() {
    const [activeCategory, setActiveCategory] = useState("");
    const [activeCategoryTypes, setActiveCategoryTypes] = useState([]);
    const [categoryPage, setCategoryPage] = useState(1);
    const [categoryMeta, setCategoryMeta] = useState({
        totalPages: 1,
    });
    const [categoryPlaces, setCategoryPlaces] = useState([]);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [homeData, setHomeData] = useState({
        categories: [],
        hotelsByCity: [],
        popularCities: [],
        restaurantsByCity: [],
        topRecommendedPlaces: [],
        topRatedPlaces: [],
    });

    useEffect(() => {
        fetchHomeData();
    }, []);

    useEffect(() => {
        fetchCategoryPlaces();
    }, [activeCategory, activeCategoryTypes, categoryPage]);

    const fetchHomeData = async () => {
        try {
            const data = await getHomeData();
            let recommendedPlaces = buildRecommendedPlaces(data.topRatedPlaces || []);

            try {
                const recommendedData = await getPublicPlaces({
                    page: 0,
                    size: 60,
                    sortBy: "rating",
                    sortDir: "desc",
                });

                recommendedPlaces = buildRecommendedPlaces(unwrapPageContent(recommendedData));
            } catch {
                recommendedPlaces = buildRecommendedPlaces(data.topRatedPlaces || []);
            }

            setHomeData({
                categories: data.categories || [],
                hotelsByCity: data.hotelsByCity || [],
                popularCities: data.popularCities || [],
                restaurantsByCity: data.restaurantsByCity || [],
                topRecommendedPlaces: recommendedPlaces,
                topRatedPlaces: data.topRatedPlaces || [],
            });
        } catch {
            setHomeData({
                categories: [],
                hotelsByCity: [],
                popularCities: [],
                restaurantsByCity: [],
                topRecommendedPlaces: [],
                topRatedPlaces: [],
            });
        }
    };

    const fetchCategoryPlaces = async () => {
        if (!activeCategory) {
            setCategoryPlaces([]);
            setCategoryMeta({ totalPages: 1 });
            return;
        }

        try {
            setCategoryLoading(true);
            const types = activeCategoryTypes.length > 0
                ? activeCategoryTypes
                : [activeCategory];
            const responses = await Promise.all(types.map((type) =>
                getPublicPlaces({
                    placeType: type,
                    page: categoryPage - 1,
                    size: 16,
                    sortBy: "rating",
                    sortDir: "desc",
                })
            ));
            const byId = new Map();

            responses.forEach((data) => {
                unwrapPageContent(data).forEach((place) => {
                    byId.set(place.id, place);
                });
            });

            setCategoryPlaces(Array.from(byId.values()).slice(0, 8));
            setCategoryMeta({
                totalPages: Math.max(
                    1,
                    ...responses.map((data) => getPageMeta(data).totalPages)
                ),
            });
        } catch {
            setCategoryPlaces([]);
            setCategoryMeta({ totalPages: 1 });
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleSelectCategory = (category) => {
        setActiveCategory(category.key);
        setActiveCategoryTypes(category.types || []);
        setCategoryPage(1);
    };

    return (
        <div className="home">
            <Hero />

            <CategoryTabs
                activeCategory={activeCategory}
                categories={homeData.categories}
                onSelect={handleSelectCategory}
            />

            <DestinationSection
                activeCategory={activeCategory}
                categoryLoading={categoryLoading}
                categoryPage={categoryPage}
                categoryPlaces={categoryPlaces}
                categoryTotalPages={categoryMeta.totalPages}
                onCategoryPageChange={setCategoryPage}
                popularCities={homeData.popularCities}
                topRecommendedPlaces={homeData.topRecommendedPlaces}
            />
        </div>
    );
}
