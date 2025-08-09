'use strict';

const TOPIC_TYPE = {
  DISPLAY: "/goldstar/display",
  CONTROL: "/goldstar/control",
};

const ttContainer = {
  projectCode: null,
  mqttInfo: {
    clientId: "Web_Client_" + parseInt(Math.random() * 100 * 100, 10),

    // 🔁 브로커 후보 목록(우선순위 순)
    // url 형식 또는 host/port/path 형식 모두 지원
    brokers: [
      // 1) 사내 브로커 (기존)
      {
        type: "host",
        host: "mqtt.bytechtree.com",
        port: location.protocol === "https:" ? 15676 : 15675,
        path: "/ws",
        useSSL: location.protocol === "https:",
        userName: "goldstar-web",
        password: "n,E9TbDPYR5",
      },
      // 2) EMQX (공용)
      { type: "url", url: "wss://broker.emqx.io:8084/mqtt" },
      { type: "url", url: "wss://wss.emqx.io:8084/mqtt" },
      // 3) HiveMQ (공용)
      { type: "url", url: "wss://broker.hivemq.com:8884/mqtt" },
      // 4) Mosquitto (공용, 가끔 불안정)
      { type: "url", url: "wss://test.mosquitto.org:8081/mqtt" },
    ],

    keepAliveInterval: 30,
    isReconnect: true,
    reconnectTriesPerBroker: 3,   // 브로커당 재시도 횟수 한도
    topicType: null,
  },

  mqttClient: null,
  mqttConnected: false,

  // 내부 상태
  _brokerIndex: 0,
  _retryCountThisBroker: 0,
  _currentBroker: null,

  mqttConnect(projectCode, topic_type, onConnected = function () {}) {
    if (topic_type == null) {
      console.error("topic_type is required for mqttConnect");
      return;
    }
    this.onConnected = onConnected;
    this.projectCode = projectCode;
    this.mqttInfo.topicType = topic_type;

    // 매 호출 시 초기화
    this._brokerIndex = 0;
    this._retryCountThisBroker = 0;

    this._tryConnectToCurrentOrNextBroker();
  },

  _tryConnectToCurrentOrNextBroker() {
    const brokers = this.mqttInfo.brokers;
    if (!Array.isArray(brokers) || brokers.length === 0) {
      console.error("No MQTT brokers configured.");
      return;
    }

    // 인덱스가 범위를 넘어가면 종료
    if (this._brokerIndex >= brokers.length) {
      console.error("❌ 모든 브로커 연결 실패:", brokers.map(b => b.url || `${b.host}:${b.port}${b.path || ""}`).join(", "));
      return;
    }

    this._currentBroker = brokers[this._brokerIndex];
    const broker = this._currentBroker;

    const clientId = this.mqttInfo.clientId + "_" + Date.now();
    try {
      if (broker.type === "url") {
        console.log("📡 MQTT 연결 시도 (URL):", broker.url);
        this.mqttClient = new Paho.MQTT.Client(broker.url, clientId);
      } else {
        // host/port/path 방식
        const path = broker.path || "/ws";
        console.log("📡 MQTT 연결 시도 (HOST):", `${broker.host}:${broker.port}${path}`);
        this.mqttClient = new Paho.MQTT.Client(broker.host, broker.port, path, clientId);
      }
    } catch (e) {
      console.error("❌ MQTT Client 생성 실패:", e);
      return this._advanceBrokerAndRetry();
    }

    const self = this;

    this.mqttClient.onConnectionLost = function (responseObject) {
      console.warn("⚠️ onConnectionLost:", responseObject && responseObject.errorMessage);
      self.mqttClient = null;
      self.mqttConnected = false;

      if (!self.mqttInfo.isReconnect) return;

      // 현재 브로커에서 재시도 → 한도 넘으면 다음 브로커
      setTimeout(() => {
        self._retryOrAdvanceBroker();
      }, 1200);
    };

    this.mqttClient.onMessageArrived = async function (message) {
      setTimeout(function () {
        self.recvMessage(message.destinationName, message.payloadString);
      });
    };

    // connect 옵션 구성
    const connectOptions = {
      keepAliveInterval: this.mqttInfo.keepAliveInterval,
      onSuccess: function () {
        self.mqttConnected = true;
        self._retryCountThisBroker = 0; // 성공하면 카운터 리셋
        console.log("✅ MQTT Connected");

        const topic = self.projectCode + self.mqttInfo.topicType;
        self.subscribe(topic);

        self.onConnected();
      },
      onFailure: function (message) {
        self.mqttConnected = false;
        console.error("❌ MQTT Connect Failed:", message && message.errorMessage);
        if (!self.mqttInfo.isReconnect) return;
        self._retryOrAdvanceBroker();
      },
    };

    // useSSL 판단 및 자격 증명(브로커별 override)
    if (this._isUrlBroker(broker)) {
      connectOptions.useSSL = broker.url.startsWith("wss://");
    } else {
      connectOptions.useSSL = !!broker.useSSL;
    }
    if (broker.userName) connectOptions.userName = broker.userName;
    if (broker.password) connectOptions.password = broker.password;

    try {
      this.mqttClient.connect(connectOptions);
    } catch (e) {
      console.error("❌ connect 호출 실패:", e);
      this._advanceBrokerAndRetry();
    }
  },

  _retryOrAdvanceBroker() {
    if (this._retryCountThisBroker < (this.mqttInfo.reconnectTriesPerBroker | 0)) {
      this._retryCountThisBroker++;
      console.log(`🔁 재시도(${this._retryCountThisBroker}/${this.mqttInfo.reconnectTriesPerBroker}) - 동일 브로커`);
      this._tryConnectToCurrentOrNextBroker();
    } else {
      console.log("⏭️ 브로커 변경 (현재 브로커 재시도 한도 초과)");
      this._advanceBrokerAndRetry();
    }
  },

  _advanceBrokerAndRetry() {
    this._brokerIndex++;
    this._retryCountThisBroker = 0;
    setTimeout(() => this._tryConnectToCurrentOrNextBroker(), 800);
  },

  _isUrlBroker(broker) {
    return broker && broker.type === "url" && typeof broker.url === "string";
  },

  subscribe(topic) {
    if (this.mqttClient == null || !this.mqttConnected) {
      return console.error("MQTT Client is not connected.");
    }
    this.mqttClient.subscribe(topic, { qos: 0 });
    console.log("📥 SUB:", topic);
  },

  publish(topic, message, qos = 0) {
    if (this.mqttClient == null || !this.mqttConnected) {
      return console.error("MQTT Client is not connected.");
    }
    this.mqttClient.send(topic, message, qos);
    console.log("📤 PUB:", topic, message);
  },

  recvMessage(topic, message) {
    try {
      if (this.mqttClient == null || !this.mqttConnected) {
        return console.error("MQTT Client is not connected.");
      }
      // console.log(`Message recv :: [${topic}] ${message}`);
      this.onMessage(message);
    } catch (error) {
      console.log("recvMessage Err", error);
    }
  },

  sendMessage(message) {
    // 상대 페이지로 보내기(표시 ↔ 제어 토픽 반대 방향)
    let topic;
    if (this.mqttInfo.topicType === TOPIC_TYPE.DISPLAY) {
      topic = this.projectCode + TOPIC_TYPE.CONTROL;
    } else {
      topic = this.projectCode + TOPIC_TYPE.DISPLAY;
    }
    this.publish(topic, message);
  },

  onConnected: function () {},
  onMessage: function () {},
};
