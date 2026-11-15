// Theme songs for Settings. ALPHA is synthesised in the browser; the others play through YouTube's own
// embedded player (visible, as YouTube requires), so no audio file is copied or hosted here.
// Four themed songs also change the home page backdrop; every other page stays the same.

export type Scene = "solar" | "blackhole" | "tauceti" | "runner" | "earthrise";
export type TrackIcon = "runner" | "blackhole" | "tauceti" | "earthrise";

export interface Track {
  id: string;
  label: string;
  /** Greek-letter songs are colour coded; the themed ones carry an icon instead. */
  color?: string;
  icon?: TrackIcon;
  title: string;
  artist: string;
  credit: { en: string; km: string };
  youtube?: string;
  /**
   * A licensed audio file in public/audio/ (for example "/audio/beta.mp3"). When set, the song plays in the
   * background with no visible player. Only add a file the team has a licence to publish on a website.
   */
  audio?: string;
  scene: Scene;
  sceneNote?: { en: string; km: string };
}

export const TRACKS: Track[] = [
  {
    id: "alpha",
    label: "ALPHA",
    color: "#6ea8ff",
    title: "Terratoria Theme",
    artist: "Terratoria",
    credit: { en: "Synthesised live in your browser (Web Audio API).", km: "បង្កើតដោយផ្ទាល់ក្នុងកម្មវិធីរុករករបស់អ្នក (Web Audio API)។" },
    scene: "solar",
  },
  {
    id: "beta",
    label: "BETA",
    color: "#b58cff",
    title: "Cosmic Voyager",
    artist: "MokkaMusic",
    credit: { en: "Music: \"Cosmic Voyager\" by MokkaMusic (Mokka - No Copyright Music).", km: "តន្ត្រី៖ \"Cosmic Voyager\" ដោយ MokkaMusic (Mokka - No Copyright Music)។" },
    youtube: "RKtYSD6Bjzc",
    scene: "solar",
  },
  {
    id: "gamma",
    label: "GAMMA",
    color: "#3ddc97",
    title: "Hidden Layer",
    artist: "MokkaMusic",
    credit: { en: "Music: \"Hidden Layer\" by MokkaMusic (Mokka - No Copyright Music).", km: "តន្ត្រី៖ \"Hidden Layer\" ដោយ MokkaMusic (Mokka - No Copyright Music)។" },
    youtube: "gIJHIIJs2go",
    scene: "solar",
  },
  {
    id: "delta",
    label: "DELTA",
    color: "#ffb547",
    title: "Space Cinematic Ambient",
    artist: "Tunetank",
    credit: { en: "Music: \"Space Cinematic Ambient\" by Tunetank.", km: "តន្ត្រី៖ \"Space Cinematic Ambient\" ដោយ Tunetank។" },
    youtube: "ozb32hgHdo4",
    scene: "solar",
  },
  {
    id: "epsilon",
    label: "EPSILON",
    color: "#ff6b8b",
    title: "Everdream",
    artist: "Epic Soul Factory",
    credit: { en: "Music: \"Everdream\" by Epic Soul Factory, via HDSounDI.", km: "តន្ត្រី៖ \"Everdream\" ដោយ Epic Soul Factory តាមរយៈ HDSounDI។" },
    youtube: "RCMXO9sBIcU",
    scene: "solar",
  },
  {
    id: "zeta",
    label: "ZETA",
    color: "#4fd1ff",
    title: "Make Me Move (feat. Karra)",
    artist: "Culture Code",
    credit: { en: "Music: \"Make Me Move (feat. Karra)\" by Culture Code. Provided by NCS (NoCopyrightSounds).", km: "តន្ត្រី៖ \"Make Me Move (feat. Karra)\" ដោយ Culture Code។ ផ្តល់ដោយ NCS (NoCopyrightSounds)។" },
    youtube: "vBGiFtb8Rpw",
    scene: "solar",
  },
  {
    id: "flow",
    label: "FLOW | NULLSCAPE",
    icon: "runner",
    title: "Flow",
    artist: "Creo",
    credit: { en: "Music: \"Flow\" by Creo.", km: "តន្ត្រី៖ \"Flow\" ដោយ Creo។" },
    youtube: "MM87r7GjzW8",
    scene: "runner",
    sceneNote: { en: "Home page becomes a black-and-white geometry run: a cube leaps spike after spike under a glowing orb, pulsing to the beat.", km: "ទំព័រដើមប្រែជាការរត់ធរណីមាត្រពណ៌ស-ខ្មៅ៖ គូបលោតរំលងបន្លាម្តងមួយៗ ក្រោមដួងពន្លឺ តាមចង្វាក់ភ្លេង។" },
  },
  {
    id: "interstellar",
    label: "INTERSTELLAR | MAIN THEME",
    icon: "blackhole",
    title: "Interstellar Main Theme",
    artist: "Hans Zimmer",
    credit: { en: "Music: Interstellar Main Theme by Hans Zimmer (video uploaded by PowerStanik).", km: "តន្ត្រី៖ Interstellar Main Theme ដោយ Hans Zimmer (វីដេអូបង្ហោះដោយ PowerStanik)។" },
    youtube: "LpGx4uqtvgs",
    scene: "blackhole",
    sceneNote: { en: "Home page becomes a spinning black hole.", km: "ទំព័រដើមប្រែជារន្ធខ្មៅដែលកំពុងវិល។" },
  },
  {
    id: "hailmary",
    label: "HAIL MARY | SIGN OF THE TIMES",
    icon: "tauceti",
    title: "Sign of the Times",
    artist: "Harry Styles",
    credit: { en: "Music: \"Sign of the Times\" by Harry Styles (official video, HarryStylesVEVO).", km: "តន្ត្រី៖ \"Sign of the Times\" ដោយ Harry Styles (វីដេអូផ្លូវការ HarryStylesVEVO)។" },
    youtube: "qN4ooNx77u0",
    scene: "tauceti",
    sceneNote: { en: "Home page becomes the Tau Ceti system, with a ship orbiting the green world Tau Ceti e, and the title reads HAIL MARY.", km: "ទំព័រដើមប្រែជាប្រព័ន្ធ Tau Ceti ដែលមានយានហោះជុំវិញភពពណ៌បៃតង Tau Ceti e ហើយចំណងជើងប្តូរជា HAIL MARY។" },
  },
  {
    id: "edgerunners",
    label: "EDGERUNNERS | STAY AT YOUR HOUSE",
    icon: "earthrise",
    title: "I Really Want to Stay At Your House",
    artist: "Rosa Walton",
    credit: {
      en: "Music: \"I Really Want to Stay At Your House\" by Rosa Walton (with Hallie Coggins), from the Cyberpunk 2077 soundtrack (CD PROJEKT RED), featured in the anime Cyberpunk: Edgerunners (Studio Trigger, CD PROJEKT RED, Netflix). Official music video uploaded by Netflix.",
      km: "តន្ត្រី៖ \"I Really Want to Stay At Your House\" ដោយ Rosa Walton (ជាមួយ Hallie Coggins) ពីបទភ្លេង Cyberpunk 2077 (CD PROJEKT RED) ដែលបង្ហាញក្នុងគំនូរជីវចល Cyberpunk: Edgerunners (Studio Trigger, CD PROJEKT RED, Netflix)។ វីដេអូតន្ត្រីផ្លូវការបង្ហោះដោយ Netflix។",
    },
    youtube: "KvMY1uzSC1E",
    scene: "earthrise",
    sceneNote: { en: "Home page moves to the surface of the Moon, with Earth hanging over the horizon.", km: "ទំព័រដើមផ្លាស់ទៅលើផ្ទៃព្រះច័ន្ទ ដោយមានផែនដីព្យួរនៅលើជើងមេឃ។" },
  },
];

export const trackById = (id: string) => TRACKS.find((t) => t.id === id) ?? TRACKS[0];
