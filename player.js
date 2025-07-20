console.log("▶ player.js 실행됨");
document.addEventListener('DOMContentLoaded', () => {
 const projectCode = "sample";

    ttContainer.mqttConnect(projectCode, TOPIC_TYPE.DISPLAY, function () {
      console.log("MQTT 연결 성공 (DISPLAY)");

      ttContainer.onMessage = function (message) {
        const url = message.trim();
  const video = document.getElementById("player");
  video.src = url;      // 직접 src에
  video.load();
  video.play()
       .then(() => { video.muted = false; })
        .catch(err => console.error('자동 재생 차단됨:', err));
      };
    },
    {
brokerUrl: "wss://broker.hivemq.com:8000/mqtt"
  }
    );
});
