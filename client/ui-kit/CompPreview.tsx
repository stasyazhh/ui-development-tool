import { C } from "@/theme"
import { COMP_META } from "./constants"

export default function CompPreview({ type }: { type: string }) {
  const color = COMP_META[type]?.color ?? C.t2

  switch (type) {
    case "Container":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            border: `1px dashed ${color}`,
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
            border: `1px dashed ${color}`,
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
            border: `1px dashed ${color}`,
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
          <div style={{ flex: 1, height: 1, background: C.b2 }} />
        </div>
      )
    case "Spacer":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            border: `1px dashed ${C.t3}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 9, fontFamily: C.mono, color: C.t3 }}>
            ↕ spacer
          </span>
        </div>
      )
    case "TextField":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: C.s2,
            border: `1px solid ${C.b2}`,
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
          }}
        >
          <span style={{ fontSize: 11, color: C.t3, fontFamily: C.sans }}>
            Введите текст...
          </span>
        </div>
      )
    case "Select":
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: C.s2,
            border: `1px solid ${C.b2}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 10px",
          }}
        >
          <span style={{ fontSize: 11, color: C.t3, fontFamily: C.sans }}>
            Выбрать...
          </span>
          <span style={{ fontSize: 9, color: C.t2 }}>▾</span>
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
              background: C.acc,
              borderRadius: 10,
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
                background: "#fff",
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
              background: C.b2,
              borderRadius: 2,
              position: "relative",
            }}
          >
            <div
              style={{
                width: "60%",
                height: "100%",
                background: C.acc,
                borderRadius: 2,
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
                background: C.acc,
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
            background: C.acc,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#fff",
              fontWeight: 500,
              fontFamily: C.sans,
            }}
          >
            Кнопка
          </span>
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
          <span style={{ fontSize: 12, color: C.t1, fontFamily: C.sans }}>
            Текстовый элемент
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
              background: C.accA,
              border: `1px solid ${C.accB}`,
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              color: C.acc,
            }}
          >
            A
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
              background: `${C.pur}22`,
              border: `1px solid ${C.pur}55`,
              borderRadius: 10,
              padding: "2px 10px",
              fontSize: 10,
              color: C.pur,
              fontFamily: C.mono,
            }}
          >
            badge
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
            style={{ flex: 1, height: 4, background: C.b2, borderRadius: 2 }}
          >
            <div
              style={{
                width: "45%",
                height: "100%",
                background: C.pur,
                borderRadius: 2,
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
            background: C.s2,
            border: `1px solid ${C.b2}`,
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
              background: C.acc,
              borderRadius: 2,
            }}
          />
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
              background: C.s2,
              border: `1px solid ${C.b2}`,
              padding: "6px 10px",
              fontSize: 11,
              color: C.t1,
              fontFamily: C.sans,
              maxWidth: "85%",
            }}
          >
            Сообщение ассистента...
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
              background: C.s2,
              border: `1px solid ${C.b2}`,
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
                  background: C.t2,
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
                background: C.s2,
                border: `1px solid ${C.b2}`,
                padding: "4px 10px",
                fontSize: 10,
                color: C.t1,
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
              background: C.s2,
              border: `1px solid ${C.b2}`,
              height: 32,
              display: "flex",
              alignItems: "center",
              padding: "0 8px",
            }}
          >
            <span style={{ fontSize: 11, color: C.t3, fontFamily: C.sans }}>
              Задайте вопрос...
            </span>
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              background: C.acc,
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
    default:
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            border: `1px dashed ${color}`,
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
