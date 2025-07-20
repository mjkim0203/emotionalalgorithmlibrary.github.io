// script.js

// 감정 색상 정의
const emotionColors = {
  neutral: "#AAAEAA", happy: "#FFE048", sad: "#A7C9FF",
  disgusted: "#D0FF3E", surprised: "#FF865C", angry: "#FF6489", fearful: "#CE6EB5"
};

// 감정별 이동 링크
const emotionLinks = {
  happy: "tri.joy.html", sad: "tri.sadness.html",
  angry: "tri.anger.html", fearful: "tri.fear.html",
  disgusted: "tri.disgust.html", surprised: "tri.surprise.html",
  neutral: "tri.neutral.html"
};

// 감정별 그래픽 이미지
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
  const randomIndex = Math.floor(Math.random() * prompts.length);
  promptEl.innerText = prompts[randomIndex];
});

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

function goToEmotionPage() {
  if (!window._topEmotion) {
    alert("감정이 아직 감지되지 않았습니다.");
    return;
  }
  const link = emotionLinks[window._topEmotion];
  if (link) window.location.href = link;
  else alert("이동할 페이지가 정의되지 않았습니다.");
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

  async function analyze() {
    const result = await faceapi.detectSingleFace(video, options)
      .withFaceLandmarks(true)
      .withFaceExpressions();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (result) {
      const resized = faceapi.resizeResults(result, displaySize);
      const box = resized.detection.box;
      const expressions = result.expressions;

      const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
      const topEmotion = sorted[0][0];
      window._topEmotion = topEmotion;
      const emotionName = emotionLabels[topEmotion];
      const label = `${emotionName || topEmotion} (${(sorted[0][1] * 100).toFixed(1)}%)`;

      const targetColor = blendEmotionColor(expressions);
      window._boxColor = window._boxColor ? lerpColor(window._boxColor, targetColor, 0.4) : targetColor;
      if (bannerEl) bannerEl.style.backgroundColor = window._boxColor;

      const mirroredBoxX = canvas.width - box.x - box.width;
      ctx.strokeStyle = window._boxColor;
      ctx.lineWidth = 8;
      ctx.strokeRect(mirroredBoxX, box.y, box.width, box.height);

      ctx.font = "40px 'Pretendard', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const padding = 12;
      const textX = mirroredBoxX + 4;
      const textY = box.y - 60;
      const textWidth = ctx.measureText(label).width;
      const textHeight = 50;

      ctx.fillStyle = window._boxColor;
      ctx.fillRect(textX - padding, textY - padding, textWidth + padding * 2, textHeight + padding * 1.2);
      ctx.fillStyle = "#000000";
      ctx.fillText(label, textX, textY);

      if (emotionImages[emotionName]) graphicEl.src = emotionImages[emotionName];
      captureImageEl.src = "https://cdn.glitch.global/.../CAPTURE.png";

      if (emotionLinks[topEmotion]) linkEl.classList.add("active");
      else linkEl.classList.remove("active");
    }
    setTimeout(analyze, 400); // 최적화된 루프 주기
  }
  analyze();
}

async function init() {
  await faceapi.nets.tinyFaceDetector.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
  await faceapi.nets.faceExpressionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");

  const stream = await getPreferredCameraStream();
  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;

  video.onloadedmetadata = () => {
    video.play();
    const canvas = faceapi.createCanvasFromMedia(video);
    const container = document.getElementById("canvasContainer");
    container.innerHTML = "";
    container.appendChild(canvas);
    const width = container.clientWidth;
    const height = width * 3 / 4;
    canvas.width = width;
    canvas.height = height;
    const displaySize = { width, height };
    faceapi.matchDimensions(canvas, displaySize);
    analyzeEmotionLoop(video, canvas, displaySize);
  };
}

init();
