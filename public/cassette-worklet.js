// The microphone's side of "listen to my cassette" (see lib/cassette/).
//
// An AudioWorklet runs on the browser's audio thread, which is the only place
// samples can be read without gaps. It does nothing clever: it folds whatever
// channels the microphone has down to one and hands the page ~2048 samples at
// a time. Everything else (resampling, recognising) happens in a Web Worker so
// that none of it can stall the audio thread or the lyrics' scrolling.
//
// It lives in public/ because addModule() needs a plain URL it can fetch.
class CassetteTap extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(2048);
    this.n = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const a = input[0];
    const b = input.length > 1 ? input[1] : null;
    for (let i = 0; i < a.length; i++) {
      this.buf[this.n++] = b ? (a[i] + b[i]) * 0.5 : a[i];
      if (this.n === this.buf.length) {
        this.port.postMessage(this.buf, [this.buf.buffer]);
        this.buf = new Float32Array(2048);
        this.n = 0;
      }
    }
    return true;
  }
}

registerProcessor("cassette-tap", CassetteTap);
