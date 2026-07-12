#!/usr/bin/env python3
import json
import subprocess
import tempfile
import unittest
from pathlib import Path


CLASSIFIER = (
    Path(__file__).resolve().parents[1] / "scripts" / "classify_visualization_publish.py"
)
PAGE = Path("site/src/routes/visualizations/2026-07-15/Index.tsx")


class PublishClassifierTest(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.repo = Path(self.tempdir.name)
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)
        subprocess.run(["git", "-C", str(self.repo), "config", "user.name", "Test"], check=True)
        subprocess.run(
            ["git", "-C", str(self.repo), "config", "user.email", "test@example.com"],
            check=True,
        )
        self.write(PAGE, '<details className="space-y-2">\n  <summary>Methods</summary>\n</details>\n')
        self.write(Path("site/src/App.tsx"), "export const app = true\n")
        self.write(Path("site/src/data/result.json"), '{"rate": 0.15}\n')
        subprocess.run(["git", "-C", str(self.repo), "add", "."], check=True)
        subprocess.run(["git", "-C", str(self.repo), "commit", "-q", "-m", "base"], check=True)

    def tearDown(self):
        self.tempdir.cleanup()

    def write(self, path: Path, content: str):
        target = self.repo / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")

    def classify(self, slug="2026-07-15", *extra):
        return subprocess.run(
            [
                str(CLASSIFIER),
                "--repo",
                str(self.repo),
                "--base",
                "HEAD",
                "--slug",
                slug,
                "--json",
                *extra,
            ],
            capture_output=True,
            text=True,
        )

    def lane(self):
        result = self.classify()
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def test_open_attribute_only_is_polish(self):
        self.write(PAGE, '<details open className="space-y-2">\n  <summary>Methods</summary>\n</details>\n')
        self.assertEqual(self.lane()["lane"], "polish")

    def test_page_local_class_change_is_polish(self):
        self.write(PAGE, '<details className="space-y-4">\n  <summary>Methods</summary>\n</details>\n')
        self.assertEqual(self.lane()["lane"], "polish")

    def test_class_expression_requires_review(self):
        self.write(PAGE, '<details className={getClass(rawResults)}>\n  <summary>Methods</summary>\n</details>\n')
        self.assertEqual(self.lane()["lane"], "reviewed")

    def test_aria_expression_requires_review(self):
        self.write(PAGE, '<details aria-label={rate}>\n  <summary>Methods</summary>\n</details>\n')
        self.assertEqual(self.lane()["lane"], "reviewed")

    def test_style_url_requires_review(self):
        self.write(
            PAGE,
            '<details style={{backgroundImage:"url(https://example.com/pixel)"}}>\n'
            '  <summary>Methods</summary>\n</details>\n',
        )
        self.assertEqual(self.lane()["lane"], "reviewed")

    def test_tailwind_generated_content_requires_review(self):
        self.write(
            PAGE,
            '<span className="before:content-[\'0.3%\']">\n'
            '  <summary>Methods</summary>\n</span>\n',
        )
        self.assertEqual(self.lane()["lane"], "reviewed")

    def test_tailwind_external_url_requires_review(self):
        self.write(
            PAGE,
            '<div className="bg-[url(https://example.com/pixel)]">\n'
            '  <summary>Methods</summary>\n</div>\n',
        )
        self.assertEqual(self.lane()["lane"], "reviewed")

    def test_prose_change_requires_review(self):
        self.write(PAGE, '<details className="space-y-2">\n  <summary>Exact methods</summary>\n</details>\n')
        self.assertEqual(self.lane()["lane"], "reviewed")

    def test_link_change_requires_review(self):
        self.write(PAGE, '<a href="https://example.com">Inspect</a>\n')
        self.assertEqual(self.lane()["lane"], "reviewed")

    def test_page_number_change_requires_review(self):
        self.write(PAGE, '<details className="space-y-2">\n  <summary>15.0%</summary>\n</details>\n')
        self.assertEqual(self.lane()["lane"], "reviewed")

    def test_data_change_requires_review(self):
        self.write(Path("site/src/data/result.json"), '{"rate": 0.18}\n')
        result = self.lane()
        self.assertEqual(result["lane"], "reviewed")
        self.assertTrue(any("non-page-local" in reason for reason in result["reasons"]))

    def test_shared_route_change_requires_review(self):
        self.write(Path("site/src/App.tsx"), "export const app = false\n")
        self.assertEqual(self.lane()["lane"], "reviewed")

    def test_new_file_requires_review(self):
        self.write(Path("site/src/routes/visualizations/2026-07-15/New.tsx"), "<div />\n")
        self.assertEqual(self.lane()["lane"], "reviewed")

    def test_deleted_file_requires_review(self):
        (self.repo / PAGE).unlink()
        self.assertEqual(self.lane()["lane"], "reviewed")

    def test_mode_only_change_requires_review(self):
        (self.repo / PAGE).chmod(0o755)
        self.assertEqual(self.lane()["lane"], "reviewed")

    def test_other_slug_requires_review(self):
        self.write(PAGE, '<details open className="space-y-2">\n  <summary>Methods</summary>\n</details>\n')
        self.assertEqual(self.classify(slug="2026-07-08").returncode, 0)
        result = json.loads(self.classify(slug="2026-07-08").stdout)
        self.assertEqual(result["lane"], "reviewed")

    def test_content_that_resembles_diff_header_requires_review(self):
        self.write(PAGE, "++count;\n")
        self.assertEqual(self.lane()["lane"], "reviewed")

    def test_require_polish_blocks_reviewed_lane(self):
        self.write(PAGE, '<details className="space-y-2">\n  <summary>Changed</summary>\n</details>\n')
        result = self.classify("2026-07-15", "--require-polish")
        self.assertEqual(result.returncode, 3)
        self.assertIn("BLOCK", result.stderr)

    def test_no_changes_blocks(self):
        result = self.classify()
        self.assertEqual(result.returncode, 2)
        self.assertIn("BLOCK", result.stderr)


if __name__ == "__main__":
    unittest.main()
