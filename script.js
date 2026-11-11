function darkmode() {
    document.body.style.backgroundColor = "black";
    document.body.style.color = "white";
}
const live = document.getElementById("cameraFeed");

navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    live.srcObject = stream;
})
.catch(error => {
    console.error("Error accessing camera:", error);
});