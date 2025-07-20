'use strict';

const TOPIC_TYPE = {
	DISPLAY : "/goldstar/display",
	CONTROL : "/goldstar/control",
};

const ttContainer = {
	projectCode : null,
    mqttInfo :{
        clientId : "Web_Client_" + parseInt(Math.random() * 100 * 100, 10),
        host : "mqtt.bytechtree.com",
        port : location.protocol == "https:" ? 15676 : 15675,
        useSSL: location.protocol == "https:" ? true : false,
        userName : "goldstar-web",
		password: "n,E9TbDPYR5",
        keepAliveInterval: 30,
		isReconnect: true,
		topicType: null,
    },
    mqttClient : null,
    mqttConnected : false,
    mqttConnect(projectCode, topic_type, onConnected = function() {}) {
		if (topic_type == null || topic_type == undefined) {
			console.error("topic_type is required for mqttConnect");
			return;
		}

		this.onConnected = onConnected;

		this.projectCode = projectCode;
		this.mqttInfo.topicType = topic_type;

        this.mqttClient = new Paho.MQTT.Client(this.mqttInfo.host, this.mqttInfo.port, "/ws", this.mqttInfo.clientId);

        this.mqttClient.onConnectionLost = function (responseObject) {
            console.log("onConnectionLost", responseObject.errorMessage)

            ttContainer.mqttClient == null
            ttContainer.mqttConnected = false;

			if (ttContainer.mqttInfo.isReconnect) {
				setTimeout(function() {
					ttContainer.mqttConnect(projectCode, topic_type);
				}, 1000 * 5);
			}
        };

        this.mqttClient.onMessageArrived = async function (message) {
            setTimeout(function() {
                ttContainer.recvMessage(message.destinationName, message.payloadString)
            });
        }

        this.mqttClient.connect({
            useSSL: this.mqttInfo.useSSL,
            keepAliveInterval: this.mqttInfo.keepAliveInterval,
            userName: this.mqttInfo.userName,
            password: this.mqttInfo.password,

            onSuccess: function () {
				ttContainer.mqttConnected = true;
				console.log("MQTT is Connected");

				var topic = ttContainer.projectCode + ttContainer.mqttInfo.topicType;
				ttContainer.subscribe(topic);

				ttContainer.onConnected();
            },
			
            onFailure: function (message) {
                ttContainer.mqttConnected = false;
                console.log("MQTT Connect Failed :: " + message.errorMessage);

				if (ttContainer.mqttInfo.isReconnect) {
					setTimeout(function() {
						ttContainer.mqttConnect(projectCode, topic_type);
					}, 1000 * 5);
				}
            }
        });
    },
	subscribe(topic) {
		if(this.mqttClient == null || !this.mqttConnected) {
			return console.error("MQTT Client is not connected.");
		}

		this.mqttClient.subscribe(topic, {qos: 0});
	},
	publish(topic, message, qos = 0) {
		if(this.mqttClient == null || !this.mqttConnected) {
			return console.error("MQTT Client is not connected.");
		}

		this.mqttClient.send(topic, message, qos)
	},
	recvMessage(topic, message) {
		try {
			if(this.mqttClient == null || !this.mqttConnected) {
				return console.error("MQTT Client is not connected.");
			}

			// console.log(`Message recv :: [${topic}] ${message}`);

			this.onMessage(message);

		} catch (error) {
			console.log("recvMessage Err", error)
		}
	},

	sendMessage(message) {
		// console.log(`Message send :: ${message}`);

		if(this.mqttInfo.topic == TOPIC_TYPE.DISPLAY) {
			var topic = this.projectCode + TOPIC_TYPE.CONTROL;
		}else{
			var topic = this.projectCode + TOPIC_TYPE.DISPLAY;
		}

		this.publish(topic, message);
	},

	onConnected : function() {},
	onMessage : function() {}
}

