// =============================================================
//  사진 자동 출력 모듈 (실험적 기능 — 확정 아님)
// -------------------------------------------------------------
//  ▸ 저장된 PNG 파일을 프린터로 자동 출력합니다.
//  ▸ macOS / Linux 의 CUPS `lp` 명령을 사용합니다.
//  ▸ 기본값은 "비활성화" 입니다. 아래 환경변수로 켜세요.
//
//  [켜기]  .env(.local) 에:
//      PRINT_ENABLED=true
//      PRINT_PRINTER=이름            # 비우면 시스템 기본 프린터
//      PRINT_COPIES=1
//      PRINT_MEDIA=Custom.4x6in      # 용지 크기 (예: A4, 4x6, Custom.4x6in)
//      PRINT_FIT=true                # 용지에 맞춰 확대/축소
//      PRINT_ORIENTATION=portrait    # portrait | landscape | (빈값=자동)
//      PRINT_EXTRA=-o ColorModel=RGB # 그대로 lp 에 전달할 추가 옵션(공백 구분)
//
//  [끄기]  PRINT_ENABLED 를 빼거나 false → 이 모듈은 즉시 no-op.
//  [완전 제거]  이 파일 삭제 + upload.js 의 "[사진 자동 출력]" 블록만 삭제.
// =============================================================

import { spawn } from "child_process";

// ---- 기본 설정 (환경변수로 덮어씀) ----
export const PRINT_CONFIG = {
  enabled: process.env.PRINT_ENABLED === "true",
  // 드라이런: 실제 출력 대신 "보낼 lp 명령"만 로그. 프린터 없이 테스트용.
  dryRun: process.env.PRINT_DRYRUN === "true",
  printer: process.env.PRINT_PRINTER || "", // 빈 값 = 기본 프린터
  copies: parseInt(process.env.PRINT_COPIES || "1", 10),
  media: process.env.PRINT_MEDIA || "Custom.4x6in",
  fitToPage: (process.env.PRINT_FIT || "true") !== "false",
  orientation: process.env.PRINT_ORIENTATION || "", // portrait | landscape | ""
  // 공백으로 구분된 추가 lp 옵션 문자열 → 배열
  extra: (process.env.PRINT_EXTRA || "").trim(),
};

// orientation-requested: 3=portrait, 4=landscape (CUPS 표준)
const ORIENTATION_CODE = { portrait: "3", landscape: "4" };

/**
 * 사진 파일을 프린터로 출력합니다. (절대 throw 하지 않음 — 실패해도 호출부 흐름을 막지 않음)
 * @param {string} filePath  출력할 이미지 절대경로
 * @param {object} overrides PRINT_CONFIG 일부를 이 호출에서만 덮어쓰기
 * @returns {Promise<{printed:boolean, reason?:string, code?:number}>}
 */
export async function printPhoto(filePath, overrides = {}) {
  const cfg = { ...PRINT_CONFIG, ...overrides };

  if (!cfg.enabled) return { printed: false, reason: "disabled" };

  if (process.platform === "win32") {
    // Windows 는 lp 가 없음 — 필요 시 별도 구현
    return { printed: false, reason: "windows-unsupported" };
  }

  const args = [];
  if (cfg.printer) args.push("-d", cfg.printer);
  if (cfg.copies > 1) args.push("-n", String(cfg.copies));
  if (cfg.media) args.push("-o", `media=${cfg.media}`);
  if (cfg.fitToPage) args.push("-o", "fit-to-page");
  if (cfg.orientation && ORIENTATION_CODE[cfg.orientation]) {
    args.push("-o", `orientation-requested=${ORIENTATION_CODE[cfg.orientation]}`);
  }
  if (cfg.extra) args.push(...cfg.extra.split(/\s+/));
  args.push(filePath);

  if (cfg.dryRun) {
    console.log("[printer] (dry-run) 실행할 명령: lp", args.join(" "));
    return { printed: false, reason: "dry-run", cmd: `lp ${args.join(" ")}` };
  }

  return new Promise((resolve) => {
    try {
      const child = spawn("lp", args, { stdio: ["ignore", "pipe", "pipe"] });
      let out = "";
      let err = "";
      child.stdout.on("data", (d) => (out += d.toString()));
      child.stderr.on("data", (d) => (err += d.toString()));

      child.on("error", (e) => {
        console.error("[printer] lp 실행 실패:", e.message);
        resolve({ printed: false, reason: "spawn-error" });
      });

      child.on("close", (code) => {
        if (code === 0) {
          console.log("[printer] 출력 요청 완료:", out.trim() || filePath);
          resolve({ printed: true, code });
        } else {
          console.error("[printer] 출력 실패 code=", code, err.trim());
          resolve({ printed: false, reason: "nonzero-exit", code });
        }
      });
    } catch (e) {
      console.error("[printer] 예외:", e?.message);
      resolve({ printed: false, reason: "exception" });
    }
  });
}
