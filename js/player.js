console.log("▶▶▶ player.js 로드됨");
document.addEventListener('DOMContentLoaded', () => {
  console.log("▶ DOMContentLoaded 발생");

  const projectCode = "sample";
  ttContainer.mqttConnect(
    projectCode,
    TOPIC_TYPE.DISPLAY,
    () => console.log("✅ MQTT 연결 성공 (DISPLAY)"),
    {
      // ← 딱 이 옵션 블록 하나만!
      brokerUrl: "wss://broker.hivemq.com:8000/mqtt"
    }
  );

  ttContainer.onMessage = message => {
    console.log("📨 수신 메시지:", message);
    const video = document.getElementById("player");
    video.src = message;
    video.load();
    video.play().catch(err => console.error(err));
  };
});
