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
    } else {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            live.srcObject = stream;
            recorder = new MediaRecorder(stream);

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
        });
    }
    
    
}

function offCamera() {
onCameraButton.disabled = false;
    offCameraButton.disabled = true;
    
    live.srcObject.getTracks().forEach(track => track.stop());
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

