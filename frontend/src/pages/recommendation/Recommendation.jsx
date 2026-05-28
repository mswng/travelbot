import "./Recommendation.scss";

import RecommendationCard from "~/components/recommendation/RecommendationCard.jsx";

const recommendations = [
    {
        image:
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",

        title: "Bali Adventure",

        description:
            "Thiên đường biển xanh với những resort cực chill.",
    },

    {
        image:
            "https://images.unsplash.com/photo-1512453979798-5ea266f8880c",

        title: "Tokyo Experience",

        description:
            "Khám phá văn hóa Nhật Bản hiện đại và truyền thống.",
    },

    {
        image:
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb",

        title: "Swiss Alps",

        description:
            "Khung cảnh núi tuyết đẹp như phim điện ảnh.",
    },
];

export default function Recommendations() {

    return (
        <div className="recommend-page">

            <h1>
                AI Travel Recommendations
            </h1>

            <div className="recommend-grid">

                {recommendations.map(
                    (item, index) => (
                        <RecommendationCard
                            key={index}
                            image={item.image}
                            title={item.title}
                            description={item.description}
                        />
                    )
                )}

            </div>

        </div>
    );
}