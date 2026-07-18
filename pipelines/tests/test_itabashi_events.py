from pathlib import Path
import unittest

from pipelines.sources.itabashi_events import decode_csv, parse_csv, to_d1_sql

FIXTURE = Path(__file__).parent / "fixtures" / "itabashi_events_sample.csv"


class ItabashiEventsTest(unittest.TestCase):
    def test_only_multicultural_rows_are_published(self) -> None:
        resources = parse_csv(FIXTURE.read_text(encoding="utf-8"), "2026-02-10")
        self.assertEqual(len(resources), 1)
        self.assertEqual(resources[0].kind, "japanese_class")
        self.assertEqual(resources[0].wardId, "itabashi")

    def test_dates_and_coordinates_are_normalized(self) -> None:
        resource = parse_csv(FIXTURE.read_text(encoding="utf-8"), "2026-02-10")[0]
        self.assertEqual(resource.startAt, "2026-08-03T09:00:00+09:00")
        self.assertEqual(resource.latitude, 35.7509)
        self.assertEqual(resource.costType, "free")

    def test_sql_is_idempotent_and_attributed(self) -> None:
        resources = parse_csv(FIXTURE.read_text(encoding="utf-8"), "2026-02-10")
        sql = to_d1_sql(resources, "2026-07-18")
        self.assertIn("ON CONFLICT(id) DO UPDATE", sql)
        self.assertIn("https://example.org/japanese", sql)
        self.assertNotIn("BEGIN", sql)
        self.assertNotIn("COMMIT", sql)

    def test_cp932_and_stable_order_are_supported(self) -> None:
        self.assertEqual(decode_csv("板橋区".encode("cp932")), "板橋区")
        fixture = FIXTURE.read_text(encoding="utf-8")
        self.assertEqual(parse_csv(fixture, "2026-02-10"), parse_csv("\n".join(fixture.splitlines()[0:1] + fixture.splitlines()[1:][::-1]), "2026-02-10"))


if __name__ == "__main__":
    unittest.main()
