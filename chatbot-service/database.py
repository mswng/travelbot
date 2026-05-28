from sqlalchemy import create_engine, text
from config import DATABASE_URL
from typing import List, Dict

# =========================
# DATABASE ENGINE
# =========================
engine = create_engine(DATABASE_URL)


# =========================
# GET ALL PLACES
# =========================
def get_all_places() -> List[Dict]:
    """
    Lấy toàn bộ địa điểm từ MySQL
    để đưa vào vector store.
    """

    query = text("""
        SELECT 
            p.id,
            p.place_id,
            p.name,
            p.address,
            p.city,
            p.country,
            p.description,
            p.place_type,
            p.price_range,
            p.price_level,
            p.rating,
            p.total_ratings,
            p.opening_hours,
            p.phone,
            p.website,

            SUBSTRING_INDEX(
                GROUP_CONCAT(ph.photo_url ORDER BY ph.id),
                ',',
                1
            ) AS photo_url

        FROM places p

        LEFT JOIN photos ph
            ON ph.place_id = p.place_id

        GROUP BY
            p.id,
            p.place_id,
            p.name,
            p.address,
            p.city,
            p.country,
            p.description,
            p.place_type,
            p.price_range,
            p.price_level,
            p.rating,
            p.total_ratings,
            p.opening_hours,
            p.phone,
            p.website

        ORDER BY p.rating DESC
    """)

    with engine.connect() as conn:
        rows = conn.execute(query).mappings().all()
        return [dict(row) for row in rows]


# =========================
# SEARCH PLACE BY KEYWORD
# =========================
def search_places_by_keyword(
    keyword: str,
    city: str = None,
    place_type: str = None,
    limit: int = 10
) -> List[Dict]:

    """
    Full-text search trực tiếp từ MySQL
    """

    conditions = [
        """
        (
            LOWER(p.name) LIKE :kw
            OR LOWER(p.description) LIKE :kw
            OR LOWER(p.address) LIKE :kw
        )
        """
    ]

    params = {
        "kw": f"%{keyword.lower()}%",
        "limit": limit
    }

    # =========================
    # FILTER CITY
    # =========================
    if city:
        conditions.append("LOWER(p.city) = :city")
        params["city"] = city.lower()

    # =========================
    # FILTER PLACE TYPE
    # =========================
    if place_type:
        conditions.append("LOWER(p.place_type) LIKE :place_type")
        params["place_type"] = f"%{place_type.lower()}%"

    where_clause = " AND ".join(conditions)

    query = text(f"""
        SELECT
            p.id,
            p.place_id,
            p.name,
            p.address,
            p.city,
            p.place_type,
            p.rating,
            p.price_range,
            p.opening_hours,
            p.phone,
            p.description,

            SUBSTRING_INDEX(
                GROUP_CONCAT(ph.photo_url ORDER BY ph.id),
                ',',
                1
            ) AS photo_url

        FROM places p

        LEFT JOIN photos ph
            ON ph.place_id = p.place_id

        WHERE {where_clause}

        GROUP BY
            p.id,
            p.place_id,
            p.name,
            p.address,
            p.city,
            p.place_type,
            p.rating,
            p.price_range,
            p.opening_hours,
            p.phone,
            p.description

        ORDER BY p.rating DESC

        LIMIT :limit
    """)

    with engine.connect() as conn:
        rows = conn.execute(query, params).mappings().all()
        return [dict(row) for row in rows]
