"""Render individual UI components to HTML."""
from server.preview.constants import AB_H, AB_W


def esc(s: str) -> str:
    return (
        str(s)
        .replace("&", "&amp;")
        .replace('"', "&quot;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def render_component(c: dict, offset_x: int = 0, offset_y: int = 0) -> str:
    comp_type = c.get("type", "")
    x = c.get("x", 0) - offset_x
    y = c.get("y", 0) - offset_y
    w = c.get("w", 100)
    h = c.get("h", 40)
    bg = c.get("bg", "transparent")
    color = c.get("color", "#ffffff")
    radius = c.get("radius", 0)
    text = c.get("text", "")
    style = (
        f"position:absolute;"
        f"left:{x}px;"
        f"top:{y}px;"
        f"width:{w}px;"
        f"height:{h}px;"
        f"background:{bg};"
        f"color:{color};"
        f"border-radius:{radius}px;"
        f"display:flex;"
        f"align-items:center;"
        f"justify-content:center;"
        f"font-size:12px;"
        f"font-family:system-ui,sans-serif;"
        f"overflow:hidden;"
        f"box-sizing:border-box;"
    )
    if comp_type == "Container":
        return f'<div class="ui-static" style="{style} border:1px dashed rgba(255,255,255,0.08);"></div>'
    if comp_type == "Text":
        return f'<div class="ui-static" style="{style} background:transparent; justify-content:flex-start; padding:0 4px;">{esc(text)}</div>'
    if comp_type in ("Button", "Bubble", "QuickReply", "Prompt"):
        return f'<button class="ui-static quick-reply" data-text="{esc(text)}" style="{style} border:none; cursor:pointer;">{esc(text)}</button>'
    if comp_type == "TextField":
        return f'<div class="ui-static" style="{style} justify-content:flex-start; padding:0 8px; opacity:0.4;">{esc(text or "Ввод...")}</div>'
    if comp_type == "Avatar":
        return f'<div class="ui-static" style="{style} border:none;"><div style="width:80%;height:80%;border-radius:50%;background:{color};display:grid;place-items:center;font-size:{min(w,h)//3}px;color:{bg};">{esc(text or "")}</div></div>'
    return f'<div class="ui-static" style="{style} border:1px dashed rgba(255,255,255,0.08);">{esc(text)}</div>'


def color_prop(state: list, types: tuple, prop: str, default: str) -> str:
    for c in state:
        if c.get("type") in types and prop in c:
            val = str(c[prop]).strip().lower()
            if val and val != "transparent":
                return str(c[prop])
    return default


def is_large_background(c: dict) -> bool:
    if c.get("type") not in ("Container", "Row", "Column", "Card"):
        return False
    w = int(c.get("w", 0))
    h = int(c.get("h", 0))
    return w >= AB_W * 0.85 and h >= AB_H * 0.4
