// 카메라(getUserMedia) 공용 유틸 — take_photo-1 / take_photo-2 에서 사용.
// 실기기(키오스크)에서 http://<IP>:포트 로 열면 navigator.mediaDevices 가 없어
// 카메라 초기화가 실패하므로, 원인을 정확히 구분해 안내한다.

// 카메라 스트림 획득 (보안 컨텍스트 확인 + 구형 API 폴백 포함)
export async function getCameraStream(constraints) {
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }
  // 구형 브라우저 폴백
  const legacy =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;
  if (legacy) {
    return new Promise((resolve, reject) =>
      legacy.call(navigator, constraints, resolve, reject)
    );
  }
  // mediaDevices 가 아예 없음 → 대개 보안 컨텍스트(HTTPS/localhost)가 아님
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    const err = new Error(
      "HTTPS(보안 연결) 또는 localhost 에서만 카메라를 사용할 수 있습니다. 주소를 https:// 또는 http://localhost 로 접속하세요."
    );
    err.name = "InsecureContextError";
    throw err;
  }
  const err = new Error("이 브라우저/환경에서는 카메라를 사용할 수 없습니다.");
  err.name = "NotSupportedError";
  throw err;
}

// 비디오 엘리먼트에 스트림을 붙이고 재생될 때까지 대기 (메타데이터 로드 레이스 방지)
export function attachStream(videoEl, stream, onSize) {
  return new Promise((resolve, reject) => {
    const onReady = () => {
      onSize?.(videoEl.videoWidth, videoEl.videoHeight);
      // play() 실패(자동재생 정책 등)해도 스트림은 붙었으므로 진행
      videoEl.play().then(resolve).catch(() => resolve());
    };
    // 핸들러 먼저 등록 후 srcObject 를 붙여 "메타데이터가 먼저 로드되는" 레이스 방지
    videoEl.onloadedmetadata = onReady;
    videoEl.onerror = () => reject(new Error("영상 로드에 실패했습니다."));
    videoEl.srcObject = stream;
    if (videoEl.readyState >= 1) onReady(); // 이미 준비된 경우 대비
  });
}

// 카메라 에러를 사용자에게 보여줄 한국어 메시지로 변환
export function cameraErrorMessage(e) {
  switch (e?.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "카메라 권한이 거부되었습니다. 브라우저/시스템 설정에서 카메라를 허용해주세요.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "연결된 카메라를 찾을 수 없습니다. 카메라 연결을 확인해주세요.";
    case "NotReadableError":
    case "TrackStartError":
      return "카메라를 다른 앱이 사용 중입니다. 해당 앱을 종료한 뒤 다시 시도해주세요.";
    case "OverconstrainedError":
      return "카메라가 요청한 설정을 지원하지 않습니다.";
    case "InsecureContextError":
    case "NotSupportedError":
      return e.message;
    default:
      return e?.message
        ? `카메라 초기화 실패: ${e.message}`
        : "카메라 초기화에 실패했습니다.";
  }
}
