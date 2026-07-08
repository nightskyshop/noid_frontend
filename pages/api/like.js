// Flask app.py의 /api/like 포팅
import { getGalleryDb } from "../../lib/galleryDb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const session = req.body?.session;

  if (!session) {
    return res.status(400).json({ result: false, message: "session 누락" });
  }

  let db;
  try {
    db = await getGalleryDb();

    const photo = await db.get("SELECT * FROM photos WHERE id = ?", session);
    if (!photo) {
      return res.status(404).json({ result: false, message: "사진 없음" });
    }

    const like = (photo.like || 0) + 1;
    await db.run(`UPDATE photos SET "like" = ? WHERE id = ?`, like, session);

    return res.status(200).json({ result: true, like });
  } catch (e) {
    console.error("like error:", e);
    return res.status(500).json({ result: false, message: "오류가 발생했습니다." });
  } finally {
    if (db) await db.close();
  }
}
