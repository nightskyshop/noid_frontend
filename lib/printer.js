// =============================================================
//  사진 자동 출력 모듈 (크로스 플랫폼)
// -------------------------------------------------------------
//  ▸ 저장된 PNG 파일을 실제 프린터(EPSON L18050 Series)로 출력합니다.
//  ▸ macOS / Linux : CUPS `lp` 명령
//  ▸ Windows       : PowerShell + .NET System.Drawing (외부 프로그램 불필요)
//  ▸ 기본값은 "활성화" 입니다. 프린터가 시스템에 등록되어 있어야 합니다.
//
//  [기본 동작]  프린터 EPSON L18050 Series / 102x152mm(4x6in) / 광택 사진용지 / 세로
//
//  [환경변수로 덮어쓰기]  .env(.local) 에:
//      PRINT_ENABLED=false                   # 출력 끄기 (기본은 켜짐)
//      PRINT_DRYRUN=true                     # 실제 출력 대신 명령만 로그 (테스트용)
//      PRINT_PRINTER=EPSON L18050 Series     # 프린터 이름 (비우면 시스템 기본)
//      PRINT_COPIES=1
//      PRINT_MEDIA=Custom.102x152mm          # 용지 크기 (기본: 102x152mm = 4x6in) [CUPS 전용]
//      PRINT_MEDIA_TYPE=photographic-glossy  # 용지 종류 (기본: 사진 용지/광택) [CUPS 전용]
//      PRINT_FIT=true                        # 용지에 맞춰 확대/축소
//      PRINT_ORIENTATION=portrait            # portrait | landscape | (빈값=자동)
//      PRINT_EXTRA=-o ColorModel=RGB         # 그대로 lp 에 전달할 추가 옵션(공백 구분) [CUPS 전용]
//
//  ※ Windows 의 용지 종류(광택)/여백없음(테두리없음)은 System.Drawing 으로
//    직접 지정이 어려워, 프린터 드라이버 "기본 설정"(인쇄 기본 설정)에서
//    4x6 광택/테두리없음을 지정해 두는 것을 권장합니다. 코드는 프린터/용지크기/
//    방향을 제어합니다.
//
//  [완전 제거]  이 파일 삭제 + upload.js 의 "[사진 자동 출력]" 블록만 삭제.
// =============================================================

import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

// ---- 기본 설정 (환경변수로 덮어씀) ----
export const PRINT_CONFIG = {
  // 실제 프린터 출력 — 기본 활성화. 끄려면 PRINT_ENABLED=false
  enabled: process.env.PRINT_ENABLED !== "false",
  // 드라이런: 실제 출력 대신 "보낼 명령"만 로그. 프린터 없이 테스트용.
  dryRun: process.env.PRINT_DRYRUN === "true",
  // 프린터 이름 (비우면 시스템 기본 프린터)
  printer: process.env.PRINT_PRINTER || "EPSON L18050 Series",
  copies: parseInt(process.env.PRINT_COPIES || "1", 10),
  // 용지 크기: 102x152mm (4x6 in)  — CUPS(lp)에서 사용
  media: process.env.PRINT_MEDIA || "Custom.102x152mm",
  // 용지 종류: 사진 용지(광택) — CUPS(lp)에서 사용
  mediaType: process.env.PRINT_MEDIA_TYPE || "photographic-glossy",
  fitToPage: (process.env.PRINT_FIT || "true") !== "false",
  // 인쇄 방향: 세로(portrait)
  orientation: process.env.PRINT_ORIENTATION || "portrait", // portrait | landscape | ""
  // 공백으로 구분된 추가 lp 옵션 문자열 → 배열 (CUPS 전용)
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

  try {
    if (process.platform === "win32") {
      return await printOnWindows(cfg, filePath);
    }
    return await printOnUnix(cfg, filePath);
  } catch (e) {
    console.error("[printer] 예외:", e?.message);
    return { printed: false, reason: "exception" };
  }
}

