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

    const row = await db.get(
      "SELECT qrfile, photofile FROM photo_sessions WHERE id = ? LIMIT 1",
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
      selected_photo: row.photofile,
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
