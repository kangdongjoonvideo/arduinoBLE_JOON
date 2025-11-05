// 소문자 (아두이노와 동일하게 입력)
const SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214"; 
const WRITE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214"; 
let writeChar, statusP, connectBtn, sendBtn1, sendBtn2, sendBtn3;
let circleColor;

// 가속도 센서 관련 변수
let accelBtn, accelStatusP, accelDataP;
let accelX = 0, accelY = 0, accelZ = 0;
let isAccelActive = false;
let ballX, ballY;
let ballVx = 0, ballVy = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // BLE 연결
  connectBtn = createButton("Scan & Connect");
  connectBtn.mousePressed(connectAny);
  connectBtn.size(120, 30);
  connectBtn.position(20, 40);

  statusP = createP("Status: Not connected");
  statusP.position(22, 60);

  // 초기 원 색상 설정
  circleColor = 'red';

  // Send 버튼들
  sendBtn1 = createButton("send 1");
  sendBtn1.mousePressed(() => {
    sendNumber(1);
    circleColor = 'red';
  });
  sendBtn1.size(100, 30);
  sendBtn1.position(20, 100);

  sendBtn2 = createButton("send 2");
  sendBtn2.mousePressed(() => {
    sendNumber(2);
    circleColor = 'green';
  });
  sendBtn2.size(100, 30);
  sendBtn2.position(20, 140);

  sendBtn3 = createButton("send 3");
  sendBtn3.mousePressed(() => {
    sendNumber(3);
    circleColor = 'blue';
  });
  sendBtn3.size(100, 30);
  sendBtn3.position(20, 180);

  // 가속도 센서 활성화 버튼
  accelBtn = createButton("Enable Accelerometer");
  accelBtn.mousePressed(enableAccelerometer);
  accelBtn.size(150, 30);
  accelBtn.position(20, 220);

  accelStatusP = createP("Accelerometer: Not active");
  accelStatusP.position(22, 250);

  accelDataP = createP("X: 0, Y: 0, Z: 0");
  accelDataP.position(22, 270);

  // 공의 초기 위치 (화면 중앙)
  ballX = width / 2;
  ballY = height / 2;
}

function draw() {
  background(255);
  
  // 중앙에 크기 200인 원 그리기
  fill(circleColor);
  noStroke();
  circle(width / 2, height / 2, 200);

  // 가속도 센서가 활성화된 경우 공 그리기 및 이동
  if (isAccelActive) {
    // 가속도 값에 따른 속도 업데이트
    // 가속도 값을 속도 변화량으로 사용 (반전하여 자연스러운 움직임)
    ballVx += -accelX * 0.5;
    ballVy += accelY * 0.5;
    
    // 마찰 적용
    ballVx *= 0.95;
    ballVy *= 0.95;
    
    // 위치 업데이트
    ballX += ballVx;
    ballY += ballVy;
    
    // 화면 경계 체크 및 반사
    const radius = 50;
    if (ballX < radius || ballX > width - radius) {
      ballVx *= -0.8;
      ballX = constrain(ballX, radius, width - radius);
    }
    if (ballY < radius || ballY > height - radius) {
      ballVy *= -0.8;
      ballY = constrain(ballY, radius, height - radius);
    }
    
    // 공 그리기 (가속도 기반 회전 각도 계산)
    push();
    translate(ballX, ballY);
    // 가속도 벡터를 기반으로 회전 각도 계산
    let angle = atan2(accelY, accelX);
    rotate(angle);
    
    fill(0);
    noStroke();
    circle(0, 0, 100);
    
    // 회전 방향 표시를 위한 작은 점
    fill(255);
    circle(40, 0, 8);
    
    pop();
  } else {
    // 비활성화 상태에서는 중앙에 고정
    ballX = width / 2;
    ballY = height / 2;
    ballVx = 0;
    ballVy = 0;
    
    fill(0);
    noStroke();
    circle(ballX, ballY, 100);
  }
}

// ---- BLE Connect ----
async function connectAny() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID],
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    writeChar = await service.getCharacteristic(WRITE_UUID);
    statusP.html("Status: Connected to " + (device.name || "device"));
  } catch (e) {
    statusP.html("Status: Error - " + e);
    console.error(e);
  }
}

// ---- Write 1 byte to BLE ----
async function sendNumber(n) {
  if (!writeChar) {
    statusP.html("Status: Not connected");
    return;
  }
  try {
    await writeChar.writeValue(new Uint8Array([n & 0xff]));
    statusP.html("Status: Sent " + n);
  } catch (e) {
    statusP.html("Status: Write error - " + e);
  }
}

// ---- 가속도 센서 활성화 ----
function enableAccelerometer() {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    // iOS 13+ 권한 요청
    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response == 'granted') {
          startAccelerometer();
        } else {
          accelStatusP.html("Accelerometer: Permission denied");
        }
      })
      .catch(console.error);
  } else {
    // Android 및 기타 브라우저 (권한 요청 불필요)
    startAccelerometer();
  }
}

function startAccelerometer() {
  window.addEventListener('devicemotion', handleMotion);
  isAccelActive = true;
  accelStatusP.html("Accelerometer: Active");
}

function handleMotion(event) {
  if (event.accelerationIncludingGravity) {
    accelX = event.accelerationIncludingGravity.x || 0;
    accelY = event.accelerationIncludingGravity.y || 0;
    accelZ = event.accelerationIncludingGravity.z || 0;
    
    // 가속도 값을 텍스트로 업데이트
    accelDataP.html(`X: ${accelX.toFixed(2)}, Y: ${accelY.toFixed(2)}, Z: ${accelZ.toFixed(2)}`);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 화면 크기가 변경되면 공의 위치를 중앙으로 재조정
  if (!isAccelActive) {
    ballX = width / 2;
    ballY = height / 2;
  }
}
