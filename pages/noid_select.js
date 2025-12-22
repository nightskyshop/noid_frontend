import Head from "next/head";
import Image from "next/image";
import styles from "../styles/noid_style.module.css";
import Snowfall from "react-snowfall";

export default function NoidSelect() {
  return (
    <>
      <Head>
        <title>NOID 프레임</title>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className={styles.div}>
        <Snowfall color="#82C3D9" />
        <div className={styles.div2}>
          <div className={styles["rectangle-2"]}></div>

          <div className={styles["noid-text"]}>
            <div className={styles.div3}>근본 동아리 프레임!</div>
            <div className={styles.noid}>NOID 프레임을 선택해보세요.</div>
          </div>

          <div className={styles.div4}>
            <Image
              className={styles["dankook-b"]}
              src="/images/dankook_b.png"
              alt="dankook_b"
              width={325}
              height={481}
              onClick={() => {
                window.location.href = "/noid_dankook_b";
              }}
            />
            <Image
              className={styles["dankook-n"]}
              src="/images/dankook_n.png"
              alt="dankook_n"
              width={325}
              height={481}
              onClick={() => {
                window.location.href = "/noid_dankook_n";
              }}
            />
          </div>

          <div className={styles["select-page"]}>
            <div className={styles["rectangle-6"]}></div>
            <div
              className={styles.div5}
              onClick={() => {
                window.location.href = "/frame";
              }}
            >
              ← 뒤로가기
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
