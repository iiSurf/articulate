// Saying a word out loud with the phone's own voice (American English), until the recorded voice clips exist.
// Listen (the teammate's part) can use it too.

export const canSpeak = () => typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined";

// The phone's American voice, if it has one. Voices can arrive a moment after the page opens.
function americanVoice() {
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang === "en-US" && v.localService) || voices.find((v) => v.lang === "en-US") || voices.find((v) => v.lang?.startsWith("en"));
}

// Says the word: at normal speed, or slowly. Resolves when it's done (or right away if the phone can't speak).
export function say(word, { slow = false } = {}) {
  if (!canSpeak()) return Promise.resolve(false);
  speechSynthesis.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = "en-US";
    const voice = americanVoice();
    if (voice) u.voice = voice;
    u.rate = slow ? 0.55 : 0.95;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    speechSynthesis.speak(u);
  });
}
