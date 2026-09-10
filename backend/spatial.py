"""
BhoomiSetu Spatial Intersection & Geodesy Analysis Engine
Pure Python spatial computations for land-use, forest, green belt, and restricted zone detection.
Zero external C-dependency (standalone fallback for PostGIS in local and evaluation environments).
"""

import math
from typing import List, Tuple, Optional, Dict, Any

EARTH_RADIUS_METERS = 6378137.0

def degrees_to_radians(deg: float) -> float:
    return deg * math.pi / 180.0

def calculate_ring_area_sqm(ring: List[List[float]]) -> float:
    """
    Computes geodesic surface area of a polygon ring on the WGS84 sphere in square meters.
    Ring format: [[lng, lat], [lng, lat], ...]
    """
    if len(ring) < 3:
        return 0.0

    total_area = 0.0
    num_points = len(ring)

    for i in range(num_points):
        p1 = ring[i]
        p2 = ring[(i + 1) % num_points]

        lon1 = degrees_to_radians(p1[0])
        lat1 = degrees_to_radians(p1[1])
        lon2 = degrees_to_radians(p2[0])
        lat2 = degrees_to_radians(p2[1])

        # Spherical excess trapezoidal strip formula
        total_area += (lon2 - lon1) * (2.0 + math.sin(lat1) + math.sin(lat2))

    total_area = abs(total_area * (EARTH_RADIUS_METERS ** 2) / 4.0)
    return total_area

def calculate_polygon_area_ha(geometry: Dict[str, Any]) -> float:
    """
    Calculates total area of a GeoJSON Polygon or MultiPolygon in Hectares (1 Ha = 10,000 sq.m).
    """
    geom_type = geometry.get("type", "")
    coords = geometry.get("coordinates", [])
    total_sqm = 0.0

    if geom_type == "Polygon":
        # Outer ring minus any inner rings (holes)
        if len(coords) > 0:
            outer_area = calculate_ring_area_sqm(coords[0])
            inner_area = sum(calculate_ring_area_sqm(hole) for hole in coords[1:])
            total_sqm += max(0.0, outer_area - inner_area)

    elif geom_type == "MultiPolygon":
        for poly in coords:
            if len(poly) > 0:
                outer_area = calculate_ring_area_sqm(poly[0])
                inner_area = sum(calculate_ring_area_sqm(hole) for hole in poly[1:])
                total_sqm += max(0.0, outer_area - inner_area)

    return round(total_sqm / 10000.0, 4)

def get_bbox(coords_list: List[List[float]]) -> List[float]:
    """Returns [min_lng, min_lat, max_lng, max_lat]"""
    min_lng = min(p[0] for p in coords_list)
    max_lng = max(p[0] for p in coords_list)
    min_lat = min(p[1] for p in coords_list)
    max_lat = max(p[1] for p in coords_list)
    return [min_lng, min_lat, max_lng, max_lat]

def bboxes_overlap(bbox1: List[float], bbox2: List[float]) -> bool:
    """True if bounding boxes overlap with an optional epsilon"""
    return not (
        bbox1[2] < bbox2[0] or # bbox1 max_lng < bbox2 min_lng
        bbox1[0] > bbox2[2] or # bbox1 min_lng > bbox2 max_lng
        bbox1[3] < bbox2[1] or # bbox1 max_lat < bbox2 min_lat
        bbox1[1] > bbox2[3]    # bbox1 min_lat > bbox2 max_lat
    )

# --- Sutherland-Hodgman Polygon Clipping for 2D Polygon Intersection ---

def ensure_ccw(ring: List[List[float]]) -> List[List[float]]:
    """Ensures polygon ring has unique vertices (not closed) and is oriented Counter-Clockwise (CCW)."""
    clean = ring[:]
    if len(clean) > 1 and clean[0][0] == clean[-1][0] and clean[0][1] == clean[-1][1]:
        clean = clean[:-1]
    if len(clean) < 3:
        return clean

    # Compute signed 2D area
    signed_area = 0.0
    n = len(clean)
    for i in range(n):
        p1 = clean[i]
        p2 = clean[(i + 1) % n]
        signed_area += (p2[0] - p1[0]) * (p2[1] + p1[1])
    # In screen coordinates, if signed_area > 0 it's clockwise -> reverse to make CCW
    if signed_area > 0:
        clean = clean[::-1]
    return clean

def is_inside_ccw(p: List[float], cp1: List[float], cp2: List[float]) -> bool:
    # Cross product (cp2 - cp1) x (p - cp1) >= 0 (left of line)
    return ((cp2[0] - cp1[0]) * (p[1] - cp1[1]) - (cp2[1] - cp1[1]) * (p[0] - cp1[0])) >= -1e-9

def compute_intersection(cp1: List[float], cp2: List[float], s: List[float], e: List[float]) -> List[float]:
    dc = [cp1[0] - cp2[0], cp1[1] - cp2[1]]
    dp = [s[0] - e[0], s[1] - e[1]]
    n1 = cp1[0] * cp2[1] - cp1[1] * cp2[0]
    n2 = s[0] * e[1] - s[1] * e[0]
    denom = dc[0] * dp[1] - dc[1] * dp[0]
    if abs(denom) < 1e-12:
        return [s[0], s[1]]
    x = (n1 * dp[0] - n2 * dc[0]) / denom
    y = (n1 * dp[1] - n2 * dc[1]) / denom
    return [round(x, 7), round(y, 7)]

