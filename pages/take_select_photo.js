import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/take_select_photo.module.css";
import Snowfall from "react-snowfall";

// ===== 업로드 예외 처리 설정 =====
const UPLOAD_TIMEOUT_MS = 90000; // 한 번의 시도 제한 시간 (느린 WiFi 대비)
const MAX_AUTO_RETRIES = 3; // 자동 재시도 횟수
const RETRY_BACKOFF_MS = [1500, 3000, 5000]; // 각 재시도 전 대기(백오프)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * XHR 기반 업로드 — fetch 와 달리 업로드 진행률/타임아웃/중단을 지원.
 * 실패 시 { type, status, message } 형태로 reject.
 */
function uploadWithProgress(formData, { timeout, onProgress, registerAbort }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.timeout = timeout;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          resolve({});
        }
      } else {
        let message = `서버 오류 (${xhr.status})`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body?.message) message = body.message;
        } catch {}
        reject({ type: "http", status: xhr.status, message });
      }
    };

    xhr.onerror = () =>
      reject({ type: "network", message: "네트워크 연결에 실패했습니다." });
    xhr.ontimeout = () =>
      reject({ type: "timeout", message: "업로드 시간이 초과되었습니다." });
    xhr.onabort = () => reject({ type: "abort", message: "업로드를 취소했습니다." });

    // 취소 핸들러 등록 (부모가 abort 할 수 있도록)
    registerAbort?.(() => xhr.abort());

    xhr.send(formData);
  });
}

// 재시도해도 의미 있는 오류인지 (4xx 검증 오류는 재시도 무의미)
function isRetryable(err) {
  if (!err) return false;
  if (err.type === "timeout" || err.type === "network") return true;
  if (err.type === "http" && err.status >= 500) return true;
  return false;
}

