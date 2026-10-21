import unittest
from ui.icons import ICON_NAMES, icon_shapes


class IconTests(unittest.TestCase):
    def test_every_icon_draws_inside_its_box(self):
        cx = cy = 20.0; u = 5.0
        for name in ICON_NAMES:
            shapes = icon_shapes(name, cx, cy, u)
            self.assertTrue(shapes, name)
            for shape in shapes:
                points = shape[1]
                self.assertEqual(len(points) % 2, 0, name)
                if shape[0] == "poly":
                    self.assertGreaterEqual(len(points), 6, name)
                for index, value in enumerate(points):
                    self.assertLessEqual(abs(value - (cx if index % 2 == 0 else cy)), 1.8 * u, name)

    def test_sidebar_has_an_icon_for_each_view(self):
        for name in ("nav_library", "nav_playlist", "nav_artists", "nav_queue", "nav_history"):
            self.assertIn(name, ICON_NAMES)

    def test_unknown_icon(self):
        with self.assertRaises(ValueError): icon_shapes("nope", 0, 0, 1)


if __name__ == "__main__":
    unittest.main()
