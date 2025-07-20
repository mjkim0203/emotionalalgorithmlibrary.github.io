async function getPreferredCameraStream() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(device => device.kind === 'videoinput');
  const preferredDevice = videoDevices.find(device =>
    device.label.toLowerCase().includes("elgato facecam")
  );

  const constraints = {
    video: preferredDevice
      ? { deviceId: { exact: preferredDevice.deviceId }, width: 640, height: 480 }
      : { width: 640, height: 480 },
    audio: false
  };

  return await navigator.mediaDevices.getUserMedia(constraints);
}

async function init() {
  await faceapi.nets.tinyFaceDetector.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
  await faceapi.nets.faceExpressionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");

  const video = document.getElementById("video");

  try {
    const stream = await getPreferredCameraStream();
    video.srcObject = stream;
  } catch (err) {
    alert("카메라를 사용할 수 없습니다: " + err.message);
    return;
  }

  video.onloadedmetadata = () => {
    video.play();
    const container = document.getElementById("canvasContainer");
    const canvas = faceapi.createCanvasFromMedia(video);
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '1';
    container.style.position = 'relative';
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

function analyzeEmotionLoop(video, canvas, displaySize) {
  const ctx = canvas.getContext("2d");
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 128, scoreThreshold: 0.5 });

  async function loop() {
    const result = await faceapi
      .detectSingleFace(video, options)
      .withFaceLandmarks(true)
      .withFaceExpressions();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    if (result) {
      const resized = faceapi.resizeResults(result, displaySize);
      const box = resized.detection.box;
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 4;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }

    requestAnimationFrame(loop);
  }

  loop();
}

window.addEventListener('DOMContentLoaded', init);
