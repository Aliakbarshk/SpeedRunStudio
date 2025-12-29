import { TimelineClip, Subtitle } from "../types";

export const processVideoWithTimeline = async (
  videoFile: File,
  audioBlob: Blob,
  videoClips: TimelineClip[],
  audioClips: TimelineClip[],
  subtitles: Subtitle[],
  onProgress: (percent: number) => void,
  turboMode: boolean = true
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(videoFile);
    const audioUrl = URL.createObjectURL(audioBlob);

    const videoEl = document.createElement("video");
    videoEl.muted = true;
    videoEl.src = videoUrl;
    videoEl.crossOrigin = "anonymous";
    videoEl.preload = "auto";

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

    if (!ctx) return reject(new Error("Canvas context error"));

    videoEl.onloadedmetadata = () => {
      const MAX_HEIGHT = turboMode ? 720 : 1080;
      let width = videoEl.videoWidth;
      let height = videoEl.videoHeight;
      if (height > MAX_HEIGHT) {
        const ratio = MAX_HEIGHT / height;
        height = MAX_HEIGHT;
        width = Math.round(width * ratio);
      }
      canvas.width = width;
      canvas.height = height;
    };

    const audioContext = new AudioContext();
    const audioDest = audioContext.createMediaStreamDestination();

    const videoStream = canvas.captureStream(60);
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioDest.stream.getAudioTracks()
    ]);

    const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/mp4'];
    const validMime = mimeTypes.find(m => MediaRecorder.isTypeSupported(m)) || '';
    
    const recorder = new MediaRecorder(combinedStream, { 
      mimeType: validMime, 
      videoBitsPerSecond: turboMode ? 4000000 : 12000000 
    });

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      URL.revokeObjectURL(videoUrl);
      URL.revokeObjectURL(audioUrl);
      audioContext.close();
      resolve(new Blob(chunks, { type: validMime }));
    };

    const runProcessing = async () => {
      const sortedVideo = [...videoClips].sort((a, b) => a.timelineStart - b.timelineStart);
      const sortedAudio = [...audioClips].sort((a, b) => a.timelineStart - b.timelineStart);
      
      const totalDuration = Math.max(
        ...sortedVideo.map(c => c.timelineStart + (c.endTime - c.startTime) / c.playbackRate),
        ...sortedAudio.map(c => c.timelineStart + (c.endTime - c.startTime) / c.playbackRate),
        ...subtitles.map(s => s.endTime)
      );

      const audioArrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);

      recorder.start();
      
      sortedAudio.forEach(clip => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.value = clip.playbackRate;
        source.connect(audioDest);
        source.start(audioContext.currentTime + clip.timelineStart, clip.startTime, (clip.endTime - clip.startTime) / clip.playbackRate);
      });

      let timelineClock = 0;
      const fps = 60;
      const frameDuration = 1 / fps;

      const renderFrame = async () => {
        if (recorder.state === 'inactive') return;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const activeClip = sortedVideo.find(c => {
          const dur = (c.endTime - c.startTime) / c.playbackRate;
          return timelineClock >= c.timelineStart && timelineClock <= (c.timelineStart + dur);
        });

        if (activeClip) {
          const timeIntoClip = timelineClock - activeClip.timelineStart;
          const sourceTime = activeClip.startTime + (timeIntoClip * activeClip.playbackRate);
          
          if (Math.abs(videoEl.currentTime - sourceTime) > 0.05) {
            videoEl.currentTime = sourceTime;
            if (Math.abs(videoEl.currentTime - sourceTime) > 0.5) {
              await new Promise(r => videoEl.onseeked = r);
            }
          }
          
          ctx.filter = activeClip.filter || 'none';
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          ctx.filter = 'none';
        }

        // Subtitles Logic
        const activeSubs = subtitles.filter(s => timelineClock >= s.startTime && timelineClock <= s.endTime);
        if (activeSubs.length > 0) {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          activeSubs.forEach(sub => {
            const progress = (timelineClock - sub.startTime) / (sub.endTime - sub.startTime);
            let scale = 1.0;
            if (sub.effect === 'pop') {
              scale = 0.5 + Math.sin(progress * Math.PI) * 0.7;
            }
            
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height * 0.8);
            ctx.scale(scale, scale);
            
            ctx.font = `black ${Math.round(canvas.height * 0.12)}px Outfit, sans-serif`;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 8;
            ctx.strokeText(sub.text, 0, 0);
            
            const gradient = ctx.createLinearGradient(-100, 0, 100, 0);
            gradient.addColorStop(0, '#f472b6'); // pink-400
            gradient.addColorStop(1, '#6366f1'); // indigo-500
            ctx.fillStyle = gradient;
            ctx.fillText(sub.text, 0, 0);
            ctx.restore();
          });
        }

        onProgress((timelineClock / totalDuration) * 100);
        timelineClock += frameDuration;

        if (timelineClock >= totalDuration) {
          recorder.stop();
        } else {
          requestAnimationFrame(renderFrame);
        }
      };

      await videoEl.play();
      renderFrame();
    };

    videoEl.oncanplay = () => {
      if (videoEl.readyState >= 3) {
        runProcessing().catch(reject);
        videoEl.oncanplay = null;
      }
    };
  });
};

export const processVideoAndAudio = async (
  videoFile: File,
  audioBlob: Blob,
  onProgress: (percent: number) => void,
  turboMode: boolean = true
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    const vUrl = URL.createObjectURL(videoFile);
    v.src = vUrl;
    v.onloadedmetadata = () => {
      const duration = v.duration;
      const a = document.createElement('audio');
      a.src = URL.createObjectURL(audioBlob);
      a.onloadedmetadata = () => {
        const audioDuration = a.duration;
        URL.revokeObjectURL(vUrl);
        const vClips: TimelineClip[] = [{ id: 'v1', type: 'video', startTime: 0, endTime: duration, timelineStart: 0, playbackRate: 1.0 }];
        const aClips: TimelineClip[] = [{ id: 'a1', type: 'audio', startTime: 0, endTime: audioDuration, timelineStart: 0, playbackRate: 1.0 }];
        processVideoWithTimeline(videoFile, audioBlob, vClips, aClips, [], onProgress, turboMode)
          .then(resolve)
          .catch(reject);
      };
    };
  });
};