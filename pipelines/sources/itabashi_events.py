"""Normalize Itabashi's CC BY 4.0 event CSV into Metropolis resources."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import urllib.request
from dataclasses import asdict, dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Iterable

SOURCE_ID = "itabashi_events_2026_01"
SOURCE_URL = "https://www.city.itabashi.tokyo.jp/_res/projects/default_project/_page_/001/010/229/20260210.csv"
LANDING_PAGE = "https://www.city.itabashi.tokyo.jp/1000779/1010229.html"
MULTICULTURAL_TERMS = (
    "国際",
    "外国",
    "多文化",
    "日本語",
    "交流",
    "international",
    "multicultural",
    "japanese",
)


@dataclass(frozen=True)
class Resource:
    id: str
    kind: str
    name: str
    description: str
    latitude: float
    longitude: float
    wardId: str
    languages: list[str]
    audiences: list[str]
    accessibilityTags: list[str]
    startAt: str | None
    endAt: str | None
    costType: str
    sourceUrl: str
    sourceUpdatedAt: str


def decode_csv(payload: bytes) -> str:
    for encoding in ("utf-8-sig", "cp932"):
        try:
            return payload.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise ValueError("CSV is neither UTF-8 nor CP932")


def parse_date(value: str) -> str | None:
    value = value.strip()
    if not value:
        return None
    for pattern in ("%Y-%m-%d", "%Y/%m/%d", "%Y%m%d"):
        try:
            return datetime.strptime(value, pattern).date().isoformat()
        except ValueError:
            continue
    return None


def combine_datetime(day: str, clock: str) -> str | None:
    parsed_day = parse_date(day)
    if not parsed_day:
        return None
    normalized_clock = clock.strip().replace("：", ":")
    if not normalized_clock:
        return f"{parsed_day}T00:00:00+09:00"
    try:
        parsed_clock = datetime.strptime(normalized_clock, "%H:%M").time()
    except ValueError:
        return f"{parsed_day}T00:00:00+09:00"
    return f"{parsed_day}T{parsed_clock.isoformat()}+09:00"


def classify_kind(text: str) -> str:
    lowered = text.lower()
    if "日本語" in text or "japanese" in lowered:
        return "japanese_class"
    if "相談" in text or "consultation" in lowered:
        return "consultation"
    return "cultural_event"


def cost_type(value: str) -> str:
    normalized = value.strip().lower()
    if any(token in normalized for token in ("無料", "不要", "free")):
        return "free"
    if normalized:
        return "paid"
    return "unknown"


def is_multicultural(row: dict[str, str]) -> bool:
    haystack = " ".join(str(value) for value in row.values()).lower()
    return any(term.lower() in haystack for term in MULTICULTURAL_TERMS)


def stable_id(row: dict[str, str]) -> str:
    material = "|".join(
        row.get(key, "") for key in ("NO", "イベント名", "開始日", "場所名称", "住所")
    )
    return f"itabashi-event-{hashlib.sha256(material.encode('utf-8')).hexdigest()[:16]}"


def normalize_rows(rows: Iterable[dict[str, str]], source_updated_at: str) -> list[Resource]:
    resources: list[Resource] = []
    for row in rows:
        if not is_multicultural(row):
            continue
        try:
            latitude = float(row.get("緯度", "").strip())
            longitude = float(row.get("経度", "").strip())
        except ValueError:
            continue
        if not (35 <= latitude <= 36 and 139 <= longitude <= 140):
            continue

        name = row.get("イベント名", "").strip()
        if not name:
            continue
        description = row.get("説明", "").strip() or row.get("備考", "").strip()
        full_text = f"{name} {description}"
        resources.append(
            Resource(
                id=stable_id(row),
                kind=classify_kind(full_text),
                name=name,
                description=description,
                latitude=latitude,
                longitude=longitude,
                wardId="itabashi",
                languages=["ja"],
                audiences=[value.strip() for value in row.get("対象者", "").split("、") if value.strip()],
                accessibilityTags=[],
                startAt=combine_datetime(row.get("開始日", ""), row.get("開始時間", "")),
                endAt=combine_datetime(row.get("終了日", ""), row.get("終了時間", "")),
                costType=cost_type(row.get("料金(基本)", "")),
                sourceUrl=row.get("URL", "").strip() or LANDING_PAGE,
                sourceUpdatedAt=source_updated_at,
            )
        )
    return resources


def parse_csv(text: str, source_updated_at: str) -> list[Resource]:
    return normalize_rows(csv.DictReader(text.splitlines()), source_updated_at)


def sql_quote(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def to_d1_sql(resources: Iterable[Resource], ingested_at: str) -> str:
    statements = ["BEGIN;"]
    for resource in resources:
        statements.append(
            "INSERT INTO resources (id, kind, name, description, latitude, longitude, ward_id, "
            "languages_json, audiences_json, accessibility_tags_json, start_at, end_at, cost_type, "
            "source_url, source_updated_at, ingested_at) VALUES ("
            + ", ".join(
                [
                    sql_quote(resource.id),
                    sql_quote(resource.kind),
                    sql_quote(resource.name),
                    sql_quote(resource.description),
                    str(resource.latitude),
                    str(resource.longitude),
                    sql_quote(resource.wardId),
                    sql_quote(json.dumps(resource.languages, ensure_ascii=False)),
                    sql_quote(json.dumps(resource.audiences, ensure_ascii=False)),
                    sql_quote(json.dumps(resource.accessibilityTags, ensure_ascii=False)),
                    sql_quote(resource.startAt),
                    sql_quote(resource.endAt),
                    sql_quote(resource.costType),
                    sql_quote(resource.sourceUrl),
                    sql_quote(resource.sourceUpdatedAt),
                    sql_quote(ingested_at),
                ]
            )
            + ") ON CONFLICT(id) DO UPDATE SET "
            "kind=excluded.kind, name=excluded.name, description=excluded.description, "
            "latitude=excluded.latitude, longitude=excluded.longitude, ward_id=excluded.ward_id, "
            "languages_json=excluded.languages_json, audiences_json=excluded.audiences_json, "
            "accessibility_tags_json=excluded.accessibility_tags_json, start_at=excluded.start_at, "
            "end_at=excluded.end_at, cost_type=excluded.cost_type, source_url=excluded.source_url, "
            "source_updated_at=excluded.source_updated_at, ingested_at=excluded.ingested_at;"
        )
    statements.append("COMMIT;")
    return "\n".join(statements) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path)
    parser.add_argument("--output-json", type=Path, required=True)
    parser.add_argument("--output-sql", type=Path, required=True)
    parser.add_argument("--source-updated-at", default="2026-02-10")
    args = parser.parse_args()

    payload = args.input.read_bytes() if args.input else urllib.request.urlopen(SOURCE_URL, timeout=30).read()
    resources = parse_csv(decode_csv(payload), args.source_updated_at)
    args.output_json.write_text(
        json.dumps([asdict(resource) for resource in resources], ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    args.output_sql.write_text(to_d1_sql(resources, date.today().isoformat()), encoding="utf-8")


if __name__ == "__main__":
    main()
