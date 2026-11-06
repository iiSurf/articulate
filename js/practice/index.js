// The Practice part (the teammate's): plugs its screens into the app. js/app.js loads this file by itself.
// Speak is first. Listen and Read come next; until they register, the app shows "This part is being built".
import { registerScreen } from "../app.js";
import { speak } from "./speak.js";

const css = document.createElement("link");
css.rel = "stylesheet";
css.href = new URL("./practice.css", import.meta.url).href;
document.head.append(css);

registerScreen("speak", speak);
