import "./Hero.scss";

import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Hero() {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState("");

    const handleSearch = () => {
        const query = keyword.trim();

        navigate(query ? `/maps?keyword=${encodeURIComponent(query)}` : "/maps");
    };

    return (
        <section className="hero">
            <h1>Bạn muốn đi đâu?</h1>

            <p className="hero-desc">
                Mỗi hành trình là một câu chuyện. Bắt đầu chuyến đi của bạn với những địa điểm và trải nghiệm đáng nhớ.
            </p>

            <div className="search-box">
                <Search size={22} />

                <input
                    type="text"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            handleSearch();
                        }
                    }}
                    placeholder="Địa điểm tham quan, khách sạn, quán ăn..."
                />

                <button
                    className="search-btn"
                    type="button"
                    onClick={handleSearch}
                >
                    Tìm kiếm
                </button>
            </div>
        </section>
    );
}
