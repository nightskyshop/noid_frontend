import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/take_select_photo.module.css";
import Snowfall from "react-snowfall";

export default function TakeSelectPhoto() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [selectedIndexes, setSelectedIndexes] = useState(new Set());
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const storedPhotos = JSON.parse(
      localStorage.getItem("capturedPhotos") || "[]"
    );
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

  const handlePhotoClick = useCallback((idx) => {
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
  }, []);

  const handleUpload = useCallback(async () => {
    if (isUploading) return;

    const selectedPhotos = Array.from(selectedIndexes)
      .sort((a, b) => a - b)
      .map((idx) => photos[idx]);

    if (selectedPhotos.length !== 4) {
      alert("정확히 4개의 사진을 선택해야 합니다.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      const session = localStorage.getItem("session");
      const uploadToGallery = confirm("노이드 갤러리에 사진을 업로드할까요?");
      console.log("uploadToGallery " + uploadToGallery);

      formData.append("session", session);
      formData.append("upload", String(uploadToGallery));

      selectedPhotos.forEach((base64, index) => {
        const file = base64toFile(base64, `photo${index + 1}.png`);
        formData.append(`photo${index + 1}`, file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("서버 응답 실패");
      }

      const data = await response.json();
      alert("업로드 완료!");

      const sessionId = localStorage.getItem("session");
      router.push(`/download?session=${sessionId}`);
    } catch (error) {
      console.error("업로드 실패:", error);
      alert("업로드 중 오류가 발생했습니다.");
      setIsUploading(false);
    }
  }, [selectedIndexes, photos, isUploading, base64toFile, router]);

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
    </>
  );
}