def clip_polygon(subject_polygon: List[List[float]], clip_polygon: List[List[float]]) -> List[List[float]]:
    subj = ensure_ccw(subject_polygon)
    clipper = ensure_ccw(clip_polygon)
    if len(subj) < 3 or len(clipper) < 3:
        return []

    output_list = subj[:]
    cp1 = clipper[-1]
    for cp2 in clipper:
        input_list = output_list[:]
        output_list = []
        if not input_list:
            break
        s = input_list[-1]
        for e in input_list:
            if is_inside_ccw(e, cp1, cp2):
                if not is_inside_ccw(s, cp1, cp2):
                    output_list.append(compute_intersection(cp1, cp2, s, e))
                output_list.append(e)
            elif is_inside_ccw(s, cp1, cp2):
                output_list.append(compute_intersection(cp1, cp2, s, e))
            s = e
        cp1 = cp2
    return output_list

def extract_rings(geom: Dict[str, Any]) -> List[List[List[float]]]:
    """Flattens Polygon or MultiPolygon into a list of outer polygon coordinate rings."""
    g_type = geom.get("type", "")
    coords = geom.get("coordinates", [])
    rings = []

    if g_type == "Polygon":
        if len(coords) > 0:
            rings.append(coords[0])
    elif g_type == "MultiPolygon":
        for poly in coords:
            if len(poly) > 0:
                rings.append(poly[0])
    return rings

def evaluate_spatial_intersection(
    project_geom: Dict[str, Any],
    zone_geom: Dict[str, Any]
) -> Tuple[bool, float, float, Optional[Dict[str, Any]]]:
    """
    Computes spatial intersection between project alignment/boundary and a zone layer.
    Returns:
    (intersects: bool, intersection_area_ha: float, percentage_affected: float, intersection_geojson: Optional[dict])
    """
    proj_rings = extract_rings(project_geom)
    zone_rings = extract_rings(zone_geom)

    total_proj_area = calculate_polygon_area_ha(project_geom)
    if total_proj_area <= 0.0:
        total_proj_area = 1.0

    intersecting_polys = []
    total_intersect_area_ha = 0.0

    for p_ring in proj_rings:
        p_bbox = get_bbox(p_ring)
        for z_ring in zone_rings:
            z_bbox = get_bbox(z_ring)
            if not bboxes_overlap(p_bbox, z_bbox):
                continue

            # Attempt clipping in both orientations to handle polygon vertex orders
            clipped = clip_polygon(p_ring, z_ring)
            if not clipped or len(clipped) < 3:
                clipped = clip_polygon(z_ring, p_ring)

            if clipped and len(clipped) >= 3:
                # Close the polygon ring if open
                if clipped[0] != clipped[-1]:
                    clipped.append(clipped[0])
                area = calculate_ring_area_sqm(clipped) / 10000.0
                if area > 0.01: # Filter micro-slivers < 100 sqm
                    intersecting_polys.append([clipped])
                    total_intersect_area_ha += area

    intersects = (total_intersect_area_ha > 0.02)
    total_intersect_area_ha = round(total_intersect_area_ha, 2)
    pct_affected = round(min(100.0, (total_intersect_area_ha / total_proj_area) * 100.0), 1)

    intersect_geojson = None
    if intersects and intersecting_polys:
        intersect_geojson = {
            "type": "MultiPolygon",
            "coordinates": intersecting_polys
        }

    return intersects, total_intersect_area_ha, pct_affected, intersect_geojson

def determine_risk_level(zone_type: str, area_ha: float, review_status: str = "PENDING") -> str:
    """
    Assigns risk level based on environmental and statutory severity:
    - CRITICAL: Protected Areas, National Parks, Ramsar Wetlands
    - HIGH: Forest Land > 5 ha, Eco-Sensitive Zones
    - MODERATE: Green Belt, Forest Land <= 5 ha, Water Body / River line
    - LOW: Agricultural, Residential, or Cleared
    """
    if review_status in ["CLEARED", "NOT_APPLICABLE"]:
        return "LOW"

    zt = zone_type.upper()
    if zt in ["ECO_SENSITIVE", "PROTECTED_AREA", "RAMSAR_WETLAND"]:
        return "CRITICAL" if area_ha > 0 else "LOW"
    if zt == "FOREST":
        return "HIGH" if area_ha > 3.0 else "MODERATE"
    if zt in ["GREEN_BELT", "WETLAND", "WATER_BODY"]:
        return "MODERATE" if area_ha > 0 else "LOW"
    if zt in ["RESIDENTIAL", "INDUSTRIAL"]:
        return "MODERATE" if area_ha > 10.0 else "LOW"
    return "LOW"

def get_overall_project_risk(intersections: List[Dict[str, Any]]) -> str:
    """Returns composite project risk: CRITICAL > HIGH > MODERATE > LOW"""
    if any(i.get("risk_level") == "CRITICAL" and i.get("review_status") != "CLEARED" for i in intersections):
        return "CRITICAL"
    if any(i.get("risk_level") == "HIGH" and i.get("review_status") != "CLEARED" for i in intersections):
        return "HIGH"
    if any(i.get("risk_level") == "MODERATE" and i.get("review_status") != "CLEARED" for i in intersections):
        return "MODERATE"
    return "LOW"
