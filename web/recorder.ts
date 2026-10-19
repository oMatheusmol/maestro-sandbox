const record = document.querySelector<HTMLButtonElement>("#record")!;
const stop = document.querySelector<HTMLButtonElement>("#stop")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const notes = document.querySelector<HTMLUListElement>("#notes")!;

let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let startedAt = 0;

/** A note's size as the list shows it, in whole kilobytes. */
const kilobytes = (bytes: number) => `${Math.ceil(bytes / 1024)} KB`;

record.addEventListener("click", async () => {
  record.disabled = true;
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    record.disabled = false;
    status.textContent = "The microphone is not available. Allow it in the browser and try again.";
    return;
  }
  chunks = [];
  recorder = new MediaRecorder(stream);
  recorder.addEventListener("dataavailable", (event) => chunks.push(event.data));
  recorder.start();
  startedAt = performance.now();
  stop.disabled = false;
  status.textContent = "Recording…";
});

stop.addEventListener("click", async () => {
  if (!recorder) return;
  stop.disabled = true;
  const recordedRecorder = recorder;
  const seconds = (performance.now() - startedAt) / 1000;
  recorder = null;

  recordedRecorder.addEventListener("stop", async () => {
    // Stopping the tracks here, after the last chunk arrives, keeps the final audio in the note.
    recordedRecorder.stream.getTracks().forEach((track) => track.stop());
    const note = new Blob(chunks, { type: recordedRecorder.mimeType });
    if (note.size === 0) {
      status.textContent = "Nothing was recorded. Try again.";
      record.disabled = false;
      return;
    }
    status.textContent = "Sending…";
    try {
      const response = await fetch("/api/notes", { method: "POST", headers: { "content-type": note.type || "application/octet-stream" }, body: note });
      status.textContent = response.ok ? "Sent with your order." : `Not sent (${response.status}). Try again.`;
    } catch {
      status.textContent = "Not sent: no connection. Try again.";
    }
    const item = document.createElement("li");
    item.textContent = `Voice note · ${seconds.toFixed(1)} s · ${kilobytes(note.size)}`;
    notes.prepend(item);
    record.disabled = false;
  });

  recordedRecorder.stop();
});
