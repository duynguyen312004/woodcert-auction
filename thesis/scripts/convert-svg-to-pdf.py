from pathlib import Path
import sys

from reportlab.graphics import renderPDF
from svglib.svglib import svg2rlg


def convert(svg_path: Path) -> None:
    drawing = svg2rlg(str(svg_path))
    if drawing is None:
        raise RuntimeError(f"Unable to parse SVG: {svg_path}")

    pdf_path = svg_path.with_suffix(".pdf")
    renderPDF.drawToFile(drawing, str(pdf_path))
    if not pdf_path.exists() or pdf_path.stat().st_size == 0:
        raise RuntimeError(f"PDF was not created: {pdf_path}")


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: convert-svg-to-pdf.py <svg> [<svg> ...]", file=sys.stderr)
        return 2

    for argument in sys.argv[1:]:
        convert(Path(argument).resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
