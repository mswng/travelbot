import "./CategoryTabs.scss";
import {
    Bed,
    Camera,
    Utensils,
} from "lucide-react";

export default function CategoryTabs() {
    return (
        <div className="category-tabs">

            <button className="active">
                <Camera size={20} />
                Chỗ tham quan
            </button>

            <button>
                <Bed size={20} />
                Khách sạn
            </button>

            <button>
                <Utensils size={20} />
                Ăn uống
            </button>

        </div>
    );
}

