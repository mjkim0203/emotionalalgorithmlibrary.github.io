// 1) 파일이 로드되었는지 최상단에서 확인
console.log("▶▶▶ player.js 로드됨");

document.addEventListener('DOMContentLoaded', () => {
  // 2) DOM 준비 시점 확인
  console.log("▶ DOMContentLoaded 발생");

  const projectCode = "sample";

  // 3) MQTT 구독용(DISPLAY) 연결 (퍼블릭 wss 브로커 지정)
  ttContainer.mqttConnect(
    projectCode,
    TOPIC_TYPE.DISPLAY,
    () => {
      console.log("✅ MQTT 연결 성공 (DISPLAY)");

      // 4) 메시지 수신 핸들러 등록
      ttContainer.onMessage = (message) => {
        const video = document.getElementById("player");
        video.src = message;
        video.load();
        video.play()
          .then(() => { video.muted = false; })
          .catch(err => console.error("자동 재생 차단됨:", err));
      };
    },
    {
      // HTTPS 환경에서 반드시 wss:// 스킴 사용
      brokerUrl: "wss://broker.hivemq.com:8000/mqtt"
    }
  );
});
