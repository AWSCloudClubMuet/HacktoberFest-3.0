"""Icon drawings as plain data (no Tkinter needed, so they can be unit-tested)."""

# Player-bar icons, then the sidebar icons (nav_*). The nav icons are separate names so the
# sidebar "History" (a clock) does not clash with the player-bar "history" (a go-back arrow).
ICON_NAMES = ("play", "pause", "stop", "next", "previous", "forward", "rewind", "repeat", "history", "volume",
              "nav_library", "nav_playlist", "nav_artists", "nav_queue", "nav_history")


def icon_shapes(icon: str, cx: float, cy: float, u: float) -> list:
    """Describe an icon as drawing instructions around centre (cx, cy), unit size u.

    Returns a list of shapes: ("poly", points), ("line", points, arrow?), ("oval", [x0, y0, x1, y1],
    filled?). Pure data (no Tk), so it is
    easy to read and test. Icons are DRAWN, so they look the same on every computer
    (no dependence on which fonts are installed).
    """
    tri_r = lambda x, w=1.0: ("poly", [x, cy - u, x, cy + u, x + w * u, cy])          # points right
    tri_l = lambda x, w=1.0: ("poly", [x, cy - u, x, cy + u, x - w * u, cy])          # points left
    bar = lambda x0, x1: ("poly", [x0, cy - u, x1, cy - u, x1, cy + u, x0, cy + u])
    if icon == "play":
        return [tri_r(cx - 0.6 * u, 1.7)]
    if icon == "pause":
        return [bar(cx - 0.8 * u, cx - 0.2 * u), bar(cx + 0.2 * u, cx + 0.8 * u)]
    if icon == "stop":
        return [bar(cx - 0.9 * u, cx + 0.9 * u)]
    if icon == "next":
        return [tri_r(cx - 0.9 * u, 1.5), bar(cx + 0.75 * u, cx + 1.05 * u)]
    if icon == "previous":
        return [tri_l(cx + 0.9 * u, 1.5), bar(cx - 1.05 * u, cx - 0.75 * u)]
    if icon == "forward":        # skip ahead: two triangles
        return [tri_r(cx - 1.1 * u, 1.1), tri_r(cx - 0.05 * u, 1.1)]
    if icon == "rewind":         # skip back: two triangles
        return [tri_l(cx + 1.1 * u, 1.1), tri_l(cx + 0.05 * u, 1.1)]
    if icon == "repeat":         # a loop with an arrow head on top
        return [("line", [cx + u, cy - 0.1 * u, cx + u, cy + 0.6 * u, cx - u, cy + 0.6 * u,
                          cx - u, cy - 0.6 * u, cx + 0.6 * u, cy - 0.6 * u], True)]
    if icon == "history":        # "go back" arrow
        return [("line", [cx + u, cy + 0.7 * u, cx + u, cy - 0.2 * u, cx - 0.7 * u, cy - 0.2 * u], True)]
    if icon == "volume":
        return [("poly", [cx - u, cy - 0.4 * u, cx - 0.4 * u, cy - 0.4 * u, cx + 0.2 * u, cy - u,
                          cx + 0.2 * u, cy + u, cx - 0.4 * u, cy + 0.4 * u, cx - u, cy + 0.4 * u]),
                ("line", [cx + 0.6 * u, cy - 0.5 * u, cx + 0.9 * u, cy, cx + 0.6 * u, cy + 0.5 * u], False)]
    # ---- sidebar icons ---------------------------------------------------------
    if icon == "nav_library":    # three books standing on a shelf
        books = [("poly", [cx + x0 * u, cy + top * u, cx + x1 * u, cy + top * u, cx + x1 * u, cy + 0.9 * u,
                           cx + x0 * u, cy + 0.9 * u])
                 for x0, x1, top in ((-1.3, -0.65, -0.9), (-0.4, 0.25, -1.3), (0.5, 1.15, -0.6))]
        return books + [("line", [cx - 1.5 * u, cy + 1.25 * u, cx + 1.5 * u, cy + 1.25 * u], False)]
    if icon == "nav_playlist":   # a bulleted list: a dot and a line, three times
        shapes = []
        for row in (-0.9, 0, 0.9):
            shapes.append(("poly", [cx - 1.3 * u, cy + (row - 0.2) * u, cx - 0.9 * u, cy + (row - 0.2) * u,
                                    cx - 0.9 * u, cy + (row + 0.2) * u, cx - 1.3 * u, cy + (row + 0.2) * u]))
            shapes.append(("line", [cx - 0.4 * u, cy + row * u, cx + 1.3 * u, cy + row * u], False))
        return shapes
    if icon == "nav_artists":    # head and shoulders
        return [("oval", [cx - 0.5 * u, cy - 1.3 * u, cx + 0.5 * u, cy - 0.3 * u], True),
                ("poly", [cx - 1.2 * u, cy + 1.1 * u, cx - 1.0 * u, cy + 0.4 * u, cx - 0.4 * u, cy + 0.1 * u,
                          cx + 0.4 * u, cy + 0.1 * u, cx + 1.0 * u, cy + 0.4 * u, cx + 1.2 * u, cy + 1.1 * u])]
    if icon == "nav_queue":      # two list lines, then a play triangle for "next"
        return [("line", [cx - 1.3 * u, cy - 0.9 * u, cx + 1.3 * u, cy - 0.9 * u], False),
                ("line", [cx - 1.3 * u, cy - 0.2 * u, cx + 0.5 * u, cy - 0.2 * u], False),
                ("poly", [cx - 1.3 * u, cy + 0.5 * u, cx - 1.3 * u, cy + 1.3 * u, cx - 0.5 * u, cy + 0.9 * u])]
    if icon == "nav_history":    # a clock face
        return [("oval", [cx - 1.3 * u, cy - 1.3 * u, cx + 1.3 * u, cy + 1.3 * u], False),
                ("line", [cx, cy - 0.7 * u, cx, cy, cx + 0.6 * u, cy + 0.35 * u], False)]
    raise ValueError(f"unknown icon: {icon}")
