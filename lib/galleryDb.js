// 갤러리(server) 기능용 SQLite 헬퍼
// noid/db.db 안의 photos 테이블을 사용 (기존 Flask 서버의 photos 스키마와 동일)
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function getGalleryDb() {
  const dbPath = path.join(process.cwd(), "db.db");
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.run(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY NOT NULL,
      photoUrl TEXT,
      createdAt DATETIME,
      "like" INTEGER DEFAULT 0,
      upload BOOLEAN
    )
  `);

  return db;
}

// 이미지 파일 경로 (Flask의 ./images/{session}.png 와 동일)
export function imagePath(session) {
  return path.join(process.cwd(), "images", `${session}.png`);
}
