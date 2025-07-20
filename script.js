const emotionColors = {
  neutral: "#AAAEAA", happy: "#FFE048", sad: "#A7C9FF",
  disgusted: "#D0FF3E", surprised: "#FF865C", angry: "#FF6489", fearful: "#CE6EB5"
};

const emotionLinks = {
  happy: "tri.joy.html", sad: "tri.sadness.html",
  angry: "tri.anger.html", fearful: "tri.fear.html",
  disgusted: "tri.disgust.html", surprised: "tri.surprise.html",
  neutral: "tri.neutral.html"
};

const emotionImages = {
  Neutral: "https://cdn.glitch.global/.../IMOJI-100.png",
  Joy: "https://cdn.glitch.global/.../IMOJI-200.png",
  Sadness: "https://cdn.glitch.global/.../IMOJI-300.png",
  Anger: "https://cdn.glitch.global/.../IMOJI-400.png",
  Fear: "https://cdn.glitch.global/.../IMOJI-500.png",
  Disgust: "https://cdn.glitch.global/.../IMOJI-600.png",
  Surprise: "https://cdn.glitch.global/.../IMOJI-700.png"
};

const prompts = [
  "지금 어떤 감정이 드시나요?", "당신을 가장 쉽게 웃게 만드는 건 무엇인가요?",
  "기억에 남는 슬펐던 경험은 어떤 게 있나요?", "최근 어떤 일에 화가 났나요?",
  "가장 최근에 무서웠던 순간은 언제였나요?", "불쾌하거나 역겨운 느낌이 들었던 상황은 있었나요?",
  "예상치 못한 일이 생겼을 때 어떤 감정이 드시나요?"
];

window.addEventListener("DOMContentLoaded", () => {
  const promptEl = document.querySelector(".prompt-text");
  promptEl.innerText = prompts[Math.floor(Math.random() * prompts.length)];
});

function goToEmotionPage() {
  if (!window._topEmotion) {
    alert("감정이 아직 감지되지 않았습니다.");
    return;
  }
  const link = emotionLinks[window._topEmotion];
  if (link) window.location.href = link;
  else alert("이동할 페이지가 정의되지 않았습니다.");
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function blendEmotionColor(expressions) {
  let total = 0, r = 0, g = 0, b = 0;
  for (const emotion in expressions) {
    if (emotionColors[emotion]) {
      const weight = expressions[emotion];
      const rgb = hexToRgb(emotionColors[emotion]);
      r += rgb.r * weight;
      g += rgb.g * weight;
      b += rgb.b * weight;
      total += weight;
    }
  }
  return total === 0 ? "#000000" : rgbToHex(r / total, g / total, b / total);
}

function lerpColor(from, to, alpha = 0.2) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex(
    a.r + (b.r - a.r) * alpha,
    a.g + (b.g - a.g) * alpha,
    a.b + (b.b - a.b) * alpha
  );
}

async function getPreferredCameraStream() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter((d) => d.kind === "videoinput");
  const elgato = videoDevices.find((d) => d.label.toLowerCase().includes("elgato facecam"));

  const constraints = {
    video: elgato
      ? { deviceId: { exact: elgato.deviceId }, width: 640, height: 480 }
      : { width: 640, height: 480 },
    audio: false
  };
  return await navigator.mediaDevices.getUserMedia(constraints);
}

async function analyzeEmotionLoop(video, canvas, displaySize) {
  const ctx = canvas.getContext("2d");
  const bannerEl = document.getElementById("emotion-banner");
  const linkEl = document.getElementById("emotion-link");
  const graphicEl = document.getElementById("emotion-graphic");
  const captureImageEl = document.getElementById("capture-image");

  const emotionLabels = {
    neutral: "Neutral", happy: "Joy", sad: "Sadness", angry: "Anger",
    fearful: "Fear", disgusted: "Disgust", surprised: "Surprise"
  };

  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.3 });

  async function loop() {
    const result = await faceapi.detectSingleFace(video, options)
      .withFaceLandmarks(true)
      .withFaceExpressions();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (result) {
      const resized = faceapi.resizeResults(result, displaySize);
      const { box } = resized.detection;
      const expressions = result.expressions;
      const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
      const topEmotion = sorted[0][0];
      const emotionName = emotionLabels[topEmotion];
      const label = `${emotionName || topEmotion} (${(sorted[0][1] * 100).toFixed(1)}%)`;

      window._topEmotion = topEmotion;

      const color = blendEmotionColor(expressions);
      window._boxColor = window._boxColor ? lerpColor(window._boxColor, color, 0.4) : color;
      bannerEl.style.backgroundColor = window._boxColor;

      // Draw box
      ctx.strokeStyle = window._boxColor;
      ctx.lineWidth = 8;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.font = "28px 'Pretendard'";
      ctx.fillStyle = window._boxColor;
      ctx.fillRect(box.x, box.y - 40, ctx.measureText(label).width + 20, 30);
      ctx.fillStyle = "#000";
      ctx.fillText(label, box.x + 10, box.y - 20);

      if (emotionImages[emotionName]) graphicEl.src = emotionImages[emotionName];
      captureImageEl.src = "https://cdn.glitch.global/.../CAPTURE.png";

      if (emotionLinks[topEmotion]) linkEl.classList.add("active");
      else linkEl.classList.remove("active");
    }

    requestAnimationFrame(loop);
  }

  loop();
}

async function init() {
  await faceapi.nets.tinyFaceDetector.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
  await faceapi.nets.faceExpressionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");

  const video = document.getElementById("video");
  const canvas = document.getElementById("overlay");

  try {
    const stream = await getPreferredCameraStream();
    video.srcObject = stream;
  } catch (err) {
    alert("카메라 접근 오류: " + err.message);
    return;
  }

  video.onloadedmetadata = () => {
    video.play();
    const width = video.videoWidth;
    const height = video.videoHeight;
    video.width = width;
    video.height = height;
    canvas.width = width;
    canvas.height = height;

    const displaySize = { width, height };
    faceapi.matchDimensions(canvas, displaySize);
    analyzeEmotionLoop(video, canvas, displaySize);
  };
}

init();
