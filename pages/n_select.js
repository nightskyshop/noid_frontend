import Head from "next/head";
import Image from "next/image";
import styles from "../styles/n_select.module.css";

export default function NSelect() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>블루 프레임</title>
      </Head>

      <div className={styles.div}>
        <div className={styles["rectangle-2"]}></div>

        <div className={styles["original-text"]}>
          <div className={styles.div3}>하늘하늘한 블루 프레임!</div>
          <div className={styles.original}>프레임을 선택해보세요.</div>
        </div>

        <div className={styles.div4}>
          <Image
            className={styles.blue}
            src="/images/blue0.png"
            alt="blue0"
            width={400}
            height={400}
            onClick={() => (window.location.href = "n_blue?frame=blue0")}
          />
          <Image
            className={styles.blue2}
            src="/images/blue2.png"
            alt="blue2"
            width={400}
            height={400}
            onClick={() => (window.location.href = "n_blue?frame=blue2")}
          />
        </div>

        <div className={styles["rectangle-6"]}></div>
        <div
          className={styles.div5}
          onClick={() => (window.location.href = "frame")}
        >
          ← 뒤로가기
        </div>
      </div>
    </>
  );
}
