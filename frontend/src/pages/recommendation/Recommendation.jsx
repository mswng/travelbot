import "./Recommendation.scss";

import {
    useEffect,
    useState,
} from "react";

import RecommendationCard from "~/components/recommendation/RecommendationCard.jsx";
import { getTopRatedPlaces } from "~/services/placeService";

export default function Recommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getTopRatedPlaces(6);
            setRecommendations(data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Khong tai duoc goi y dia diem"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="recommend-page">
            <h1>Goi y dia diem noi bat</h1>

            {loading && <p>Dang tai goi y...</p>}
            {error && <p>{error}</p>}

            <div className="recommend-grid">
                {recommendations.map((item) => (
                    <RecommendationCard
                        key={item.id}
                        image={
                            item.primaryPhotoUrl ||
                            item.photoUrls?.[0] ||
                            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
                        }
                        title={item.name}
                        description={
                            item.description ||
                            `${item.city || ""} ${item.rating ? `- ${item.rating} sao` : ""}`
                        }
                    />
                ))}
            </div>
        </div>
    );
}
