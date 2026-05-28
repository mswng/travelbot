import "./Home.scss";

import Hero from "~/components/home/Hero/Hero.jsx";
import CategoryTabs from "~/components/home/CategoryTabs/CategoryTabs.jsx";
import DestinationSection from "~/components/home/DestinationSection/DestinationSection.jsx";

export default function Home() {
    return (
        <div className="home">
            <Hero />

            <CategoryTabs />

            <DestinationSection />
        </div>
    );
}