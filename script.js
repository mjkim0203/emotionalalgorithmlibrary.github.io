async function getPreferredCameraStream() {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      let preferredDevice = videoDevices.find(device => device.label.toLowerCase().includes("elgato facecam"));

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
        drawLoop(video, canvas);
      };
    }

    function drawLoop(video, canvas) {
      const ctx = canvas.getContext("2d");
      const draw = () => {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
        requestAnimationFrame(draw);
      };
      draw();
    }

    init();
