import Head from "next/head";
import Image from "next/image";
import styles from "../styles/ddp_style.module.css";

export default function DdpSelect() {
  const goDwyl = () => {
    window.location.href = "/ddp_dwyl";
  };

  const goSeoul = () => {
    window.location.href = "/ddp_seoul";
  };

  const goBack = () => {
    window.location.href = "/frame";
  };

  return (
    <>
      <Head>
        <title>단원진로학술제 프레임</title>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className={styles.div}>
        <div className={styles["rectangle-2"]}></div>

        <div className={styles["ddp-text"]}>
          <div className={styles._2025}>2025 단원진로학술제</div>
          <div className={styles.ddp}>프레임을 선택해보세요.</div>
        </div>

        <div className={styles.div3}>
          <Image
            className={styles.dwyl}
            src="/images/sjj_2.png"
            alt="dwyl"
            width={300}
            height={300}
            onClick={goDwyl}
          />
          <Image
            className={styles.seoulddp}
            src="/images/sjj_1.png"
            alt="seoul ddp"
            width={300}
            height={300}
            onClick={goSeoul}
          />
        </div>

        <div className={styles["select-page"]}>
          <div className={styles["rectangle-6"]}></div>
          <div className={styles.div4} onClick={goBack}>
            ← 뒤로가기
          </div>
        </div>
      </div>
    </>
  );
}