/* =========================================================
   macOS / Linux : CUPS `lp`
========================================================= */
function printOnUnix(cfg, filePath) {
  const args = [];
  if (cfg.printer) args.push("-d", cfg.printer);
  if (cfg.copies > 1) args.push("-n", String(cfg.copies));
  if (cfg.media) args.push("-o", `media=${cfg.media}`);
  if (cfg.mediaType) args.push("-o", `media-type=${cfg.mediaType}`);
  if (cfg.fitToPage) {
    // "fit-to-page" 는 구형 이미지 래스터 필터 옵션, "print-scaling=fit" 는 최신
    // CUPS/IPP 표준 옵션. 두 값 모두 "비율 유지 + 용지 안에 맞춤(레터박스)" 을
    // 의미하며 "잘라내기(fill/crop)" 를 하지 않는다. 드라이버별 호환을 위해 함께 전달.
    args.push("-o", "fit-to-page");
    args.push("-o", "print-scaling=fit");
    // 일부 드라이버는 기본적으로 여백(인쇄 불가 영역)을 실제보다 넓게 잡아,
    // 정확히 용지 크기로 만든 이미지의 오른쪽/아래가 그 여백만큼 잘려 나갈 수
    // 있다. 여백을 0으로 명시해 인쇄 가능 영역을 용지 전체로 맞춘다.
    args.push("-o", "media-top-margin=0");
    args.push("-o", "media-bottom-margin=0");
    args.push("-o", "media-left-margin=0");
    args.push("-o", "media-right-margin=0");
    // Gutenprint 계열 드라이버(리눅스/macOS에서 흔함)의 테두리없음 인쇄 옵션.
    // 드라이버가 이 옵션을 모르면 조용히 무시되므로 다른 드라이버에도 안전하다.
    args.push("-o", "StpFullBleed=True");
  }
  if (cfg.orientation && ORIENTATION_CODE[cfg.orientation]) {
    args.push("-o", `orientation-requested=${ORIENTATION_CODE[cfg.orientation]}`);
  }
  if (cfg.extra) args.push(...cfg.extra.split(/\s+/));
  args.push(filePath);

  if (cfg.dryRun) {
    const shown = args.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(" ");
    console.log("[printer] (dry-run) 실행할 명령: lp", shown);
    return Promise.resolve({ printed: false, reason: "dry-run", cmd: `lp ${shown}` });
  }

  return new Promise((resolve) => {
    const child = spawn("lp", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    let settled = false; // spawn 실패 시 "error" 와 "close" 가 모두 발생해 중복 로그가 찍히는 것을 방지
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));

    child.on("error", (e) => {
      if (settled) return;
      settled = true;
      console.error("[printer] lp 실행 실패:", e.message);
      resolve({ printed: false, reason: "spawn-error" });
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      if (code === 0) {
        console.log("[printer] 출력 요청 완료:", out.trim() || filePath);
        resolve({ printed: true, code });
      } else {
        console.error("[printer] 출력 실패 code=", code, err.trim());
        resolve({ printed: false, reason: "nonzero-exit", code });
      }
    });
  });
}

