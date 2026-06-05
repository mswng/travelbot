import "./PlaceCard.scss";

import {
    Pencil,
    Trash2,
    MapPinned,
    Clock3,
    Ticket,
} from "lucide-react";

export default function PlaceCard({
    place,
    onDelete,
    onEdit,
}) {
    const image =
        place.image ||
        place.primaryPhotoUrl ||
        place.photoUrls?.[0] ||
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200";

    const title =
        place.title ||
        place.name;

    const location =
        place.location ||
        place.address ||
        place.city ||
        place.country ||
        "Chưa có địa chỉ";

    const openTime =
        place.openTime ||
        place.openingHours ||
        "Chưa cập nhật";

    const price =
        place.price ||
        place.priceRange ||
        (place.priceLevel ? `${place.priceLevel} sao giá` : "Chưa cập nhật");

    const mapUrl =
        place.map ||
        (place.latitude && place.longitude
            ? `https://www.google.com/maps?q=${place.latitude},${place.longitude}`
            : place.website);

    return (

        <div className="place-card">

            {/* IMAGE */}

            <img
                src={image}
                alt={title}
            />

            {/* CONTENT */}

            <div className="place-content">

                <h3>
                    {title}
                </h3>

                <p className="location">

                    <MapPinned size={16} />

                    {location}

                </p>

                <p>

                    <Clock3 size={16} />

                    {openTime}

                </p>

                <p>

                    <Ticket size={16} />

                    {price}

                </p>

                <div className="desc">

                    {place.description || "Chưa có mô tả"}

                </div>

                {/* ACTIONS */}

                <div className="place-actions">

                    <a
                        href={mapUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Xem bản đồ
                    </a>

                    <div>

                        <button
                            onClick={() => onEdit(place)}
                        >

                            <Pencil size={16} />

                        </button>

                        <button
                            className="delete-btn"
                            onClick={() =>
                                onDelete(place.id)
                            }
                        >

                            <Trash2 size={16} />

                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}
