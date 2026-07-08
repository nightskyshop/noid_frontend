// Flask app.py의 /download (download.html) 포팅 — QR 스캔 후 사진 다운로드 페이지
import Head from "next/head";
import { getGalleryDb } from "../../lib/galleryDb";
import { imagePath } from "../../lib/galleryDb";
import fs from "fs";

export async function getServerSideProps({ query }) {
  const session = query.session;
  if (!session) return { notFound: true };
  if (!fs.existsSync(imagePath(session))) return { notFound: true };

  // 세션이 DB에 있는지 확인 (Flask는 파일 존재만 확인하지만 안전하게 유지)
  const db = await getGalleryDb();
  await db.get("SELECT id FROM photos WHERE id = ?", session);
  await db.close();

  return { props: { session } };
}

const STYLE = `
      @font-face { font-family: 'PartialSans'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2307-1@1.1/PartialSansKR-Regular.woff2') format('woff2'); font-weight: normal; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-1Thin.woff') format('woff'); font-weight: 100; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-2ExtraLight.woff') format('woff'); font-weight: 200; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-3Light.woff') format('woff'); font-weight: 300; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-4Regular.woff') format('woff'); font-weight: normal; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-5Medium.woff') format('woff'); font-weight: 500; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-6Bold.woff') format('woff'); font-weight: 600; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-7ExtraBold.woff') format('woff'); font-weight: 700; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-8Heavy.woff') format('woff'); font-weight: 800; font-display: swap; }
      @font-face { font-family: 'Escoredream'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_six@1.2/S-CoreDream-9Black.woff') format('woff'); font-weight: 900; font-display: swap; }

      body { font-family: Escoredream; background: url('/static/images/download.svg'); background-repeat: no-repeat; background-size: cover; margin: 0; padding: 0; color: #89986D; display: flex; justify-content: center; align-items: center; height: 100vh; }
      .container { text-align: center; }
      h1 { font-family: PartialSans; font-weight: normal; }
      img { max-width: 90vw; max-height: 70vh; border-radius: 12px; margin-bottom: 20px; }
      a.button { display: inline-block; padding: 12px 24px; background: #fff5; border: 1px solid #fffa; color: #89986D; width: calc(100% - 48px); text-decoration: none; border-radius: 100px; font-weight: bold; transition: scale 0.15s; margin-bottom: 10px; }
      a.button:hover { scale: 1.1; }
`;

export default function Download({ session }) {
  return (
    <>
      <Head>
        <title>사진 다운로드</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      </Head>

      <div className="container">
        <h1>
          Download
          <br />
          Photo
        </h1>

        <img src={`/api/gallery/get_image?session=${session}`} alt="photo" />

        <br />

        <a
          className="button"
          href={`/api/gallery/download_image?session=${session}`}
          download
        >
          다운로드
        </a>
        <a className="button" href="/gallery">
          다른 사진 보기
        </a>
      </div>
    </>
  );
}
