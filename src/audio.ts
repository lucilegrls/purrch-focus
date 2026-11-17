let context: AudioContext | undefined;
let source: AudioBufferSourceNode | undefined;
let gain: GainNode | undefined;
export function stopAudio() {
  source?.stop();
  source = undefined;
  if (context) {
    void context.close();
    context = undefined;
  }
}
export async function playAudio(kind: "rain" | "purr", volume: number) {
  stopAudio();
  context = new AudioContext();
  await context.resume();
  const length = context.sampleRate * 4;
  const b = context.createBuffer(1, length, context.sampleRate);
  const data = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    last = (last + Math.random() * 0.04 - 0.02) / 1.02;
    data[i] =
      kind === "rain"
        ? last * 3
        : last *
          (0.6 + 0.4 * Math.sin((i / context.sampleRate) * Math.PI * 48)) *
          5;
  }
  source = context.createBufferSource();
  source.buffer = b;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = kind === "rain" ? 1500 : 250;
  gain = context.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(context.destination);
  source.start();
}
export function setVolume(volume: number) {
  if (gain) gain.gain.value = volume;
}
