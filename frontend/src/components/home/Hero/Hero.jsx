import "./Hero.scss";
import { Search } from "lucide-react";


export default function Hero() {
    return (
        <section className="hero">
            <h1>
                Bạn muốn đi đâu?
            </h1>

            <p className="hero-desc">
               Mỗi hành trình là một câu chuyện — hãy bắt đầu chuyến đi của bạn với những địa điểm tuyệt đẹp và trải nghiệm đáng nhớ nhất.
            </p>

            <div className="search-box">
                <Search size={22} />

                <input
                    type="text"
                    placeholder="Địa đểm tham quan, khách sạn, quán ăn,..."
                />

                <button className="search-btn">
                    Tìm kiếm
                </button>
            </div>
        </section>
    );
}
