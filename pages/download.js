import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/download.module.css";
// import Snowfall from "react-snowfall";

export default function DownloadPage() {
  const router = useRouter();
  const { session } = router.query;

  const [ready, setReady] = useState(false);
  const [qr, setQr] = useState(null);
  const [countdown, setCountdown] = useState(30);

  /** 세션 유효성 확인 (사진은 파일 URL 로 직접 로드) */
  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/download?session=${session}`);
        if (!res.ok) throw new Error("접근 불가");

        const data = await res.json();
        setQr(data.qr_code);
        setReady(true);
      } catch (err) {
        console.error(err);
        router.replace("/forbidden");
      }
    };

    fetchData();
  }, [session, router]);

  /** 30초 카운트다운 */
  useEffect(() => {
    if (countdown <= 0) {
      router.replace("/");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <>
      <Head>
        <title>사진 보기</title>
        <meta charSet="UTF-8" />
      </Head>

      <div className={styles.about}>
        {/* <Snowfall color="#82C3D9" /> */}
        <div className={styles.notificationBar}>
          {countdown}초 후 자동으로 닫힙니다
        </div>

        {qr && (
          <div className={styles.mb6}>
            <img
              src={qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`}
              alt="QR Code"
              className={styles.qr}
            />
          </div>
        )}

        {ready && (
          <div className={styles.mb6}>
            <img
              src={`/api/gallery/get_image?session=${session}`}
              alt="Selected Photo"
              className={styles.photo}
            />
          </div>
        )}

        <button className={styles.homeButton} onClick={() => router.push("/")}>
          홈으로 돌아가기
        </button>
      </div>
    </>
  );
}
