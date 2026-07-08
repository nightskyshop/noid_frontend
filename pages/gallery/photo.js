// Flask app.py의 /photo (photo.html) 포팅 — 단일 사진 (갤러리 팝업 embed 대상)
import Head from "next/head";
import { getGalleryDb } from "../../lib/galleryDb";
import { imagePath } from "../../lib/galleryDb";
import fs from "fs";

function fmtDate(v) {
  if (!v) return "";
  const d = new Date(String(v).replace(" ", "T"));
  if (isNaN(d)) return String(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}`;
}

export async function getServerSideProps({ query }) {
  const session = query.session;
  if (!session) return { notFound: true };

  if (!fs.existsSync(imagePath(session))) return { notFound: true };

  const db = await getGalleryDb();
  const row = await db.get("SELECT * FROM photos WHERE id = ?", session);
  await db.close();

  return {
    props: {
      session,
      createdAt: fmtDate(row?.createdAt),
      like: row?.like ?? 0,
    },
  };
}

const STYLE = `
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
      body { background: white; min-height: 100vh; justify-content: center; align-items: center; }
      .photo-container { width: 100%; max-width: 480px; background: transparent; overflow: hidden; }
      .photo-image img { width: 100%; display: block; border-radius: 20px; }
      .photo-info { padding: 10px; }
      .photo-date { font-size: 14px; color: #666; }
      .photo-session { font-size: 12px; color: #aaa; margin-top: 4px; }
      .like-box { margin-top: 12px; display: flex; align-items: center; gap: 10px; }
      .like-btn { padding: 8px 14px; border: 2px solid #ff4d4f; background: none; color: #ff4d4f; border-radius: 20px; cursor: pointer; font-size: 14px; transition: background 0.15s; }
      .like-btn:hover { background: #ff4d4f; color: #fff; }
      .like-count { font-size: 14px; color: #333; }
      .back-btn { display: inline-block; padding: 10px 16px; background: #000; color: #fff; border-radius: 10px; text-decoration: none; font-size: 14px; position: fixed; bottom: 10px; right: 10px; border: 1px solid #fffa; cursor: pointer; }
`;

export default function Photo({ session, createdAt, like }) {
  async function likePhoto() {
    const res = await fetch("/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    });
    const data = await res.json();
    if (data.result) {
      document.getElementById("like-count").innerText = data.like;
    } else {
      alert("좋아요 실패");
    }
  }

  return (
    <>
      <Head>
        <title>Photo</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      </Head>

      <div className="photo-container">
        <div className="photo-image">
          <img src={`/api/gallery/get_image?session=${session}`} alt="photo" />
        </div>

        <div className="photo-info">
          <div className="photo-date">{createdAt}</div>

          <div className="like-box">
            <button className="like-btn" onClick={likePhoto}>
              ❤️ 좋아요 <span id="like-count">{like}</span>
            </button>
          </div>
        </div>
        <a
          onClick={() => window.parent.closepopup && window.parent.closepopup()}
          className="back-btn"
        >
          ← 목록으로
        </a>
      </div>
    </>
  );
}
