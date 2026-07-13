import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/take_select_photo.module.css";
// import Snowfall from "react-snowfall";

/**
 * XHR 기반 업로드 — fetch 와 달리 업로드 진행률/중단을 지원.
 * 로컬(같은 기기) 통신이라 네트워크 타임아웃/재시도는 두지 않는다.
 * 실패 시 { type, status, message, body, raw } 형태로 reject (원인 파악용 상세 포함).
 */
function uploadWithProgress(formData, { onProgress, registerAbort }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

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
        let body = null;
        try {
          body = JSON.parse(xhr.responseText);
          if (body?.message) message = body.message;
        } catch {}
        reject({
          type: "http",
          status: xhr.status,
          message,
          body,
          raw: xhr.responseText,
        });
      }
    };

    // 요청 자체가 실패한 경우 (로컬이라 드묾) — 원인 파악용으로만 처리
    xhr.onerror = () =>
      reject({ type: "request", message: "업로드 요청에 실패했습니다." });
    xhr.onabort = () => reject({ type: "abort", message: "업로드를 취소했습니다." });

    // 취소 핸들러 등록 (부모가 abort 할 수 있도록)
    registerAbort?.(() => xhr.abort());

    xhr.send(formData);
  });
}

export default function TakeSelectPhoto() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState(new Set());

  // 업로드 상태 머신: idle | uploading | error
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const abortRef = useRef(null); // 현재 진행 중 업로드 중단 함수
  const cancelledRef = useRef(false); // 사용자가 취소했는지

  // localStorage 는 서버에 없으므로 SSR 결과(빈 배열)와 첫 클라이언트 렌더를
  // 일치시킨 뒤 마운트 후에만 읽어야 하이드레이션 불일치가 생기지 않는다.
  useEffect(() => {
    const storedPhotos = JSON.parse(
      localStorage.getItem("capturedPhotos") || "[]"
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhotos(storedPhotos);
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
      // 프레임 선택 화면에서 고른 인쇄 매수 (없으면 1)
      formData.append("copies", localStorage.getItem("printCopies") || "1");
      selectedPhotos.forEach((base64, index) => {
        const file = base64toFile(base64, `photo${index + 1}.png`);
        formData.append(`photo${index + 1}`, file);
      });
      return formData;
    },
    [selectedIndexes, photos, base64toFile]
  );

  // 업로드 실행 (로컬 통신 — 단일 시도). 실패하면 콘솔에 원인을 상세히 남긴다.
  const runUpload = useCallback(
    async (uploadToGallery) => {
      cancelledRef.current = false;
      setStatus("uploading");
      setErrorMsg("");
      setProgress(0);

      const formData = buildFormData(uploadToGallery);
      if (!formData) {
        setStatus("idle");
        alert("정확히 4개의 사진을 선택해야 합니다.");
        return;
      }

      try {
        const data = await uploadWithProgress(formData, {
          onProgress: setProgress,
          registerAbort: (fn) => (abortRef.current = fn),
        });

        if (data?.result === false) {
          // 서버가 명시적으로 실패를 반환 (예: 세션 만료, 파일 처리 오류)
          console.error("[업로드 실패] 서버가 실패 응답을 반환했습니다:", data);
          setStatus("error");
          setErrorMsg(data.message || "업로드에 실패했습니다.");
          return;
        }

        // 성공
        setProgress(100);
        const sessionId = localStorage.getItem("session");
        router.push(`/download?session=${sessionId}`);
      } catch (err) {
        if (err?.type === "abort" || cancelledRef.current) {
          setStatus("idle");
          return;
        }

        // 무슨 문제인지 콘솔에 상세 로그 출력 (디버깅용)
        console.error("[업로드 실패] 원인:", {
          type: err?.type,
          status: err?.status,
          message: err?.message,
          serverBody: err?.body,
          rawResponse: err?.raw,
          error: err,
        });

        setStatus("error");
        setErrorMsg(err?.message || "업로드에 실패했습니다.");
      }
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
        {/* <Snowfall color="#82C3D9" /> */}

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
            <div style={ovl.subtitle}>잠시만 기다려주세요</div>

            <div style={ovl.progressTrack}>
              <div style={{ ...ovl.progressBar, width: `${progress}%` }} />
            </div>
            <div style={ovl.progressText}>{progress}%</div>

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
