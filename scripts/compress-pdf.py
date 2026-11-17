"""Compress PDF images without rasterizing text or vectors. Never modify input."""
import sys
from pathlib import Path

import pymupdf


def main():
    if len(sys.argv) != 3:
        print("Usage: compress-pdf.py <input.pdf> <output.pdf>", file=sys.stderr)
        return 2
    source, output = map(Path, sys.argv[1:])
    if source.resolve() == output.resolve() or output.exists():
        print("Output must be a new file distinct from input.", file=sys.stderr)
        return 2
    try:
        with pymupdf.open(source) as doc:
            pages = doc.page_count
            if pages == 0 or doc.needs_pass:
                raise ValueError("Empty or encrypted PDF")
            doc.rewrite_images(dpi_threshold=200, dpi_target=150, quality=75)
            doc.save(output, garbage=4, deflate=True, clean=True)
        with pymupdf.open(output) as check:
            if check.page_count != pages:
                raise ValueError("PDF page count changed")
        return 0
    except Exception as exc:
        output.unlink(missing_ok=True)
        print(f"PDF compression failed: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
