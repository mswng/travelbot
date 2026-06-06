import "./CategoryTabs.scss";

import {
    Bed,
    Camera,
    MapPin,
    Sparkles,
    Trees,
    Utensils,
} from "lucide-react";

const fallbackCategories = [
    {
        placeType: "attraction",
        totalPlaces: 0,
    },
    {
        placeType: "hotel",
        totalPlaces: 0,
    },
    {
        placeType: "restaurant",
        totalPlaces: 0,
    },
];

const normalizeText = (value = "") =>
    String(value)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[_-]+/g, " ");

const getCategoryKey = (type = "") => {
    const normalized = normalizeText(type);

    if (!normalized) return "";
    if (
        normalized.includes("hotel") ||
        normalized.includes("khach") ||
        normalized.includes("homestay") ||
        normalized.includes("resort") ||
        normalized.includes("accommodation")
    ) return "hotel";
    if (
        normalized.includes("restaurant") ||
        normalized.includes("food") ||
        normalized.includes("an uong") ||
        normalized.includes("quan an") ||
        normalized.includes("nha hang") ||
        normalized.includes("cafe") ||
        normalized.includes("ca phe")
    ) return "food";
    if (
        normalized.includes("park") ||
        normalized.includes("cong vien")
    ) return "park";
    if (
        normalized.includes("tour") ||
        normalized.includes("tham quan") ||
        normalized.includes("attraction") ||
        normalized.includes("museum") ||
        normalized.includes("bao tang") ||
        normalized.includes("temple") ||
        normalized.includes("chua")
    ) return "attraction";

    return normalized;
};

const getCategoryLabel = (type = "") => {
    const key = getCategoryKey(type);

    if (!key) return "Tổng hợp";
    if (key === "hotel") return "Khách sạn";
    if (key === "food") return "Ăn uống";
    if (key === "park") return "Công viên";
    if (key === "attraction") return "Tham quan";

    return String(type)
        .replace(/[_-]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getCategoryIcon = (type = "") => {
    const key = getCategoryKey(type);

    if (!key) return Sparkles;
    if (key === "hotel") return Bed;
    if (key === "food") return Utensils;
    if (key === "park") return Trees;
    if (key === "attraction") return Camera;

    return MapPin;
};

const groupCategories = (categories = []) => {
    const grouped = new Map();

    categories.forEach((category) => {
        const key = getCategoryKey(category.placeType);
        const current = grouped.get(key) || {
            key,
            totalPlaces: 0,
            types: [],
        };

        current.totalPlaces += Number(category.totalPlaces || 0);
        current.types.push(category.placeType);
        grouped.set(key, current);
    });

    return Array.from(grouped.values())
        .filter((category) => category.key)
        .sort((a, b) => b.totalPlaces - a.totalPlaces);
};

export {
    getCategoryLabel,
};

export default function CategoryTabs({
    activeCategory = "",
    categories = [],
    onSelect,
}) {
    const sourceCategories = categories.length > 0
        ? categories
        : fallbackCategories;
    const tabs = [
        {
            key: "",
            totalPlaces: 0,
            types: [],
        },
        ...groupCategories(sourceCategories),
    ];

    return (
        <div className="category-tabs">
            {tabs.map((category) => {
                const Icon = getCategoryIcon(category.key);

                return (
                    <button
                        key={category.key || "all"}
                        className={category.key === activeCategory ? "active" : ""}
                        type="button"
                        onClick={() => onSelect?.(category)}
                    >
                        <Icon size={20} />
                        <span>{getCategoryLabel(category.key)}</span>
                        {category.totalPlaces > 0 && (
                            <small>{category.totalPlaces}</small>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