/* =========================================================
   Windows : PowerShell + .NET System.Drawing.Printing
   - 프린터 이름 / 용지 크기(4x6) / 인쇄 방향 / 매수 제어
   - 이미지를 비율 유지하여 용지 중앙에 맞춰 출력
========================================================= */
// PowerShell 스크립트는 ASCII 만 사용한다. (한글이 들어가면 PowerShell 5.1 의
// 코드페이지 문제로 깨져서 스크립트 파싱이 실패한다 — 주석/문자열 모두 영어로 유지.)
const WINDOWS_PRINT_SCRIPT = `
param(
  [Parameter(Mandatory=$true)][string]$ImagePath,
  [string]$PrinterName = "",
  [string]$Landscape = "false",
  [int]$Copies = 1
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile($ImagePath)
try {
  $doc = New-Object System.Drawing.Printing.PrintDocument
  if ($PrinterName -ne "") { $doc.PrinterSettings.PrinterName = $PrinterName }
  if (-not $doc.PrinterSettings.IsValid) {
    Write-Error ("Invalid printer: " + $PrinterName)
    exit 2
  }
  if ($Copies -gt 0) { $doc.PrinterSettings.Copies = [int16]$Copies }

  $doc.DefaultPageSettings.Landscape = ($Landscape -eq "true")

  # 4x6 in = 400 x 600 (hundredths of an inch).
  # Prefer a borderless 4x6 paper if the printer has one (true edge-to-edge),
  # otherwise fall back to a normal 4x6 paper size.
  $sel = $null
  foreach ($ps in $doc.PrinterSettings.PaperSizes) {
    if ($ps.PaperName -match "4.*6" -and $ps.PaperName -match "(?i)borderless|frameless|full.?bleed") { $sel = $ps; break }
  }
  if ($sel -eq $null) {
    foreach ($ps in $doc.PrinterSettings.PaperSizes) {
      if (($ps.Width -eq 400 -and $ps.Height -eq 600) -or ($ps.PaperName -match "4.*6")) { $sel = $ps; break }
    }
  }
  if ($sel -eq $null) { $sel = New-Object System.Drawing.Printing.PaperSize("4x6", 400, 600) }
  $doc.DefaultPageSettings.PaperSize = $sel
  $doc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0,0,0,0)
  $doc.OriginAtMargins = $false

  $doc.add_PrintPage({
    param($s, $e)
    # With OriginAtMargins=false, Graphics origin (0,0) is the top-left of the
    # printable area (inside the hardware margins). Draw within the printable
    # area so nothing is clipped, and center on the full sheet using a symmetric
    # safety box (largest of the two opposite hardware margins on each axis).
    $pa = $e.PageSettings.PrintableArea
    $pb = $e.PageBounds
    $paX = $pa.X; $paY = $pa.Y; $paW = $pa.Width; $paH = $pa.Height
    if ($e.PageSettings.Landscape) {
      $t = $paX; $paX = $paY; $paY = $t
      $t = $paW; $paW = $paH; $paH = $t
    }
    $marL = $paX
    $marT = $paY
    $marR = $pb.Width - $paX - $paW
    $marB = $pb.Height - $paY - $paH
    $availW = $pb.Width - 2 * [Math]::Max($marL, $marR)
    $availH = $pb.Height - 2 * [Math]::Max($marT, $marB)
    $ratio = [Math]::Min($availW / $img.Width, $availH / $img.Height)
    $w = [int]($img.Width * $ratio)
    $h = [int]($img.Height * $ratio)
    # Convert sheet-centered coordinates to Graphics coords (origin = printable top-left)
    $x = [int](($pb.Width - $w) / 2 - $paX)
    $y = [int](($pb.Height - $h) / 2 - $paY)
    $e.Graphics.DrawImage($img, $x, $y, $w, $h)
  })

  $doc.Print()
  Write-Output ("PRINTED " + $ImagePath)
} finally {
  $img.Dispose()
}
`;

async function printOnWindows(cfg, filePath) {
  const landscape = cfg.orientation === "landscape" ? "true" : "false";

  // 스크립트를 임시 .ps1 로 저장 (인용 문제 회피)
  const scriptPath = path.join(
    os.tmpdir(),
    `noid-print-${process.pid}-${Date.now()}.ps1`
  );
  // 중요: Windows 기본 powershell.exe(5.1)는 BOM 이 없는 .ps1 을 UTF-8 이 아닌
  // 시스템 기본 코드페이지(한글 Windows 는 CP949)로 읽어, 파일 안의 한글 주석/
  // 문자열이 깨지면서 스크립트 파싱 자체가 실패한다("정상적이지 않은 토큰" 등의
  // 에러). UTF-8 BOM(EF BB BF)을 앞에 붙여 인코딩을 명시해야 올바르게 읽힌다.
  const UTF8_BOM = String.fromCharCode(0xfeff);
  await fs.promises.writeFile(scriptPath, UTF8_BOM + WINDOWS_PRINT_SCRIPT, "utf8");

  const args = [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    scriptPath,
    "-ImagePath",
    filePath,
    "-PrinterName",
    cfg.printer || "",
    "-Landscape",
    landscape,
    "-Copies",
    String(cfg.copies || 1),
  ];

  const cleanup = () => fs.promises.unlink(scriptPath).catch(() => {});

  if (cfg.dryRun) {
    const shown = ["powershell", ...args]
      .map((a) => (/\s/.test(a) ? `"${a}"` : a))
      .join(" ");
    console.log("[printer] (dry-run) 실행할 명령:", shown);
    await cleanup();
    return { printed: false, reason: "dry-run", cmd: shown };
  }

  return new Promise((resolve) => {
    const child = spawn("powershell", args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let out = "";
    let err = "";
    let settled = false; // spawn 실패 시 "error" 와 "close" 가 모두 발생해 중복 로그가 찍히는 것을 방지
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));

    child.on("error", (e) => {
      if (settled) return;
      settled = true;
      console.error("[printer] powershell 실행 실패:", e.message);
      cleanup();
      resolve({ printed: false, reason: "spawn-error" });
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (code === 0) {
        console.log("[printer] 출력 요청 완료:", out.trim() || filePath);
        resolve({ printed: true, code });
      } else {
        console.error("[printer] 출력 실패 code=", code, err.trim());
        resolve({ printed: false, reason: "nonzero-exit", code });
      }
    });
  });
}
