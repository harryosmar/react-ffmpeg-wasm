import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

function Webcam() {
    const [loaded, setLoaded] = useState(false);
    const ffmpegRef = useRef(new FFmpeg());
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const messageRef = useRef<HTMLParagraphElement | null>(null)

    const load = async () => {
        const baseURL = "";
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on("log", ({ message }) => {
            if (messageRef.current) messageRef.current.innerHTML = message;
        });
        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await ffmpeg.load({
            coreURL: `${baseURL}/ffmpeg-core.js`,
            wasmURL: `${baseURL}/ffmpeg-core.wasm`,
            workerURL: `${baseURL}/ffmpeg-core.worker.js`,
        });
        setLoaded(true);
    };

//     ffmpeg -re -f avfoundation -framerate 30 -video_size 640x480 -i "0" -f avfoundation -i ":0" \
// -c:v libx264 -vf format=uyvy422 -b:v 4000k -bufsize 8000k -maxrate 4000k -g 30 \
// -c:a aac -b:a 192k -ar 48000 -af "equalizer=f=1000:t=q:w=1:g=5,loudnorm" \
// -f flv 'rtmp://localhost:1935/live/mychannel3'
    const transcode = async () => {
        const videoURL = "/video-15s.avi";
        const ffmpeg = ffmpegRef.current;
        await ffmpeg.writeFile("input.avi", await fetchFile(videoURL));
        await ffmpeg.exec(["-i", "input.avi", "output.mp4", "-f", "flv", "rtmp://localhost:1935/live/mychannel3"]);
        const fileData = await ffmpeg.readFile('output.mp4');
        const data = new Uint8Array(fileData as ArrayBuffer);
        if (videoRef.current) {
            videoRef.current.src = URL.createObjectURL(
                new Blob([data], { type: 'video/mp4' })
            )
        }
    };

    return loaded ? (
        <>
            <h3>Record video from webcam and transcode to mp4 (x264) and play!</h3>
            <div>
                <video id="webcam" width="320px" height="180px"></video>
                <video id="output-video" width="320px" height="180px" controls></video>
            </div>
            <button id="record" disabled>Start Recording</button>
            <p id="message"></p>
        </>
    ) : (
        <button onClick={load}>Load ffmpeg-core</button>
    );
}

export default Webcam;