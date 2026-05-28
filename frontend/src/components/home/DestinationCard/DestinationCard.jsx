import "./DestinationCard.scss";

function DestinationCard({ image, title }) {
    return (
        <div className="destination-card">
            <img src={image} alt={title} />

            <div className="overlay">
                <h3>{title}</h3>
            </div>
        </div>
    );
}

export default DestinationCard;