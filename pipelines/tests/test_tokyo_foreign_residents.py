from pathlib import Path
import unittest

from pipelines.sources.tokyo_foreign_residents import decode_csv, parse_ward_demographics, render_sql

FIXTURE = Path(__file__).parent / "fixtures" / "ga26ev0100_sample.csv"


class TokyoForeignResidentsTest(unittest.TestCase):
    def test_parses_special_wards_and_total_column(self) -> None:
        records = parse_ward_demographics(FIXTURE.read_text(encoding="utf-8"))
        self.assertEqual([record.ward_id for record in records], ["shinjuku", "shibuya"])
        self.assertEqual(records[0].foreign_residents, 47123)

    def test_decodes_cp932(self) -> None:
        text = "新宿区,12345\n"
        self.assertEqual(decode_csv(text.encode("cp932")), text)

    def test_renders_idempotent_d1_sql(self) -> None:
        records = parse_ward_demographics(FIXTURE.read_text(encoding="utf-8"))
        sql = render_sql(records, "2026-07-17T00:00:00+00:00")
        self.assertIn("ON CONFLICT(ward_id) DO UPDATE", sql)
        self.assertIn("'shinjuku', 47123", sql)


if __name__ == "__main__":
    unittest.main()
