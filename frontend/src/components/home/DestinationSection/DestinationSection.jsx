import "./DestinationSection.scss";
import DestinationCard from "../DestinationCard/DestinationCard.jsx";

const places = [
    {
        title: "Bali",
        image:
            "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?q=80&w=1200",
    },
    {
        title: "Paris",
        image:
            "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200",
    },
    {
        title: "Maldives",
        image:
            "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?q=80&w=1200",
    },
    {
        title: "Tokyo",
        image:
            "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200",
    },
];

function DestinationSection() {
    return (
        <section className="destination-section">
            <div className="section-top">
                <div>
                    <h2>Explore the world</h2>
                    <p>
                        Travelers’ choice destinations for your next adventure
                    </p>
                </div>

                <button>View all</button>
            </div>

            <div className="destination-grid">
                {places.map((place, index) => (
                    <DestinationCard
                        key={index}
                        image={place.image}
                        title={place.title}
                    />
                ))}
            </div>



                        <div className="section-top">
                <div>
                    <h2>Explore the world</h2>
                    <p>
                        Travelers’ choice destinations for your next adventure
                    </p>
                </div>

                <button>View all</button>
            </div>

            <div className="destination-grid">
                {places.map((place, index) => (
                    <DestinationCard
                        key={index}
                        image={place.image}
                        title={place.title}
                    />
                ))}
            </div>
        </section>

    );
}

export default DestinationSection;