import "./Nearby.scss";

const places = [
    {
        name: "The Coffee House",
        distance: "0.4 km",
        rating: "4.8",
        image:
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
    },
    {
        name: "Landmark 81",
        distance: "1.2 km",
        rating: "4.9",
        image:
            "https://images.unsplash.com/photo-1494526585095-c41746248156",
    },
];

export default function Nearby() {

    return (
        <div className="nearby-page">

            <h1>Nearby Places</h1>

            <div className="nearby-grid">

                {places.map((place, index) => (
                    <div
                        className="nearby-card"
                        key={index}
                    >

                        <img
                            src={place.image}
                            alt={place.name}
                        />

                        <div className="nearby-content">

                            <h3>{place.name}</h3>

                            <p>
                                ⭐ {place.rating}
                            </p>

                            <span>
                                {place.distance}
                            </span>

                        </div>

                    </div>
                ))}

            </div>

        </div>
    );
}