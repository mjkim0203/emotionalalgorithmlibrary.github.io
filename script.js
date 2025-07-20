const video = document.getElementById("video");
    const canvas = document.getElementById("overlay");
    const ctx = canvas.getContext("2d");
    const bannerEl = document.getElementById("emotion-banner");
    const graphicEl = document.getElementById("emotion-graphic");
    const linkEl = document.getElementById("emotion-link");
    const captureImageEl = document.getElementById("capture-image");

    const emotionLabels = {
      neutral: "Neutral", happy: "Joy", sad: "Sadness", angry: "Anger",
      fearful: "Fear", disgusted: "Disgust", surprised: "Surprise"
    };

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

    function goToEmotionPage() {
      if (!window._topEmotion) {
        alert("감정이 아직 감지되지 않았습니다.");
        return;
      }
      const link = emotionLinks[window._topEmotion];
      if (link) window.location.href = link;
      else alert("이동할 페이지가 정의되지 않았습니다.");
    }

    async function startCameraAndDetect() {
      await faceapi.nets.tinyFaceDetector.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
      await faceapi.nets.faceExpressionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      video.srcObject = stream;

      video.onloadedmetadata = () => {
        video.play();
        const width = 640;
        const height = 480;
        canvas.width = width;
        canvas.height = height;

        drawLoop();
        setInterval(analyzeEmotion, 1000); // 감정 분석은 1초마다
      };
    }

    function drawLoop() {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(drawLoop);
    }

    async function analyzeEmotion() {
      const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 96, scoreThreshold: 0.3 });

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
        const resized = faceapi.resizeResults(result, { width: canvas.width, height: canvas.height });
        const box = resized.detection.box;
        const expressions = result.expressions;

        const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
        const topEmotion = sorted[0][0];
        window._topEmotion = topEmotion;
        const emotionName = emotionLabels[topEmotion];

        const color = blendEmotionColor(expressions);
        if (bannerEl) bannerEl.style.backgroundColor = color;

        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.strokeRect(canvas.width - box.x - box.width, box.y, box.width, box.height);

        ctx.font = "24px Pretendard";
        ctx.fillStyle = color;
        ctx.fillText(`${emotionName || topEmotion}`, canvas.width - box.x - box.width, box.y - 10);

        if (emotionImages[emotionName]) graphicEl.src = emotionImages[emotionName];
        captureImageEl.src = "https://cdn.glitch.global/.../CAPTURE.png";

        if (emotionLinks[topEmotion]) linkEl.classList.add("active");
        else linkEl.classList.remove("active");
      }
    }

    startCameraAndDetect();
