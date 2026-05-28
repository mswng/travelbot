import "./StatsCard.scss";

export default function StatsCard({
    icon,
    title,
    value,
}) {

    return (
        <div className="stats-card">

            <div className="stats-icon">
                {icon}
            </div>

            <div>

                <h2>{value}</h2>

                <p>{title}</p>

            </div>

        </div>
    );
}