export default function TakeSelectPhoto() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState(new Set());

  // 업로드 상태 머신: idle | uploading | error
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [attempt, setAttempt] = useState(0); // 현재 시도 번호(1부터)
  const [errorMsg, setErrorMsg] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  const abortRef = useRef(null); // 현재 진행 중 업로드 중단 함수
  const cancelledRef = useRef(false); // 사용자가 취소했는지

  useEffect(() => {
    const storedPhotos = JSON.parse(
      localStorage.getItem("capturedPhotos") || "[]"
    );
    setPhotos(storedPhotos);
  }, []);

  // 온라인/오프라인 감지
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const base64toFile = useCallback((base64Data, filename) => {
    const arr = base64Data.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }

    return new File([u8arr], filename, { type: mime });
  }, []);

  const handlePhotoClick = useCallback(
    (idx) => {
      if (status === "uploading") return; // 업로드 중 선택 변경 금지
      setSelectedIndexes((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) {
          next.delete(idx);
        } else {
          if (next.size >= 4) {
            alert("최대 4개의 사진만 선택할 수 있습니다.");
            return prev;
          }
          next.add(idx);
        }
        return next;
      });
    },
    [status]
  );

  // 선택된 사진으로 FormData 구성 (재시도 시 매번 새로 생성)
  const buildFormData = useCallback(
    (uploadToGallery) => {
      const selectedPhotos = Array.from(selectedIndexes)
        .sort((a, b) => a - b)
        .map((idx) => photos[idx]);

      if (selectedPhotos.length !== 4) return null;

      const formData = new FormData();
      formData.append("session", localStorage.getItem("session"));
      formData.append("upload", String(uploadToGallery));
      selectedPhotos.forEach((base64, index) => {
        const file = base64toFile(base64, `photo${index + 1}.png`);
        formData.append(`photo${index + 1}`, file);
      });
      return formData;
    },
    [selectedIndexes, photos, base64toFile]
  );

  // 자동 재시도를 포함한 업로드 실행
  const runUpload = useCallback(
    async (uploadToGallery) => {
      cancelledRef.current = false;
      setStatus("uploading");
      setErrorMsg("");

      let lastErr = null;

      for (let i = 0; i <= MAX_AUTO_RETRIES; i++) {
        if (cancelledRef.current) return;

        // 오프라인이면 온라인 복구까지 잠시 대기
        if (!navigator.onLine) {
          setErrorMsg("네트워크 연결을 확인하는 중...");
          await sleep(2000);
          if (cancelledRef.current) return;
          if (!navigator.onLine) {
            lastErr = { type: "network", message: "오프라인 상태입니다." };
            continue;
          }
        }

        setAttempt(i + 1);
        setProgress(0);
        setErrorMsg("");

        const formData = buildFormData(uploadToGallery);
        if (!formData) {
          setStatus("idle");
          alert("정확히 4개의 사진을 선택해야 합니다.");
          return;
        }

        try {
          const data = await uploadWithProgress(formData, {
            timeout: UPLOAD_TIMEOUT_MS,
            onProgress: setProgress,
            registerAbort: (fn) => (abortRef.current = fn),
          });

          if (data?.result === false) {
            // 서버가 명시적으로 실패를 반환 (예: 세션 만료) — 재시도 무의미
            setStatus("error");
            setErrorMsg(data.message || "업로드에 실패했습니다.");
            return;
          }

          // 성공
          setProgress(100);
          const sessionId = localStorage.getItem("session");
          router.push(`/download?session=${sessionId}`);
          return;
        } catch (err) {
          lastErr = err;

          if (err?.type === "abort" || cancelledRef.current) {
            setStatus("idle");
            return;
          }

          if (isRetryable(err) && i < MAX_AUTO_RETRIES) {
            const wait = RETRY_BACKOFF_MS[i] ?? 5000;
            setErrorMsg(
              `${err.message} 잠시 후 다시 시도합니다... (${i + 1}/${MAX_AUTO_RETRIES})`
            );
            await sleep(wait);
            continue;
          }

          // 재시도 불가하거나 재시도 소진
          break;
        }
      }

      setStatus("error");
      setErrorMsg(
        (lastErr?.message || "업로드에 실패했습니다.") +
          " 네트워크 상태를 확인한 뒤 다시 시도해주세요."
      );
    },
    [buildFormData, router]
  );

  const handleUpload = useCallback(() => {
    if (status === "uploading") return;

    const selectedCount = selectedIndexes.size;
    if (selectedCount !== 4) {
      alert("정확히 4개의 사진을 선택해야 합니다.");
      return;
    }

    runUpload(false);
  }, [status, selectedIndexes, runUpload]);

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
    abortRef.current?.();
    setStatus("idle");
    setProgress(0);
  }, []);

  const handleRetry = useCallback(() => {
    // 갤러리 업로드 여부는 최초 선택을 다시 묻기보다 false 로 재시도 (필요 시 조정)
    runUpload(false);
  }, [runUpload]);

  const isUploading = status === "uploading";

  return (
    <>
      <Head>
        <title>사진 선택</title>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className={styles.page}>
        <Snowfall color="#82C3D9" />

        {/* 오프라인 배너 */}
        {!isOnline && (
          <div style={ovl.offlineBanner}>
            ⚠️ 인터넷 연결이 끊겼습니다. 연결되면 자동으로 진행됩니다.
          </div>
        )}

        <div className={styles.container}>
          {photos.slice(0, 6).map((photo, idx) => (
            <div
              key={idx}
              className={`${styles.photoSlot} ${
                selectedIndexes.has(idx) ? styles.selected : ""
              }`}
              onClick={() => handlePhotoClick(idx)}
            >
              {photo && <img src={photo} alt={`photo-${idx + 1}`} />}
            </div>
          ))}
        </div>

        <div className={styles.sidePanel}>
          <div className={styles.instruction}>
            사진 4개를 선택 후
            <br />
            사진뽑기 버튼을 누르세요!
          </div>
          <div className={styles.buttonWrapper}>
            <div
              className={`${styles.button} ${
                isUploading ? styles.buttonUploading : ""
              }`}
              onClick={handleUpload}
            >
              {isUploading ? "업로드중..." : "사진뽑기 →"}
            </div>
          </div>
        </div>
      </div>

      {/* ===== 업로드 진행 오버레이 ===== */}
      {isUploading && (
        <div style={ovl.backdrop}>
          <div style={ovl.card}>
            <div style={ovl.spinner} />
            <div style={ovl.title}>사진을 업로드하고 있어요</div>
            <div style={ovl.subtitle}>
              {attempt > 1 ? `재시도 중 (${attempt - 1}/${MAX_AUTO_RETRIES})` : "잠시만 기다려주세요"}
            </div>

            <div style={ovl.progressTrack}>
              <div style={{ ...ovl.progressBar, width: `${progress}%` }} />
            </div>
            <div style={ovl.progressText}>{progress}%</div>

            {errorMsg && <div style={ovl.hint}>{errorMsg}</div>}

            <button style={ovl.cancelBtn} onClick={handleCancel}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* ===== 업로드 실패 오버레이 ===== */}
      {status === "error" && (
        <div style={ovl.backdrop}>
          <div style={ovl.card}>
            <div style={ovl.errorIcon}>⚠️</div>
            <div style={ovl.title}>업로드에 실패했어요</div>
            <div style={ovl.errorText}>{errorMsg}</div>

            <button style={ovl.retryBtn} onClick={handleRetry}>
              다시 시도
            </button>
            <button
              style={ovl.textBtn}
              onClick={() => {
                setStatus("idle");
                setErrorMsg("");
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes noid-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

// 기존 CSS 모듈을 건드리지 않도록 오버레이는 인라인 스타일로 분리
const ovl = {
  offlineBanner: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    padding: "10px 16px",
    background: "#FF6B6B",
    color: "#fff",
    textAlign: "center",
    fontSize: 14,
    zIndex: 3000,
    boxSizing: "border-box",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 4000,
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    background: "#fff",
    borderRadius: 24,
    padding: "32px 24px",
    textAlign: "center",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    fontFamily: "inherit",
  },
  spinner: {
    width: 48,
    height: 48,
    margin: "0 auto 20px",
    border: "5px solid #e6e6e6",
    borderTopColor: "#82C3D9",
    borderRadius: "50%",
    animation: "noid-spin 0.9s linear infinite",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#333",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: "#888",
    marginBottom: 20,
  },
  progressTrack: {
    width: "100%",
    height: 10,
    background: "#eee",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    background: "linear-gradient(90deg,#82C3D9,#5AA9C7)",
    borderRadius: 999,
    transition: "width 0.25s ease",
  },
  progressText: {
    fontSize: 13,
    color: "#555",
    marginTop: 8,
    fontWeight: 600,
  },
  hint: {
    fontSize: 12,
    color: "#FF6B6B",
    marginTop: 14,
    lineHeight: 1.5,
  },
  cancelBtn: {
    marginTop: 22,
    padding: "10px 24px",
    borderRadius: 999,
    border: "1px solid #ddd",
    background: "#fff",
    color: "#666",
    fontSize: 14,
    cursor: "pointer",
  },
  errorIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 1.6,
    marginTop: 8,
    marginBottom: 24,
  },
  retryBtn: {
    display: "block",
    width: "100%",
    padding: "14px",
    borderRadius: 999,
    border: "none",
    background: "#82C3D9",
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
  textBtn: {
    marginTop: 12,
    padding: "8px",
    border: "none",
    background: "none",
    color: "#999",
    fontSize: 14,
    cursor: "pointer",
    width: "100%",
  },
};
