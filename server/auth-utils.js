import { randomBytes, randomInt, createHash, createHmac } from "node:crypto";
export const WORDS =
  "otter beaver platypus koala panda badger fox rabbit robin raven heron eagle owl sparrow finch puffin penguin dolphin whale turtle gecko lizard frog newt axolotl alpaca llama camel pony zebra giraffe hippo rhino tiger lion lynx bobcat puma jaguar cheetah leopard wolf coyote dingo bear polar moose deer elk reindeer bison yak buffalo goat sheep ram lamb pig boar hedgehog porcupine squirrel chipmunk possum wombat wallaby kangaroo quokka sloth lemur monkey gibbon gorilla orangutan seal walrus manatee narwhal orca squid octopus starfish crab lobster shrimp snail moth beetle cricket dragonfly firefly bee robot rover orbit comet rocket planet galaxy nebula nova cosmo pixel widget gadget circuit copper spark bolt neon laser radar sonar piston motor servo gear spring button toggle beacon puzzle marble pebble river meadow forest maple cedar willow acorn clover sunny cloud rainbow bubble bumble happy hello gentle bright curious clever nimble jolly mellow friendly sprout tinker wonder doodle".split(
    " ",
  );
export const LINK_TTL_MS = 5 * 60 * 1000;
export const COOKIE_NAME = "ls_session";
export const hashToken = (token) =>
  createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export function kidCode() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let a = WORDS[randomInt(WORDS.length)],
    b;
  do {
    b = WORDS[randomInt(WORDS.length)];
  } while (b === a);
  return `${a}-${b}-${Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("")}`;
}
export function rateKey(ip, purpose, secret) {
  return createHmac("sha256", secret).update(`${purpose}:${ip}`).digest("hex");
}
export function readCookie(header, name = COOKIE_NAME) {
  for (const part of (header || "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}
export function sessionCookie(
  token,
  { secure = true, maxAge = 7 * 86400 } = {},
) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}
export function normalizeLesson(value = "first-circuit") {
  if (!["first-circuit", "fruit-piano"].includes(value)) throw Error("Invalid progress lesson.");
  return value;
}
export function normalizeProgress(input, lesson = "first-circuit") {
  normalizeLesson(lesson);
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw Error("Invalid progress.");
  const parts = lesson === "fruit-piano" ? ["board", "usb", "clips", "fruit", "computer", "mat"] : ["board", "usb", "breadboard", "led", "resistor", "wires"];
  const result = {
    step:
      Number.isInteger(input.step) && input.step >= -1 && input.step <= 5
        ? input.step
        : -1,
    speed: [250, 500, 1000].includes(input.speed) ? input.speed : 500,
    color: ["#d25f4d", "#6b9b70", "#d5b549"].includes(input.color)
      ? input.color
      : "#d25f4d",
    completed: [
      ...new Set(
        Array.isArray(input.completed)
          ? input.completed.filter(
              (n) => Number.isInteger(n) && n >= -1 && n <= 5,
            )
          : [],
      ),
    ],
    found: [
      ...new Set(
        Array.isArray(input.found)
          ? input.found.filter((id) => parts.includes(id))
          : [],
      ),
    ],
  };
  return result;
}
export function normalizeName(value) {
  if (typeof value !== "string") throw Error("Enter a nickname.");
  const name = value.trim();
  if (name.length < 1 || name.length > 32 || /[\u0000-\u001f<>]/.test(name))
    throw Error("Use a nickname of 1–32 characters.");
  return name;
}
