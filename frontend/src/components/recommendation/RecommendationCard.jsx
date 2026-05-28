import "./RecommendationCard.scss";

export default function RecommendationCard({
    image,
    title,
    description,
}) {

    return (
        <div className="recommend-card">

            <img
                src={image}
                alt={title}
            />

            <div className="recommend-info">

                <h3>{title}</h3>

                <p>{description}</p>

                <button>
                    Explore
                </button>

            </div>

        </div>
    );
}