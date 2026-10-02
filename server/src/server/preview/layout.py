"""Layout analysis for the preview page."""
from server.preview.constants import AB_H
from server.preview.render import is_large_background


def find_chat_input_ids(state: list) -> set:
    ids = set()
    text_fields = [c for c in state if c.get("type") == "TextField"]
    if text_fields:
        input_field = max(text_fields, key=lambda c: c.get("y", 0))
        ids.add(input_field.get("id"))

        ix = input_field.get("x", 0)
        iy = input_field.get("y", 0)
        iw = input_field.get("w", 0)
        ih = input_field.get("h", 0)
        icy = iy + ih / 2

        send_candidates = []
        for b in [c for c in state if c.get("type") == "Button"]:
            bx = b.get("x", 0)
            by = b.get("y", 0)
            bw = b.get("w", 0)
            bh = b.get("h", 0)
            bcy = by + bh / 2
            if bx > ix + iw * 0.5 and abs(bcy - icy) <= max(ih, bh) * 0.8:
                send_candidates.append(b)

        if send_candidates:
            send_candidates.sort(key=lambda b: b.get("x", 0))
            ids.add(send_candidates[0].get("id"))
    return ids


def find_content_bounds(state: list) -> tuple[int, int]:
    """Return (header_bottom, footer_top) in device-relative coordinates."""
    dialog_types = {"Bubble", "Typing", "QuickReply", "Prompt"}
    chat_input_ids = find_chat_input_ids(state)
    static = [
        c
        for c in state
        if c.get("type") not in dialog_types and c.get("id") not in chat_input_ids
    ]
    if not static:
        return (0, AB_H)

    boxes = []
    for c in static:
        y = int(c.get("y", 0)) - 80  # AB_Y
        h = max(20, int(c.get("h", 40)))
        if is_large_background(c):
            continue
        boxes.append((y, y + h))

    if not boxes:
        return (0, AB_H)

    boxes.sort(key=lambda b: b[0])
    header_bottom = boxes[0][1]
    for y, bottom in boxes[1:]:
        if y - header_bottom <= 20:
            header_bottom = max(header_bottom, bottom)
        else:
            break

    max_header_bottom = AB_H // 4
    header_bottom = min(header_bottom, max_header_bottom)

    boxes_by_bottom = sorted(boxes, key=lambda b: b[1], reverse=True)
    footer_top = boxes_by_bottom[0][0]
    for y, bottom in boxes_by_bottom[1:]:
        if footer_top - bottom <= 20:
            footer_top = min(footer_top, y)
        else:
            break

    if header_bottom >= footer_top:
        return (0, AB_H)

    return (max(0, header_bottom), min(AB_H, footer_top))
