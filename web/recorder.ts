const record = document.querySelector<HTMLButtonElement>("#record")!;
const stop = document.querySelector<HTMLButtonElement>("#stop")!;
const status = document.querySelector<HTMLParagraphElement>("#status")!;
const notes = document.querySelector<HTMLUListElement>("#notes")!;
const recorderSection = document.querySelector<HTMLElement>("#recorder")!;

let recorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let startedAt = 0;

const START_TIMEOUT_MS = 5000;

/** A note's size as the list shows it, in whole kilobytes. */
const kilobytes = (bytes: number) => `${Math.ceil(bytes / 1024)} KB`;

record.addEventListener("click", async () => {
  recorderSection.dataset.capturedBytes = "0";
  record.disabled = true;
  status.textContent = "Waiting for microphone permission…";
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    record.disabled = false;
    status.textContent = "The microphone is not available. Allow it in the browser and try again.";
    return;
  }
  chunks = [];
  const startingRecorder = new MediaRecorder(stream);
  recorder = startingRecorder;
  startingRecorder.addEventListener("dataavailable", (event) => {
    chunks.push(event.data);
    recorderSection.dataset.capturedBytes = String(chunks.reduce((total, chunk) => total + chunk.size, 0));
  });
  // If the recorder never reports its start, release the microphone and let the person try again.
  const startTimer = setTimeout(() => {
    startingRecorder.stream.getTracks().forEach((track) => track.stop());
    recorder = null;
    record.disabled = false;
    status.textContent = "Recording did not start. Try again.";
  }, START_TIMEOUT_MS);
  startingRecorder.addEventListener("start", () => {
    // A start that arrives after the timeout, or for a newer recording, is ignored.
    if (recorder !== startingRecorder) return;
    clearTimeout(startTimer);
    startedAt = performance.now();
    stop.disabled = false;
    status.textContent = "Recording…";
  });
  // Chunks arrive every 100 ms, so the captured audio is reported while recording, before Stop.
  try {
    startingRecorder.start(100);
  } catch {
    clearTimeout(startTimer);
    stream.getTracks().forEach((track) => track.stop());
    recorder = null;
    record.disabled = false;
    status.textContent = "Recording could not start. Try again.";
  }
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
