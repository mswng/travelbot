import "./DestinationCard.scss";

function DestinationCard({
    actionLabel,
    details,
    image,
    onClick,
    subtitle,
    title,
}) {
    return (
        <button
            className="destination-card"
            type="button"
            onClick={onClick}
        >
            <img src={image} alt={title} />

            <div className="overlay">
                <div>
                    {subtitle && <span>{subtitle}</span>}
                    <h3>{title}</h3>
                    {details && <p>{details}</p>}
                    {actionLabel && <b>{actionLabel}</b>}
                </div>
            </div>
        </button>
    );
}

export default DestinationCard;
