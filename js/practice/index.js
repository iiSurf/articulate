// The Practice part (the teammate's): plugs its screens into the app. js/app.js loads this file by itself.
// Read, Listen, and Speak are the three ways to practice ("Right now I can…").
import { registerScreen } from "../app.js";
import { speak } from "./speak.js";
import { listen } from "./listen.js";
import { read } from "./read.js";

const css = document.createElement("link");
css.rel = "stylesheet";
css.href = new URL("./practice.css", import.meta.url).href;
document.head.append(css);

registerScreen("read", read);
registerScreen("listen", listen);
registerScreen("speak", speak);
