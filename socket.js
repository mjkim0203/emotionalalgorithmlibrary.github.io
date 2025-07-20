// 1) 프로젝트 코드, PUBLISH 토픽으로 연결
    const projectCode = "sample";
    ttContainer.mqttConnect(
      projectCode,
      TOPIC_TYPE.PUBLISH,
      () => console.log("🟢 MQTT 연결 성공 (PUBLISH)"),
        {
    // 퍼블릭 테스트 브로커 예시 (wss:// 스킴이 HTTPS 페이지에서 필수)
    brokerUrl: "wss://broker.hivemq.com:8000/mqtt"
  }
    );

    // 2) next-button 클릭 시 data-video-src 를 읽어 CONTROL 메시지 발행
    document.querySelectorAll('.next-button').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault(); // 혹시 기본동작이 있으면 막아 줍니다

    const videoSrc = btn.dataset.videoSrc.trim();
    const audioSrc = btn.dataset.audioSrc.trim();     
    
    // 2-2) 사용자 제스처 내부에서 오디오 먼저 재생
    triggerAudio.src = audioSrc;
    triggerAudio.currentTime = 0;
    triggerAudio.play().catch(err =>
      console.warn('Audio play failed:', err)
    );


        console.log('▶ sendControlMessage:', videoSrc);
        ttContainer.publish(videoSrc);
      });
    });
