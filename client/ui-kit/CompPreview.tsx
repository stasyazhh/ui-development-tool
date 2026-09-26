import { C } from "@/theme"
import { defaultProps, type CompProps } from "./constants"

export default function CompPreview({
  type,
  props,
}: {
  type: string
  props?: CompProps
}) {
  const p = { ...defaultProps(type), ...props }
  const { color, bg, radius, text } = p

  switch (type) {
    case "Container":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px dashed ${color}`,
            borderRadius: radius,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 10, fontFamily: C.mono, color }}>
            Container
          </span>
        </div>
      )
    case "Row":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px dashed ${color}`,
            borderRadius: radius,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 10px",
          }}
        >
          {[40, 60, 40].map((w, i) => (
            <div
              key={i}
              style={{
                width: w,
                height: 16,
                background: C.b2,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      )
    case "Column":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px dashed ${color}`,
            borderRadius: radius,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            padding: "10px 0",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "70%",
                height: 14,
                background: C.b2,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      )
    case "Divider":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, height: 1, background: color }} />
        </div>
      )
    case "Spacer":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px dashed ${color}`,
            borderRadius: radius,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 9, fontFamily: C.mono, color }}>
            ↕ spacer
          </span>
        </div>
      )
    case "Header":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            borderBottom: `1px solid ${color}33`,
            borderRadius: `${radius}px ${radius}px 0 0`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 14px",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: C.sans }}>
            {text}
          </span>
          <span style={{ fontSize: 14, color }}>⋯</span>
        </div>
      )
    case "Footer":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            borderTop: `1px solid ${color}33`,
            borderRadius: `0 0 ${radius}px ${radius}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "0 10px",
          }}
        >
          {["◆", "◈", "◉", "◇"].map((icon, i) => (
            <span key={i} style={{ fontSize: 14, color }}>
              {icon}
            </span>
          ))}
        </div>
      )
    case "Grid":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px dashed ${color}`,
            borderRadius: radius,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 6,
            padding: 8,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: color,
                borderRadius: Math.max(0, radius - 1),
                opacity: 0.2,
              }}
            />
          ))}
        </div>
      )
    case "TextField":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px solid ${color}`,
            borderRadius: radius,
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
          }}
        >
          <span style={{ fontSize: 11, color, fontFamily: C.sans }}>
            {text}
          </span>
        </div>
      )
    case "TextArea":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px solid ${color}`,
            borderRadius: radius,
            display: "flex",
            flexDirection: "column",
            padding: "8px 10px",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 11, color, fontFamily: C.sans }}>
            {text}
          </span>
          <div style={{ marginTop: "auto", display: "flex", gap: 4 }}>
            <div style={{ flex: 1, height: 3, background: color, opacity: 0.2, borderRadius: 2 }} />
            <div style={{ width: 20, height: 3, background: color, opacity: 0.2, borderRadius: 2 }} />
          </div>
        </div>
      )
    case "Select":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px solid ${color}`,
            borderRadius: radius,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
          }}
        >
          <span style={{ fontSize: 11, color, fontFamily: C.sans }}>
            {text}
          </span>
          <span style={{ fontSize: 9, color }}>▾</span>
        </div>
      )
    case "Toggle":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 36,
              height: 20,
              background: bg,
              borderRadius: radius,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: 2,
                top: 2,
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: color,
              }}
            />
          </div>
        </div>
      )
    case "Slider":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            gap: 6,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 3,
              background: bg,
              borderRadius: radius,
              position: "relative",
            }}
          >
            <div
              style={{
                width: "60%",
                height: "100%",
                background: color,
                borderRadius: radius,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "60%",
                top: "50%",
                transform: "translate(-50%,-50%)",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color,
              }}
            />
          </div>
        </div>
      )
    case "Button":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            borderRadius: radius,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color,
              fontWeight: 500,
              fontFamily: C.sans,
            }}
          >
            {text}
          </span>
        </div>
      )
    case "Checkbox":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 10px",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              background: color,
              borderRadius: Math.min(radius, 4),
              display: "grid",
              placeItems: "center",
              fontSize: 10,
              color: bg,
            }}
          >
            ✓
          </div>
          <span style={{ fontSize: 11, color, fontFamily: C.sans }}>{text}</span>
        </div>
      )
    case "Radio":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 10px",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              border: `2px solid ${color}`,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
          </div>
          <span style={{ fontSize: 11, color, fontFamily: C.sans }}>{text}</span>
        </div>
      )
    case "Text":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color,
              background: bg,
              borderRadius: radius,
              fontFamily: C.sans,
              padding: bg && bg !== "transparent" ? "2px 6px" : 0,
            }}
          >
            {text}
          </span>
        </div>
      )
    case "Avatar":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: bg,
              border: `1px solid ${color}55`,
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              color,
            }}
          >
            {text || "A"}
          </div>
        </div>
      )
    case "Badge":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: bg,
              border: `1px solid ${color}55`,
              borderRadius: radius,
              padding: "2px 10px",
              fontSize: 10,
              color,
              fontFamily: C.mono,
            }}
          >
            {text}
          </div>
        </div>
      )
    case "Progress":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
          }}
        >
          <div
            style={{
              flex: 1,
              height: 4,
              background: bg,
              borderRadius: radius,
            }}
          >
            <div
              style={{
                width: "45%",
                height: "100%",
                background: color,
                borderRadius: radius,
              }}
            />
          </div>
        </div>
      )
    case "Card":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px solid ${color}`,
            borderRadius: radius,
            display: "flex",
            flexDirection: "column",
            padding: 12,
            gap: 8,
          }}
        >
          <div
            style={{
              width: "60%",
              height: 10,
              background: C.b2,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              width: "90%",
              height: 8,
              background: C.b1,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              width: "75%",
              height: 8,
              background: C.b1,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              marginTop: "auto",
              width: 60,
              height: 24,
              background: color,
              borderRadius: 2,
            }}
          />
        </div>
      )
    case "Image":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px dashed ${color}55`,
            borderRadius: radius,
            display: "grid",
            placeItems: "center",
            fontSize: 28,
            color,
          }}
        >
          {text || "🖼"}
        </div>
      )
    case "Icon":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            borderRadius: radius,
            display: "grid",
            placeItems: "center",
            fontSize: 20,
            color,
          }}
        >
          {text || "★"}
        </div>
      )
    case "Alert":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px solid ${color}55`,
            borderRadius: radius,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 12px",
          }}
        >
          <span style={{ fontSize: 14, color }}>▲</span>
          <span style={{ fontSize: 11, color, fontFamily: C.sans }}>{text}</span>
        </div>
      )
    case "List":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px solid ${color}33`,
            borderRadius: radius,
            display: "flex",
            flexDirection: "column",
            padding: "8px 10px",
            gap: 6,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
              <div style={{ flex: 1, height: 6, background: color, opacity: 0.2, borderRadius: 2 }} />
            </div>
          ))}
        </div>
      )
    case "Bubble":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
          }}
        >
          <div
            style={{
              background: bg,
              border: `1px solid ${color}55`,
              borderRadius: radius,
              padding: "6px 10px",
              fontSize: 11,
              color,
              fontFamily: C.sans,
              maxWidth: "85%",
            }}
          >
            {text}
          </div>
        </div>
      )
    case "Typing":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 4,
              background: bg,
              border: `1px solid ${color}55`,
              borderRadius: radius,
              padding: "8px 12px",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: color,
                }}
              />
            ))}
          </div>
        </div>
      )
    case "QuickReply":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 8px",
          }}
        >
          {["Да", "Нет", "Далее"].map((t) => (
            <div
              key={t}
              style={{
                background: bg,
                border: `1px solid ${color}55`,
                borderRadius: radius,
                padding: "4px 10px",
                fontSize: 10,
                color,
                fontFamily: C.sans,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      )
    case "Prompt":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "0 8px",
          }}
        >
          <div
            style={{
              flex: 1,
              background: bg,
              border: `1px solid ${color}55`,
              borderRadius: radius,
              height: 32,
              display: "flex",
              alignItems: "center",
              padding: "0 8px",
            }}
          >
            <span style={{ fontSize: 11, color, fontFamily: C.sans }}>
              {text}
            </span>
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              background: color,
              borderRadius: radius,
              display: "grid",
              placeItems: "center",
              fontSize: 13,
              color: "#fff",
            }}
          >
            →
          </div>
        </div>
      )
    case "Modal":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px solid ${color}33`,
            borderRadius: radius,
            display: "flex",
            flexDirection: "column",
            padding: 12,
            gap: 8,
            boxShadow: "0 8px 32px rgba(0,0,0,.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: C.sans }}>{text}</span>
            <span style={{ fontSize: 12, color }}>✕</span>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
            <div style={{ height: 8, background: color, opacity: 0.15, borderRadius: 2 }} />
            <div style={{ height: 8, background: color, opacity: 0.15, borderRadius: 2, width: "80%" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
            <div style={{ width: 60, height: 22, background: color, opacity: 0.25, borderRadius: 2 }} />
            <div style={{ width: 60, height: 22, background: color, borderRadius: 2 }} />
          </div>
        </div>
      )
    case "Snackbar":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            borderRadius: radius,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 12px",
            boxShadow: "0 4px 16px rgba(0,0,0,.4)",
          }}
        >
          <span style={{ fontSize: 11, color, fontFamily: C.sans }}>{text}</span>
          <span style={{ fontSize: 11, color, fontWeight: 600 }}>OK</span>
        </div>
      )
    default:
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: bg,
            border: `1px dashed ${color}`,
            borderRadius: radius,
            display: "grid",
            placeItems: "center",
          }}
        >
          <span style={{ fontSize: 10, fontFamily: C.mono, color }}>
            {type}
          </span>
        </div>
      )
  }
}
