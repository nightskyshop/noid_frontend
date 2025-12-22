import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/take_photo-2.module.css";
import Snowfall from "react-snowfall";

export default function TakePhoto2() {
  const router = useRouter();
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const flashRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);

  const [scriptReady, setScriptReady] = useState(false);
  const [counterText, setCounterText] = useState("잠시만 기다려 주세요...");
  const [error, setError] = useState("");
  const [photosTaken, setPhotosTaken] = useState(0);
  const [thumbs, setThumbs] = useState(Array(6).fill(null));
  const [buttonActive, setButtonActive] = useState(false);

  const capturedPhotosRef = useRef([]);
  const faceApiRef = useRef(null);
  const photosTakenRef = useRef(0);
  const sessionCreatedRef = useRef(false);

  const flashEffect = useCallback(() => {
    const flash = flashRef.current;
    if (!flash) return;
    flash.style.opacity = "1";
    setTimeout(() => {
      flash.style.opacity = "0";
    }, 100);
  }, []);

  const setupCamera = useCallback(async () => {
    const videoEl = videoRef.current;
    const overlayEl = overlayRef.current;
    if (!videoEl || !overlayEl) return;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = stream;

    await new Promise((resolve, reject) => {
      videoEl.onloadedmetadata = () => {
        videoEl.play();
        overlayEl.width = videoEl.videoWidth || overlayEl.clientWidth;
        overlayEl.height = videoEl.videoHeight || overlayEl.clientHeight;
        resolve();
      };
      videoEl.onerror = reject;
    });

    streamRef.current = stream;
  }, []);

  const loadModels = useCallback(async () => {
    const faceapi = faceApiRef.current;
    if (!faceapi) {
      throw new Error("face-api.js 로드 실패");
    }
    const modelUrl = "/models";
    await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelUrl);
  }, []);

  const startFaceLoop = useCallback(() => {
    const videoEl = videoRef.current;
    const overlayEl = overlayRef.current;
    const faceapi = faceApiRef.current;
    if (!videoEl || !overlayEl || !faceapi) return;

    const ctx = overlayEl.getContext("2d");
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 256,
      scoreThreshold: 0.5,
    });

    const loop = async () => {
      if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
        await faceapi
          .detectSingleFace(videoEl, options)
          .withFaceLandmarks(true);

        ctx.clearRect(0, 0, overlayEl.width, overlayEl.height);
      }
      animationRef.current = requestAnimationFrame(loop);
    };

    loop();
  }, []);

  const startCountdown = useCallback((seconds, onFinish, currentIndex) => {
    let remaining = seconds;
    const updateText = () => {
      setCounterText(`📸 ${currentIndex + 1}번째 촬영까지 ${remaining}초`);
    };

    updateText();
    const intervalId = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        updateText();
      } else {
        clearInterval(intervalId);
        setCounterText(`📸 ${currentIndex + 1}번째 촬영 중...`);
        onFinish();
      }
    }, 1000);
  }, []);

  const takePhoto = useCallback(async () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const currentIndex = photosTakenRef.current;
    if (currentIndex >= 6) {
      setCounterText("촬영 완료! 저장 중...");
      localStorage.setItem(
        "capturedPhotos",
        JSON.stringify(capturedPhotosRef.current)
      );
      setButtonActive(true);
      return;
    }

    flashEffect();

    const canvas = document.createElement("canvas");
    const targetRatio = 10 / 13;

    let canvasWidth;
    let canvasHeight;
    if (videoEl.videoWidth / videoEl.videoHeight > targetRatio) {
      canvasHeight = videoEl.videoHeight;
      canvasWidth = canvasHeight * targetRatio;
    } else {
      canvasWidth = videoEl.videoWidth;
      canvasHeight = canvasWidth / targetRatio;
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    const sourceX = (videoEl.videoWidth - canvasWidth) / 2;
    const sourceY = (videoEl.videoHeight - canvasHeight) / 2;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(
      videoEl,
      sourceX,
      sourceY,
      canvasWidth,
      canvasHeight,
      0,
      0,
      canvasWidth,
      canvasHeight
    );

    const dataURL = canvas.toDataURL("image/png");
    capturedPhotosRef.current = [...capturedPhotosRef.current, dataURL];
    setThumbs((prev) => {
      const next = [...prev];
      next[currentIndex] = dataURL;
      return next;
    });
    const nextCount = currentIndex + 1;
    photosTakenRef.current = nextCount;
    setPhotosTaken(nextCount);

    if (nextCount < 6) {
      startCountdown(
        8,
        () => {
          takePhoto();
        },
        nextCount
      );
    } else {
      setCounterText("촬영 완료! 저장 중...");
      localStorage.setItem(
        "capturedPhotos",
        JSON.stringify(capturedPhotosRef.current)
      );
      setButtonActive(true);
    }
  }, [flashEffect, startCountdown]);

  // face-api.js를 npm 패키지에서 동적으로 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const faceapi = await import("face-api.js");
        if (!mounted) return;
        faceApiRef.current = faceapi;
        setScriptReady(true);
      } catch (e) {
        console.error("face-api.js 로드 실패:", e);
        setError("face-api.js를 불러오지 못했습니다.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 세션 생성은 한 번만 실행
  useEffect(() => {
    if (!scriptReady || sessionCreatedRef.current) return;
    const frame = router.query.frame ?? "";
    if (!frame) return;

    sessionCreatedRef.current = true;

    fetch("/api/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ frame }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("서버 응답 실패");
        return response.json();
      })
      .then((data) => {
        localStorage.setItem("session", data.sessionID);
      })
      .catch((err) => {
        console.error("session 생성 실패:", err);
        alert("session 생성 중 오류 발생.");
        sessionCreatedRef.current = false; // 실패 시 재시도 가능하도록
      });
  }, [scriptReady, router.query.frame]);

  // 카메라 초기화 및 촬영 시작
  useEffect(() => {
    if (!scriptReady) return;
    let cancelled = false;

    (async () => {
      try {
        await setupCamera();
        await loadModels();
        await startFaceLoop();

        // 5초 대기 후 첫 카운트다운 및 촬영 시작
        setTimeout(() => {
          if (cancelled) return;

          startCountdown(
            8,
            () => {
              takePhoto();
            },
            0
          );
        }, 5000);
      } catch (e) {
        console.error("초기화 실패:", e);
        setCounterText("초기화 실패");
        setError("카메라 또는 얼굴 인식 초기화에 실패했습니다.");
      }
    })();

    return () => {
      cancelled = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [
    loadModels,
    setupCamera,
    startCountdown,
    startFaceLoop,
    scriptReady,
    takePhoto,
  ]);

  const handleContinue = useCallback(() => {
    if (!buttonActive) return;
    router.push("/take_select_photo");
  }, [buttonActive, router]);

  return (
    <>
      <Head>
        <title>촬영 중...</title>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className={styles.page}>
        <Snowfall color="#82C3D9" />
        <div ref={flashRef} className={styles.flash} />

        <div className={styles.counter}>{counterText}</div>

        <div className={styles.photoView}>
          <video
            ref={videoRef}
            className={styles.video}
            autoPlay
            playsInline
            muted
          />
          <canvas ref={overlayRef} className={styles.overlay} />
        </div>

        <div className={styles.container}>
          {thumbs.map((src, idx) => (
            <div key={idx} className={styles.thumbSlot}>
              {src && <img src={src} alt={`preview-${idx + 1}`} />}
            </div>
          ))}
        </div>

        <div className={styles.buttonWrapper} />
        <div
          className={`${styles.buttonText} ${
            buttonActive ? styles.buttonTextActive : ""
          }`}
          onClick={handleContinue}
        >
          계속하기 →
        </div>

        {error && <p className={styles.errorText}>{error}</p>}
      </div>
    </>
  );
}
