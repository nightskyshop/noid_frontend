// 인쇄 매수 선택 (1~4, -/+ 버튼)
// 선택값을 localStorage("printCopies") 에 저장 → 업로드 시 서버로 전달되어 출력 매수로 적용됨.
// 기존 페이지 CSS 모듈과 충돌하지 않도록 fixed 위치 + 인라인 스타일로 자체 완결.
import { useEffect, useState } from "react";

export default function CopiesSelector({ min = 1, max = 4 }) {
  const [copies, setCopies] = useState(1);

  // 마운트 시 저장값 복원(없으면 1). localStorage 는 서버에 없으므로
  // SSR 결과(1)와 첫 클라이언트 렌더를 일치시킨 뒤 마운트 후에만 읽어야
  // 하이드레이션 불일치가 생기지 않는다 — 렌더 중 lazy init 으로 바꾸면 안 됨.
  useEffect(() => {
    const saved = parseInt(localStorage.getItem("printCopies") || "1", 10);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCopies(Number.isFinite(saved) ? Math.min(max, Math.max(min, saved)) : 1);
  }, [min, max]);

  // 값이 바뀔 때마다 localStorage 에 저장 (업로드 시 서버로 전달됨)
  useEffect(() => {
    localStorage.setItem("printCopies", String(copies));
  }, [copies]);

  const dec = () => setCopies((p) => Math.max(min, p - 1));
  const inc = () => setCopies((p) => Math.min(max, p + 1));

  return (
    <div style={s.wrap}>
      <span style={s.label}>인쇄 매수</span>
      <button
        style={{ ...s.btn, ...(copies <= min ? s.btnDisabled : {}) }}
        onClick={dec}
        disabled={copies <= min}
        aria-label="매수 감소"
      >
        −
      </button>
      <span style={s.count}>{copies}</span>
      <button
        style={{ ...s.btn, ...(copies >= max ? s.btnDisabled : {}) }}
        onClick={inc}
        disabled={copies >= max}
        aria-label="매수 증가"
      >
        +
      </button>
    </div>
  );
}

const s = {
  wrap: {
    position: "fixed",
    bottom: 28,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "12px 20px",
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    borderRadius: 999,
    boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
    zIndex: 5000,
    fontFamily: '"Pretendard-SemiBold", sans-serif',
    userSelect: "none",
  },
  label: {
    fontSize: 18,
    fontWeight: 600,
    color: "#333",
    marginRight: 4,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    background: "#3832e9",
    color: "#fff",
    fontSize: 26,
    lineHeight: "44px",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  btnDisabled: {
    background: "#c7c7cc",
    cursor: "not-allowed",
  },
  count: {
    minWidth: 32,
    textAlign: "center",
    fontSize: 26,
    fontWeight: 700,
    color: "#111",
  },
};
