function darkmode() {
    document.body.style.backgroundColor = "black";
    document.body.style.color = "white";
}
const live = document.getElementById("cameraFeed");
const startButton = document.getElementById("startRecording");
const stopButton = document.getElementById("stopRecording");
const recordingStatus = document.getElementById("recordingStatus");
const timerElement = document.getElementById("timer");
const downloadLink = document.getElementById("downloadRecording");
const onCameraButton = document.getElementById("onCameraButton"); 
const offCameraButton = document.getElementById("offCameraButton");
const videoQuality = document.getElementById("videoQuality");
const pass = document.getElementById("passwordInput");
const visible = document.getElementById("visible")
const locate = document.getElementById("locate")

function locateMe() {
    navigator.geolocation.getCurrentPosition (
        position => {
            locate.innerHTML=`<p>Latitude:${position.coords.latitude} <br>
            longitude:${position.coords.longitude}
            </p>`
        },
        error => console.error(error, "permission denied or error")
    )
}

function toggle() {
    if (pass.type=="password") {
        pass.type="text"
        visible.innerText='hide'
    } else {
        pass.type="password"
    }
}
const qualityPresets = {
    480: { width: 640, height: 480, bitrate: 1_000_000 },
    720: { width: 1280, height: 720, bitrate: 2_500_000 },
    1080: { width: 1920, height: 1080, bitrate: 5_000_000 }
};

let recorder;
let recordedChunks = [];
let recordingUrl;
let timerInterval;

function onCamera() {
    onCameraButton.disabled = true;
    offCameraButton.disabled = false;
    live.style.display = "block";
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        recordingStatus.textContent = "Camera recording is not supported in this browser.";
        onCameraButton.disabled = false;
        offCameraButton.disabled = true;
    } else {
    const preset = qualityPresets[videoQuality.value];
    navigator.mediaDevices.getUserMedia({
        video: {
            width: { ideal: preset.width },
            height: { ideal: preset.height }
        }
    })
        .then(stream => {
            live.srcObject = stream;
            recorder = new MediaRecorder(stream, {
                videoBitsPerSecond: preset.bitrate
            });
            videoQuality.disabled = true;

            recorder.addEventListener("dataavailable", event => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            });

            recorder.addEventListener("stop", () => {
                const blob = new Blob(recordedChunks, { type: recorder.mimeType });
                recordedChunks = [];
                recordingUrl = URL.createObjectURL(blob);
                downloadLink.href = recordingUrl;
                downloadLink.download = `recording.${blob.type.includes("mp4") ? "mp4" : "webm"}`;
                downloadLink.hidden = false;
                recordingStatus.textContent = "Recording finished. Download it below.";
            });
            
            startButton.disabled = false;
            recordingStatus.textContent = "Camera ready.";
        })
        .catch(error => {
            console.error("Error accessing camera:", error);
            recordingStatus.textContent = "Could not access the camera. Check browser permissions.";
            onCameraButton.disabled = false;
            offCameraButton.disabled = true;
            live.style.display = "none";
        });
    }
    
    
}

function offCamera() {
    onCameraButton.disabled = false;
    offCameraButton.disabled = true;
    videoQuality.disabled = false;

    live.srcObject.getTracks().forEach(track => track.stop());
    live.srcObject = null;
    live.style.display = "none";
}
startButton.addEventListener("click", () => {
    if (!recorder || recorder.state !== "inactive") return;

    if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
        recordingUrl = undefined;
    }
    
    let seconds = 0;

    timerInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, 1000);
    downloadLink.hidden = true;
    recordedChunks = [];
    recorder.start();
    startButton.disabled = true;
    stopButton.disabled = false;
    recordingStatus.textContent = "Recording...";
});

stopButton.addEventListener("click", () => {
    if (!recorder || recorder.state !== "recording") return;

    recorder.stop();
    startButton.disabled = false;
    stopButton.disabled = true;
    clearInterval(timerInterval);
    timerElement.textContent = "00:00";
});

