#!/usr/bin/env python3
"""WCAG 2.x contrast-ratio checker.

Usage:
    python scripts/contrast.py <foreground> <background>
    python scripts/contrast.py "#1e7a3d" "#ffffff"
    python scripts/contrast.py 1e7a3d fff

Accepts 3- or 6-digit hex, with or without '#'. Prints the contrast ratio and
which WCAG levels pass, so you can verify a color choice instead of eyeballing it.

WCAG AA: body text >= 4.5:1, large text (>=24px / >=18.66px bold) and UI components >= 3:1.
WCAG AAA: body >= 7:1, large >= 4.5:1.
"""
import sys


def parse_hex(s):
    s = s.strip().lstrip("#")
    if len(s) == 3:
        s = "".join(c * 2 for c in s)
    if len(s) != 6:
        raise ValueError(f"Invalid hex color: {s!r} (use 3 or 6 hex digits)")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def relative_luminance(rgb):
    def chan(c):
        c /= 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (chan(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(fg, bg):
    l1, l2 = sorted((relative_luminance(fg), relative_luminance(bg)), reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)


def main(argv):
    if len(argv) != 3:
        print(__doc__)
        return 2
    fg, bg = parse_hex(argv[1]), parse_hex(argv[2])
    ratio = contrast_ratio(fg, bg)
    check = lambda ok: "PASS" if ok else "FAIL"
    print(f"Contrast ratio: {ratio:.2f}:1")
    print(f"  AA  body text (>=4.5:1):        {check(ratio >= 4.5)}")
    print(f"  AA  large text / UI (>=3:1):    {check(ratio >= 3.0)}")
    print(f"  AAA body text (>=7:1):          {check(ratio >= 7.0)}")
    print(f"  AAA large text (>=4.5:1):       {check(ratio >= 4.5)}")
    if ratio < 4.5:
        print("\nThis pair FAILS AA for body text. Darken/lighten one color until it reaches 4.5:1.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
