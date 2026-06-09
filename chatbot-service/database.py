from sqlalchemy import create_engine, text
from config import DATABASE_URL
from typing import List, Dict

engine = create_engine(DATABASE_URL)

VIETNAM_FILTER = """
    (
        LOWER(COALESCE(p.country, '')) IN ('vietnam', 'viet nam', 'việt nam')
        OR (
            p.latitude BETWEEN 8.0 AND 23.8
            AND p.longitude BETWEEN 102.0 AND 110.5
        )
        OR LOWER(COALESCE(p.address, '')) LIKE '%vietnam%'
        OR LOWER(COALESCE(p.address, '')) LIKE '%viet nam%'
        OR LOWER(COALESCE(p.address, '')) LIKE '%việt nam%'
    )
    AND p.name IS NOT NULL
    AND p.name <> ''
    AND p.city IS NOT NULL
    AND p.city <> ''
    AND LOWER(CONCAT_WS(' ', p.name, p.address, p.city, p.country)) NOT REGEXP
        'bali|bangkok|chiang mai|indonesia|japan|korea|kyoto|malaysia|osaka|paris|seoul|singapore|taipei|thailand|tokyo'
"""


def get_all_places() -> List[Dict]:
    """
    Load clean Vietnam places from MySQL for FAISS indexing.
    """
    query = text(f"""
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
        WHERE {VIETNAM_FILTER}
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
        ORDER BY p.rating DESC, p.total_ratings DESC
    """)

    with engine.connect() as conn:
        rows = conn.execute(query).mappings().all()
        return [dict(row) for row in rows]


def search_places_by_keyword(
    keyword: str,
    city: str = None,
    place_type: str = None,
    limit: int = 10
) -> List[Dict]:
    """
    Keyword search directly from MySQL, restricted to clean Vietnam places.
    """
    conditions = [
        VIETNAM_FILTER,
        """
        (
            LOWER(p.name) LIKE :kw
            OR LOWER(p.description) LIKE :kw
            OR LOWER(p.address) LIKE :kw
            OR LOWER(p.city) LIKE :kw
            OR LOWER(p.place_type) LIKE :kw
        )
        """
    ]
    params = {
        "kw": f"%{keyword.lower()}%",
        "limit": limit,
    }

    if city:
        conditions.append("""
            (
                LOWER(p.city) = :city
                OR LOWER(p.city) LIKE :city_like
                OR LOWER(p.address) LIKE :city_like
            )
        """)
        params["city"] = city.lower()
        params["city_like"] = f"%{city.lower()}%"

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
        ORDER BY p.rating DESC, p.total_ratings DESC
        LIMIT :limit
    """)

    with engine.connect() as conn:
        rows = conn.execute(query, params).mappings().all()
        return [dict(row) for row in rows]
