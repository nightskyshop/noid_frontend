// Flask app.py의 "/" (index.html) 포팅 — 사진 갤러리
import Head from "next/head";
import { useEffect } from "react";
import { getGalleryDb } from "../../lib/galleryDb";

const PER_PAGE = 10;

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
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const db = await getGalleryDb();

  const { c: total } = await db.get(
    "SELECT COUNT(*) AS c FROM photos WHERE upload = 1"
  );
  const totalPages = Math.ceil(total / PER_PAGE);

  const rows = await db.all(
    `SELECT * FROM photos WHERE upload = 1 ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    PER_PAGE,
    (page - 1) * PER_PAGE
  );
  await db.close();

  const photos = rows.map((r) => ({
    id: r.id,
    createdAt: fmtDate(r.createdAt),
  }));

  return { props: { photos, page, totalPages } };
}

const STYLE = `
      @font-face {
        font-family: 'PartialSans';
        src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2307-1@1.1/PartialSansKR-Regular.woff2') format('woff2');
        font-weight: normal;
        font-display: swap;
      }

      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-1Thin.woff') format('woff'); font-weight: 100; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-2ExtraLight.woff') format('woff'); font-weight: 200; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-3Light.woff') format('woff'); font-weight: 300; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-4Regular.woff') format('woff'); font-weight: normal; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-5Medium.woff') format('woff'); font-weight: 500; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-6Bold.woff') format('woff'); font-weight: 600; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-7ExtraBold.woff') format('woff'); font-weight: 700; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-8Heavy.woff') format('woff'); font-weight: 800; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-9Black.woff') format('woff'); font-weight: 900; font-display: swap; }

      body { font-family: Escoredream; margin: 0; padding: 20px; background: url('/static/images/background.svg'); background-repeat: no-repeat; background-size: cover; margin-bottom: 95px; }
      a { text-decoration: none; color: auto; }
      h1 { text-align: center; font-family: PartialSans; color: #FD7979; font-weight: normal; margin-bottom: 20px; margin-top: 0; }
      .top-buttons { display: flex; justify-content: center; margin-bottom: 20px; }
      .like-button { padding: 10px 18px; background: #fff5; border: 1px solid #fffa; color: #FF3F32; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); text-decoration: none; border-radius: 20px; font-size: 14px; font-weight: bold; transition: transform 0.15s, box-shadow 0.15s; }
      .like-button:hover { transform: translateY(-2px); }
      .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto; }
      .photo-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); text-align: center; padding-bottom: 10px; }
      .photo-card img { width: 100%; display: block; border-radius: 20px; }
      .photo-card .date { font-size: 12px; color: #666; margin-top: 6px; }
      .pagination { position: fixed; bottom: 20px; left: 0; width: 100vw; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
      .pagination a { padding: 6px 12px; text-decoration: none; color: #333; border-radius: 30px; background: #fff5; border: 1px solid #fffa; transition: background 0.15s; }
      .pagination a:hover { background: #fffa; }
      .pagination .active { background: #000a; color: white; pointer-events: none; border-color: #000a; }
      .pagination-inner { display: flex; background: #fff5; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); padding: 20px; border-radius: 1000px; gap: 5px; border: 1px solid #fffa; }
      .popup { width: calc(100% - 40px); height: calc(100% - 20px); max-width: 480px; max-height: 700px; position: fixed; bottom: 0px; left: 0px; background: #fffa; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); margin-top: 20px; margin: 0px 20px; display: flex; justify-content: center; align-items: center; border-radius: 20px 20px 0 0; z-index: 1000; display: block; bottom: -200%; transition: bottom 0.6s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0px 0px 10px #0002; touch-action: none; }
      .popup.dragging { transition: none; }
      .popup-handle { width: 100%; height: 30px; display: flex; justify-content: center; align-items: center; cursor: grab; position: absolute; top: 0; left: 0; z-index: 1001; }
      .popup-handle::after { content: ''; width: 40px; height: 5px; background: #0003; border-radius: 3px; }
      .popup embed { width: 100%; height: 100%; border-radius: 20px 20px 0 0; }
      #popupbg { background: #fff5; position: fixed; top: 0; left: 0; width: 100%; height: 100%; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display: none; }
      footer { width: calc(100%); text-align: center; padding: 20px 0px 0px 0px; color: #FD7979; }
`;

export default function Gallery({ photos, page, totalPages }) {
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    window.openpopup = function (session) {
      document.querySelector(".popup embed").src = `/gallery/photo?session=${session}`;
      document.querySelector("#popupbg").style.display = "block";
      document.querySelector(".popup").style.bottom = "0px";
      document.querySelector(".popup").style.transform = "translateY(0)";
      document.querySelector("body").style.overflow = "hidden";
    };

    window.closepopup = function () {
      const popup = document.querySelector(".popup");
      popup.style.bottom = "-200%";
      popup.style.transform = "translateY(0)";
      document.querySelector("#popupbg").style.display = "none";
      document.querySelector("body").style.overflow = "auto";
    };

    const popup = document.querySelector(".popup");
    const handle = document.querySelector(".popup-handle");

    const onStart = (e) => {
      startY = e.touches[0].clientY;
      isDragging = true;
      popup.classList.add("dragging");
    };
    const onMove = (e) => {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      let deltaY = currentY - startY;
      if (deltaY < 0) deltaY = 0;
      popup.style.transform = `translateY(${deltaY}px)`;
    };
    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      popup.classList.remove("dragging");
      const deltaY = currentY - startY;
      if (deltaY > 150) window.closepopup();
      else popup.style.transform = "translateY(0)";
    };

    handle.addEventListener("touchstart", onStart, { passive: true });
    handle.addEventListener("touchmove", onMove, { passive: true });
    handle.addEventListener("touchend", onEnd);

    return () => {
      handle.removeEventListener("touchstart", onStart);
      handle.removeEventListener("touchmove", onMove);
      handle.removeEventListener("touchend", onEnd);
    };
  }, []);

  return (
    <>
      <Head>
        <title>NOID Gallery</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      </Head>

      <h1>
        <span style={{ color: "black" }}>NOID</span>
        <br />
        Photo Gallery
      </h1>

      <div className="top-buttons">
        <a href="/gallery/likes" className="like-button">
          ❤️ 좋아요 순 보기
        </a>
      </div>

      <div className="gallery">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="photo-card"
            onClick={() => window.openpopup(photo.id)}
            style={{ cursor: "pointer" }}
          >
            <img src={`/api/gallery/get_image?session=${photo.id}`} alt="photo" />
            <div className="date">{photo.createdAt}</div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <div className="pagination-inner">
          {page > 1 && <a href={`/gallery?page=${page - 1}`}>이전</a>}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/gallery?page=${p}`}
              className={p === page ? "active" : ""}
            >
              {p}
            </a>
          ))}
          {page < totalPages && <a href={`/gallery?page=${page + 1}`}>다음</a>}
        </div>
      </div>

      <div id="popup" className="popup">
        <div className="popup-handle"></div>
        <embed src="" />
      </div>
      <div id="popupbg" onClick={() => window.closepopup()}></div>
      <footer>
        ©NOID
        <br />
        Designed by Jiheum
      </footer>
    </>
  );
}
