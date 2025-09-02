"""Utility to list slide layout names in the first .pptx file found in the template folder.
Run:  python layout_helper.py
"""
from pptx import Presentation
from pptx.enum.shapes import PP_PLACEHOLDER_TYPE as PPT
from pathlib import Path
import sys
import json

TEMPLATE_DIR = Path(__file__).resolve().parent
DEFAULTS = [
    "Title Slide",
    "Title and Content",
    "Section Header",
    "Two Content",
    "Comparison",
    "Title Only",
    "Blank",
    "Content with Caption",
    "Picture with Caption",
]

def main() -> None:
    try:
        template_path = next(f for f in TEMPLATE_DIR.glob("*.pptx"))
    except StopIteration:
        print("No .pptx template found in", TEMPLATE_DIR)
        sys.exit(1)

    prs = Presentation(str(template_path))
    print(f"Layouts in {template_path.name} (index | name | title? | body?)")
    for idx, layout in enumerate(prs.slide_layouts):
        has_title = any(ph.placeholder_format.type in (PPT.TITLE, PPT.CENTER_TITLE, PPT.SUBTITLE) for ph in layout.placeholders)
        has_body = any(ph.placeholder_format.type == PPT.BODY for ph in layout.placeholders)
        plh_types = ", ".join({PPT(ph.placeholder_format.type).name for ph in layout.placeholders})
        print(f" {idx:2}: {layout.name} | title={has_title} | body={has_body} | placeholders: {plh_types}")

    # Load existing mapping if available
    map_path = TEMPLATE_DIR / "layout_map.json"
    existing_mapping = {}
    if map_path.exists():
        try:
            existing_mapping = json.loads(map_path.read_text(encoding="utf-8"))
            print("\nLoaded existing mapping from", map_path)
        except Exception as e:
            print("Warning: could not read existing mapping:", e)

    # Build initial mapping using existing or auto match
    mapping = {}
    for d in DEFAULTS:
        mapping[d] = existing_mapping.get(d) or next(
            (l.name for l in prs.slide_layouts if l.name.strip().lower() == d.lower()),
            None,
        )

    # Preserve any extra keys from existing mapping
    for k, v in existing_mapping.items():
        if k not in mapping:
            mapping[k] = v

    # Show summary
    print("\nCurrent mapping (default_name -> template_layout_name):")
    for d in DEFAULTS:
        print(f"  {d:<24} -> {mapping[d] or '❌ not mapped'}")

    # Ask if user wants to customize
    ans = input("\nCustomize mappings? [y/N]: ").strip().lower()
    if ans == "y":
        for d in DEFAULTS:
            current = mapping[d]
            match_display = current or '❌ not mapped'
            while True:
                prompt = (
                    f"'{d}' is currently mapped to '{match_display}'.\n"
                    "Press Enter to keep, index to change, or 's' to clear: "
                )
                choice = input(prompt).strip().lower()
                if choice == "":
                    break  # keep current
                if choice in {"s", "skip"}:
                    mapping[d] = None
                    break
                if choice.isdigit():
                    idx = int(choice)
                    if 0 <= idx < len(prs.slide_layouts):
                        mapping[d] = prs.slide_layouts[idx].name
                        break
                print("Invalid input. Enter layout index, 's' to clear, or press Enter to keep.")

    # write mapping file
    with map_path.open("w", encoding="utf-8") as f:
        json.dump(mapping, f, indent=2)
    print(f"\nMapping saved to {map_path}")

if __name__ == "__main__":
    main()
