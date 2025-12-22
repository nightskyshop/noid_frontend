import Head from "next/head";
import Image from "next/image";
import styles from "../styles/index_style.module.css";
import Snowfall from "react-snowfall";

export default function Home() {
  return (
    <>
      <Head>
        <title>단국네컷</title>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className={styles.div}>
        <Snowfall color="#82C3D9" />
        <div className="content-wrapper">
          <div className={styles.div2}>
            <div className={styles["rectangle-1"]}></div>
            <Image
              className={styles["dk-photo-1"]}
              src="/images/dk-photo-10.png"
              alt="단국네컷 포스터"
              width={2000}
              height={4000}
            />
          </div>
          <div className={styles.div3}>
            <Image
              className={styles.blue}
              src="/images/blue0.png"
              alt="blue"
              width={100}
              height={100}
            />
            <Image
              className={styles["dankook-b"]}
              src="/images/dankook_b.png"
              alt="dankook blue"
              width={100}
              height={100}
            />
            <Image
              className={styles["dankook-w"]}
              src="/images/dankook_n.png"
              alt="dankook white"
              width={100}
              height={100}
            />
            <Image
              className={styles.dwyl}
              src="/images/sjj_1.png"
              alt="sjj 1"
              width={100}
              height={100}
            />
            <Image
              className={styles.green}
              src="/images/sjj_2.png"
              alt="sjj 2"
              width={100}
              height={100}
            />
            <Image
              className={styles.seoulddp}
              src="/images/dankook_mbti.png"
              alt="dankook mbti"
              width={100}
              height={100}
            />
          </div>
          <div className={styles["_1"]}>
            <div className={styles["rectangle-5"]}></div>
            <div className={styles.div4}>단국네컷</div>
            <div className={styles["dksh-noid-four-cut"]}>
              DKSH NOID FOUR CUT
            </div>
            {/* Flask의 location.href='frame'을 Next.js의 라우팅에 맞게 a 태그 /frame 링크로 변경 */}
            <div
              className={styles.div5}
              onClick={() => {
                window.location.href = "/frame";
              }}
            >
              시작하기 →
            </div>
          </div>
          <div className={styles.div6}>
            <div className={styles["make-your-4-cuts"]}>MAKE YOUR 4CUTS</div>
            <div className={styles["_2025-a-t"]}>2025 단원진로학술제</div>
          </div>
        </div>
      </div>
    </>
  );
}
