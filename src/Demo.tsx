import { useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

function Demo() {
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

    const transcode = async () => {
        const videoURL = "/video-15s.avi";
        const ffmpeg = ffmpegRef.current;
        await ffmpeg.writeFile("input.avi", await fetchFile(videoURL));
        await ffmpeg.exec(["-i", "input.avi", "output.mp4"]);
        await ffmpeg.exec(["-i", "input.avi", "-f", "flv", "rtmp://localhost:1935/live/mychannel3"]);
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
            <video ref={videoRef} controls></video>
            <br />
            <button onClick={transcode}>Transcode avi to mp4</button>
            <p ref={messageRef}></p>
        </>
    ) : (
        <button onClick={load}>Load ffmpeg-core</button>
    );
}

export default Demo;