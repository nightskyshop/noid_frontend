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
        <title>교장님 프레임</title>
      </Head>

      <div className={styles.div}>
        <div className={styles["rectangle-2"]}></div>

        <div className={styles["original-text"]}>
          <div className={styles.div3}>교장님과의 한컷!</div>
          <div className={styles.original}>프레임을 선택해보세요.</div>
        </div>

        <div className={styles.div4}>
          <Image
            className={styles.blue}
            src="/images/dankook_mbti.png"
            alt="dankook mbti"
            width={400}
            height={400}
            onClick={() => (window.location.href = "n_blue")}
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
