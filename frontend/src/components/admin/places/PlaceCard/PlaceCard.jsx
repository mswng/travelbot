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

    return (

        <div className="place-card">

            {/* IMAGE */}

            <img
                src={place.image}
                alt={place.title}
            />

            {/* CONTENT */}

            <div className="place-content">

                <h3>
                    {place.title}
                </h3>

                <p className="location">

                    <MapPinned size={16} />

                    {place.location}

                </p>

                <p>

                    <Clock3 size={16} />

                    {place.openTime}

                </p>

                <p>

                    <Ticket size={16} />

                    {place.price}

                </p>

                <div className="desc">

                    {place.description}

                </div>

                {/* ACTIONS */}

                <div className="place-actions">

                    <a
                        href={place.map}
                        target="_blank"
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