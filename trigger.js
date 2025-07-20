window.addEventListener('load', () => {
  const progress = document.getElementById('progressBar');
  const circle1 = document.querySelector('.circle1');
  const circle2 = document.querySelector('.circle2');
  const circle3 = document.querySelector('.circle3');
  const title = document.getElementById('title');
  const subtitle = document.getElementById('subtitle');
  const emotionValue = document.querySelector('.emotion-value');
  const emotionText = emotionValue ? emotionValue.textContent.trim() : '중립';
  const emotionEngWrapper = document.getElementById('emotionEngWrapper');
  const emotionEng = document.getElementById('emotionEng');
  const bgImage = document.querySelector('.background-image');
  const gradient = document.querySelector('.gradient-overlay');

  const emotionMap = {
    '중립': 'Neutral',
    '기쁨': 'Joy',
    '슬픔': 'Sadness',
    '화남': 'Anger',
    '무서움': 'Fear',
    '역겨움': 'Disgust',
    '놀람': 'Surprise'
  };

  setTimeout(() => {
    progress.style.width = '100%';
    circle1.classList.add('move-circle1');
    circle2.classList.add('move-circle2');
    circle3.classList.add('move-circle3');
  }, 1000);

  setTimeout(() => {
    circle1.style.animationPlayState = 'paused';
    circle2.style.animationPlayState = 'paused';
    circle3.style.animationPlayState = 'paused';

    title.textContent = '감정 분석을 완료했어요';
    subtitle.textContent = `현재 당신의 감정은 “${emotionText}” 입니다.`;

    if (emotionEng) {
      emotionEng.textContent = emotionMap[emotionText] || 'Neutral';
    }

    if (emotionEngWrapper) {
      emotionEngWrapper.classList.add('show');
    }
  }, 6000);

  setTimeout(() => {
    document.querySelector('.screen1').classList.remove('show');
    document.querySelector('.screen2').classList.add('show');

    // 프로그레스바 숨기기
    document.querySelector('.progress-wrapper').style.display = 'none';

    // 배경 및 오버레이 활성화
    bgImage.style.display = 'block';
    gradient.style.display = 'block';

    // 사용자 이름 설정
    const userName = localStorage.getItem("userName") || "Guest";
    const userNameEl = document.getElementById("user-name");
    if (userNameEl) {
      userNameEl.textContent = userName;
    }
  }, 9000);
});

// 1분(60초) 후에 index.html로 리다이렉트
let idleTimer;
function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    window.location.href = 'index.html';
  }, 60000);
}

// 페이지가 준비되면 타이머 시작
window.addEventListener('load', () => {
  resetIdleTimer();
  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    .forEach(evt => {
      document.addEventListener(evt, resetIdleTimer, { passive: true });
    });
});
