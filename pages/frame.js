import Head from "next/head";
import Image from "next/image";
import styles from "../styles/frame_style.module.css";
import Snowfall from "react-snowfall";

export default function Frame() {
  return (
    <>
      <Head>
        <title>프레임 선택</title>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className={styles.div}>
        <Snowfall color="#82C3D9" />
        <div className={styles.div2}>
          <div className={styles.div3}>
            {/* NOID 프레임 영역 */}
            <div
              className={styles["rectangle-2"]}
              onClick={() => {
                window.location.href = "/noid_select";
              }}
            ></div>
            <div
              className={styles.div4}
              onClick={() => {
                window.location.href = "/noid_select";
              }}
            >
              단대소고 근본 동아리 프레임
            </div>
            <Image
              className={styles["dankook-b"]}
              src="/images/dankook_b.png"
              alt="dankook_b"
              width={167}
              height={247}
              onClick={() => {
                window.location.href = "/noid_select";
              }}
            />
            <Image
              className={styles["dankook-w"]}
              src="/images/dankook_n.png"
              alt="dankook_n"
              width={167}
              height={247}
              onClick={() => {
                window.location.href = "/noid_select";
              }}
            />
            <div
              className={styles["dksh-noid"]}
              onClick={() => {
                window.location.href = "/noid_select";
              }}
            >
              DKSH NOID →
            </div>

            {/* DDP / 비즈쿨 프레임 영역 */}
            <div
              className={styles["rectangle-3"]}
              onClick={() => {
                window.location.href = "/ddp_select";
              }}
            ></div>
            <Image
              className={styles.dwyl}
              src="/images/sjj_1.png"
              alt="sjj_1"
              width={117}
              height={173}
              onClick={() => {
                window.location.href = "/ddp_select";
              }}
            />
            <div
              className={styles._2025}
              onClick={() => {
                window.location.href = "/ddp_select";
              }}
            >
              2025
            </div>
            <div
              className={styles.div5}
              onClick={() => {
                window.location.href = "/ddp_select";
              }}
            >
              단원진로학술제
            </div>
            <div
              className={styles.ddp}
              onClick={() => {
                window.location.href = "/ddp_select";
              }}
            >
              Christmas →
            </div>
            <Image
              className={styles.seoulddp}
              src="/images/sjj_2.png"
              alt="sjj_2"
              width={117}
              height={173}
              onClick={() => {
                window.location.href = "/ddp_select";
              }}
            />

            {/* MBTI / 나만의 프레임 영역 */}
            <div
              className={styles["rectangle-4"]}
              onClick={() => {
                window.location.href = "/n_select";
              }}
            ></div>
            <Image
              className={styles.green}
              src="/images/dankook_mbti.png"
              alt="dankook_mbti_green"
              width={105}
              height={156}
              onClick={() => {
                window.location.href = "/n_select";
              }}
            />
            <Image
              className={styles.blue}
              src="/images/dankook_mbti.png"
              alt="dankook_mbti_blue"
              width={105}
              height={156}
              onClick={() => {
                window.location.href = "/n_select";
              }}
            />
            <div
              className={styles.div6}
              onClick={() => {
                window.location.href = "/n_select";
              }}
            >
              교장님 프레임
            </div>
            <div
              className={styles.original}
              onClick={() => {
                window.location.href = "/n_select";
              }}
            >
              Memo →
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
