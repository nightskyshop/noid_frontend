import Head from "next/head";
import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import styles from "../styles/take_photo-1.module.css";
import Snowfall from "react-snowfall";

export default function TakePhoto1() {
  const router = useRouter();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const setupCamera = useCallback(async () => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    if (!videoEl || !canvasEl) return null;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = stream;

    await new Promise((resolve, reject) => {
      videoEl.onloadedmetadata = () => {
        videoEl.play();
        canvasEl.width = videoEl.videoWidth || canvasEl.clientWidth;
        canvasEl.height = videoEl.videoHeight || canvasEl.clientHeight;
        resolve();
      };
      videoEl.onerror = reject;
    });

    streamRef.current = stream;
    return stream;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await setupCamera();
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [setupCamera]);

  const goNext = useCallback(() => {
    const frame = router.query.frame;
    const target = frame ? `/take_photo-2?frame=${frame}` : "/take_photo-2";
    router.push(target);
  }, [router]);

  return (
    <>
      <Head>
        <title>촬영 준비</title>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className={styles.page}>
        <Snowfall color="#82C3D9" />
        <div className={styles.photoView}>
          <video
            className={styles.video}
            ref={videoRef}
            autoPlay
            playsInline
            muted
          />
          <canvas className={styles.overlay} ref={canvasRef} />
        </div>
        <div className={styles.buttonWrapper}>
          <div className={styles.buttonText} onClick={goNext}>
            촬영 시작하기 →
          </div>
        </div>
      </div>
    </>
  );
}
