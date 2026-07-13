import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { session } = req.query;

  if (!session) {
    return res.status(400).json({
      result: false,
      message: "필수 파라미터 session이 누락되었습니다.",
    });
  }

  let db;
  try {
    db = await getDb();

    // photofile(합성 이미지 base64)은 크기가 커서 응답에 담지 않는다(4MB 초과 방지).
    // 실제 사진은 파일 스트리밍 엔드포인트(/api/gallery/get_image)로 불러온다.
    const row = await db.get(
      "SELECT qrfile FROM photo_sessions WHERE id = ? LIMIT 1",
      session
    );

    if (!row) {
      return res.status(403).json({
        result: false,
        message: "존재하지 않거나 만료된 세션입니다.",
      });
    }

    return res.status(200).json({
      result: true,
      qr_code: row.qrfile,
    });
  } catch (e) {
    console.error("download error:", e);
    return res.status(500).json({
      result: false,
      message: "데이터 조회 중 오류가 발생했습니다.",
    });
  } finally {
    if (db) await db.close();
  }
}

async function getDb() {
  const dbPath = path.join(process.cwd(), "db.db");
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}
