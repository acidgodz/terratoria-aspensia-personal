"use client";

import Link from "next/link";
import { useApp } from "@/components/AppState";
import { TrackBadge } from "@/components/MusicDock";
import { TeamSection } from "@/components/Team";
import { EARTH_SITES, REFERENCES } from "@/data/catalog";
import { TRACKS } from "@/data/tracks";

export default function AboutPage() {
  const { t, tx, lang } = useApp();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t("nav_about")}</h1>
        <p className="mt-2 text-lg text-muted">{t("tagline")}</p>
      </header>

      <TeamSection />

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("What is a planetary analogue?", "តើទីតាំងស្រដៀងភពគឺជាអ្វី?")}</h2>
        <p className="mt-2">
          {tx(
            "A terrestrial analogue is a place on Earth that shares specific characteristics with a place on another world: its rocks, its terrain, its cold, its dryness. Space agencies use analogues to train crews, test rovers and drills, and learn how to read landscapes before a mission arrives.",
            "ទីតាំងស្រដៀងលើផែនដី គឺជាកន្លែងមួយលើផែនដីដែលមានលក្ខណៈជាក់លាក់ដូចកន្លែងមួយនៅលើពិភពផ្សេង៖ ថ្ម សណ្ឋានដី ភាពត្រជាក់ ឬភាពស្ងួតរបស់វា។ ទីភ្នាក់ងារអវកាសប្រើទីតាំងស្រដៀងទាំងនេះដើម្បីហ្វឹកហាត់ក្រុមនាវិក សាកល្បងរ៉ូវើរ និងម៉ាស៊ីនខួង ហើយរៀនអានទេសភាព មុនពេលបេសកកម្មទៅដល់។",
          )}
        </p>
        <p className="mt-2">
          {tx(
            "Most analogue sites were chosen from field experience. Terratoria asks the question the other way round: start from a specific region on the Moon or Mars, say which properties matter, and rank Earth sites by how well the measurements and the published evidence agree.",
            "ទីតាំងស្រដៀងភាគច្រើនត្រូវបានជ្រើសរើសពីបទពិសោធន៍ទីវាល។ Terratoria សួរសំណួរផ្ទុយមកវិញ៖ ចាប់ផ្តើមពីតំបន់ជាក់លាក់មួយនៅលើព្រះច័ន្ទ ឬភពអង្គារ ប្រាប់ថាលក្ខណៈណាសំខាន់ ហើយដាក់ចំណាត់ថ្នាក់ទីតាំងផែនដីតាមកម្រិតដែលការវាស់វែង និងភស្តុតាងដែលបានបោះពុម្ពត្រូវគ្នា។",
          )}
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("What this version covers", "អ្វីដែលកំណែនេះគ្របដណ្តប់")}</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>{tx(`${REFERENCES.length} reference regions: two on the Moon, two on Mars.`, `តំបន់យោង ${REFERENCES.length}៖ ពីរនៅលើព្រះច័ន្ទ និងពីរនៅលើភពអង្គារ។`)}</li>
          <li>
            {tx(
              `${EARTH_SITES.length} Earth sites on seven continents, from long-established analogues to three untested candidates.`,
              `ទីតាំងផែនដី ${EARTH_SITES.length} នៅលើទ្វីបទាំងប្រាំពីរ ចាប់ពីទីតាំងស្រដៀងដែលបានទទួលស្គាល់យូរមកហើយ រហូតដល់ទីតាំងបេក្ខភាពបីដែលមិនទាន់សាកល្បង។`,
            )}
          </li>
          <li>{tx("Three dimensions built on data the team processed: terrain, temperature and wind.", "វិមាត្របីផ្អែកលើទិន្នន័យដែលក្រុមបានដំណើរការ៖ សណ្ឋានដី សីតុណ្ហភាព និងខ្យល់។")}</li>
          <li>{tx("Five dimensions built on cited literature, clearly labelled.", "វិមាត្រប្រាំផ្អែកលើឯកសារស្រាវជ្រាវដែលមានការដកស្រង់ ហើយមានស្លាកច្បាស់លាស់។")}</li>
        </ul>
        <p className="mt-3 text-muted">
          {t("coverage_note")} {t("screening_note")}
        </p>
        <Link href="/methods/" className="btn mt-4">
          {t("nav_methods")}
        </Link>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("Challenge", "បញ្ហាប្រកួត")}</h2>
        <p className="mt-2">
          {tx("Built for the NASA Space Apps Challenge 2026:", "បង្កើតសម្រាប់ NASA Space Apps Challenge 2026៖")}{" "}
          <a className="text-accent underline" href="https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/" target="_blank" rel="noreferrer">
            Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars
          </a>
          .
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("Use of AI", "ការប្រើប្រាស់ AI")}</h2>
        <p className="mt-2">
          {tx(
            "The idea and direction for PROJECT: Terratoria are the Aspensia team's. The application code, the data pipeline, the catalogue text and the Khmer interface strings were written with an AI coding assistant (Claude, by Anthropic) and reviewed by the team.",
            "គំនិត និងទិសដៅនៃ PROJECT: Terratoria គឺជារបស់ក្រុម Aspensia។ កូដកម្មវិធី ប្រព័ន្ធដំណើរការទិន្នន័យ អត្ថបទកាតាឡុក និងអត្ថបទចំណុចប្រទាក់ភាសាខ្មែរ ត្រូវបានសរសេរដោយមានជំនួយពីជំនួយការសរសេរកូដ AI (Claude ដោយ Anthropic) ហើយត្រូវបានពិនិត្យដោយក្រុម។",
          )}
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted">
          <li>
            {tx(
              "No AI-generated images are used. Relief views are drawn from mission elevation data; the basemap is NASA imagery.",
              "មិនប្រើរូបភាពដែលបង្កើតដោយ AI ទេ។ រូបសណ្ឋានដីត្រូវបានគូរពីទិន្នន័យកម្ពស់របស់បេសកកម្ម ហើយផែនទីមូលដ្ឋានជារូបភាពរបស់ NASA។",
            )}
          </li>
          <li>
            {tx(
              "No measured value was generated by AI. Terrain and climate numbers come from the pipeline's reading of the archives.",
              "គ្មានតម្លៃវាស់វែងណាមួយត្រូវបានបង្កើតដោយ AI ទេ។ តួលេខសណ្ឋានដី និងអាកាសធាតុមកពីការអានបណ្ណសាររបស់ប្រព័ន្ធដំណើរការទិន្នន័យ។",
            )}
          </li>
          <li>
            {tx(
              "Literature references were checked against Crossref and NASA records and are listed in APA 7th edition on the Data and Methods page. The Khmer translation was reviewed for accuracy.",
              "ឯកសារយោងត្រូវបានផ្ទៀងផ្ទាត់ជាមួយកំណត់ត្រា Crossref និង NASA ហើយមានរាយក្នុងទម្រង់ APA បោះពុម្ពលើកទី ៧ នៅទំព័រទិន្នន័យ និងវិធីសាស្ត្រ។ ការបកប្រែភាសាខ្មែរត្រូវបានពិនិត្យសម្រាប់ភាពត្រឹមត្រូវ។",
            )}
          </li>
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("Music", "តន្ត្រី")}</h2>
        <p className="mt-2 text-sm text-muted">
          {tx(
            "Theme songs are chosen in Settings. ALPHA is synthesised in your browser. The others stream from YouTube in its own player; no recording is copied or hosted on this site, and each remains its owner's work.",
            "បទភ្លេងប្រធានបទត្រូវបានជ្រើសរើសក្នុងការកំណត់។ ALPHA ត្រូវបានបង្កើតក្នុងកម្មវិធីរុករករបស់អ្នក។ បទផ្សេងទៀតចាក់ពី YouTube ក្នុងកម្មវិធីចាក់របស់វាផ្ទាល់ គ្មានការថតចម្លង ឬដាក់បង្ហោះនៅលើគេហទំព័រនេះទេ ហើយបទនីមួយៗនៅតែជាកម្មសិទ្ធិរបស់ម្ចាស់។",
          )}
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {TRACKS.map((tr) => (
            <li key={tr.id} className="flex items-start gap-3 rounded-xl border border-line p-3">
              <TrackBadge track={tr} size={30} />
              <span className="min-w-0 text-sm">
                <span className="block text-xs font-semibold tracking-wide" style={tr.color ? { color: tr.color } : undefined}>
                  {tr.label}
                </span>
                <span className="block font-medium">
                  {tr.title} · {tr.artist}
                </span>
                <span className="block text-xs text-muted">{tr.credit[lang]}</span>
                {tr.youtube && (
                  <a className="mt-1 inline-block text-xs text-accent hover:underline" href={`https://www.youtube.com/watch?v=${tr.youtube}`} target="_blank" rel="noopener noreferrer">
                    {tx("Listen on YouTube ↗", "ស្តាប់នៅលើ YouTube ↗")}
                  </a>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("Credits", "ការទទួលស្គាល់")}</h2>
        <p className="mt-2 text-muted">
          {tx(
            "Lunar topography: LOLA Science Team, NASA GSFC. Lunar temperature: Diviner team, UCLA. Mars topography: MOLA Science Team. Earth climate: NASA Langley POWER Project. Earth elevation: Copernicus DEM © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA. Basemap: NASA Global Imagery Browse Services. Terratoria is not affiliated with or endorsed by NASA or ESA.",
            "សណ្ឋានដីព្រះច័ន្ទ៖ ក្រុមវិទ្យាសាស្ត្រ LOLA, NASA GSFC។ សីតុណ្ហភាពព្រះច័ន្ទ៖ ក្រុម Diviner, UCLA។ សណ្ឋានដីភពអង្គារ៖ ក្រុមវិទ្យាសាស្ត្រ MOLA។ អាកាសធាតុផែនដី៖ គម្រោង NASA Langley POWER។ កម្ពស់ផែនដី៖ Copernicus DEM © DLR e.V. 2010–2014 និង © Airbus Defence and Space GmbH 2014–2018 ផ្តល់ក្រោមកម្មវិធី COPERNICUS ដោយសហភាពអឺរ៉ុប និង ESA។ ផែនទីមូលដ្ឋាន៖ NASA Global Imagery Browse Services។ Terratoria មិនមានទំនាក់ទំនង ឬការគាំទ្រពី NASA ឬ ESA ទេ។",
          )}
        </p>
        <p className="mt-2 text-muted">
          {tx(
            "Other imagery: Apollo Moon photographs and planet maps from NASA 3D Resources (public domain); Jupiter map from Cassini PIA07782 (NASA/JPL/Space Science Institute); star and Milky Way sky from Deep Star Maps 2020 (NASA/Goddard SVS; Gaia DR2: ESA/Gaia/DPAC). Site photographs: Wikimedia Commons contributors, each credited with its own licence and source under the photo. The Aspensia logo and cursor are the team's own.",
            "រូបភាពផ្សេងទៀត៖ រូបថតព្រះច័ន្ទ Apollo និងផែនទីភពពី NASA 3D Resources (សាធារណៈ); ផែនទីភពព្រហស្បតិ៍ពី Cassini PIA07782 (NASA/JPL/Space Science Institute); មេឃផ្កាយ និងមីលគីវ៉េពី Deep Star Maps 2020 (NASA/Goddard SVS; Gaia DR2: ESA/Gaia/DPAC)។ រូបថតទីតាំង៖ អ្នករួមចំណែក Wikimedia Commons ដែលនីមួយៗមានឈ្មោះ អាជ្ញាប័ណ្ណ និងប្រភពនៅក្រោមរូប។ ឡូហ្គោ និងទស្សន៍ទ្រនិច Aspensia ជារបស់ក្រុមផ្ទាល់។",
          )}
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("Fonts and software", "ពុម្ពអក្សរ និងកម្មវិធី")}</h2>
        <p className="mt-2 text-muted">
          {tx(
            "Fonts: Geist and Geist Mono (Vercel), Space Grotesk (Florian Karsten) and Noto Sans Khmer (Google), all under the SIL Open Font License 1.1. Software: Next.js, React, Three.js, Lenis and Recharts (MIT), MapLibre GL JS (BSD-3-Clause), GSAP (GreenSock standard no-charge licence). Each library keeps its own licence.",
            "ពុម្ពអក្សរ៖ Geist និង Geist Mono (Vercel), Space Grotesk (Florian Karsten) និង Noto Sans Khmer (Google) ក្រោមអាជ្ញាប័ណ្ណ SIL Open Font License 1.1។ កម្មវិធី៖ Next.js, React, Three.js, Lenis និង Recharts (MIT), MapLibre GL JS (BSD-3-Clause), GSAP (អាជ្ញាប័ណ្ណឥតគិតថ្លៃរបស់ GreenSock)។ បណ្ណាល័យនីមួយៗរក្សាអាជ្ញាប័ណ្ណរបស់ខ្លួន។",
          )}
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{tx("Home page themes: fan tributes", "ប្រធានបទទំព័រដើម៖ ការគោរពរបស់អ្នកគាំទ្រ")}</h2>
        <p className="mt-2 text-muted">
          {tx(
            "The four themed songs restyle the home page as non-commercial fan tributes. Every scene is drawn by our own code; no film frame, game asset or artwork is copied. HAIL MARY nods to Project Hail Mary, the 2021 novel by Andy Weir, and its 2026 film directed by Phil Lord and Christopher Miller, written by Drew Goddard and released by Amazon MGM Studios. The Petrova line, Tau Ceti e as Astrophage's home and the ship Hail Mary are Andy Weir's ideas; our ship is an original design, and Tau Ceti e is also a real candidate planet (Feng et al., 2017). INTERSTELLAR nods to Interstellar (2014), directed by Christopher Nolan, written by Jonathan Nolan and Christopher Nolan, with physicist Kip Thorne as scientific adviser and executive producer, released by Paramount Pictures and Warner Bros. with Legendary Pictures; its black hole Gargantua was rendered by Double Negative. Our black hole is our own ray tracer using the Schwarzschild light-bending equation. FLOW | NULLSCAPE nods to Geometry Dash, made by Robert Topala (RobTop Games), and the community level Nullscapes by ItzKiba (verified by Zoink); the runner is an original scene. EDGERUNNERS nods to Cyberpunk: Edgerunners (2022), the anime series by Studio Trigger, directed by Hiroyuki Imaishi, made with CD PROJEKT RED and released on Netflix; it is set in the world of CD PROJEKT RED's game Cyberpunk 2077 and Mike Pondsmith's tabletop game Cyberpunk (R. Talsorian Games). The view of Earth from the Moon nods to the show's dream of the Moon; our scene is a procedural lunar surface with NASA Earth imagery, and no frame or artwork from the show is used. Songs are credited to their artists in the Music section above. All names and marks belong to their owners, and none of them is affiliated with or endorses Terratoria.",
            "បទទាំងបួនដែលមានប្រធានបទ ប្តូររចនាទំព័រដើមជាការគោរពរបស់អ្នកគាំទ្រ មិនមែនពាណិជ្ជកម្ម។ ឈុតនីមួយៗគូរដោយកូដរបស់យើងផ្ទាល់ គ្មានរូបភាពភាពយន្ត ធនធានហ្គេម ឬស្នាដៃសិល្បៈណាមួយត្រូវបានចម្លងទេ។ HAIL MARY គោរពដល់ Project Hail Mary ប្រលោមលោកឆ្នាំ ២០២១ ដោយ Andy Weir និងភាពយន្តឆ្នាំ ២០២៦ ដឹកនាំដោយ Phil Lord និង Christopher Miller សរសេរដោយ Drew Goddard ចេញផ្សាយដោយ Amazon MGM Studios។ បន្ទាត់ Petrova, Tau Ceti e និងយាន Hail Mary ជាគំនិតរបស់ Andy Weir; យានរបស់យើងជាការរចនាដើម ហើយ Tau Ceti e ក៏ជាភពបេក្ខភាពពិតដែរ (Feng et al., 2017)។ INTERSTELLAR គោរពដល់ Interstellar (2014) ដឹកនាំដោយ Christopher Nolan សរសេរដោយ Jonathan Nolan និង Christopher Nolan មានរូបវិទូ Kip Thorne ជាទីប្រឹក្សាវិទ្យាសាស្ត្រ និងផលិតករប្រតិបត្តិ ចេញផ្សាយដោយ Paramount Pictures និង Warner Bros. ជាមួយ Legendary Pictures; រន្ធខ្មៅ Gargantua បង្កើតដោយ Double Negative។ រន្ធខ្មៅរបស់យើងជាកម្មវិធីតាមដានកាំរស្មីរបស់យើងផ្ទាល់ ដោយប្រើសមីការពត់ពន្លឺ Schwarzschild។ FLOW | NULLSCAPE គោរពដល់ Geometry Dash បង្កើតដោយ Robert Topala (RobTop Games) និងកម្រិតសហគមន៍ Nullscapes ដោយ ItzKiba (ផ្ទៀងផ្ទាត់ដោយ Zoink); ការរត់គឺជាឈុតដើម។ EDGERUNNERS គោរពដល់ Cyberpunk: Edgerunners (2022) ស៊េរីគំនូរជីវចលដោយ Studio Trigger ដឹកនាំដោយ Hiroyuki Imaishi បង្កើតជាមួយ CD PROJEKT RED និងចេញផ្សាយលើ Netflix; វាស្ថិតក្នុងពិភពនៃហ្គេម Cyberpunk 2077 របស់ CD PROJEKT RED និងហ្គេមតុ Cyberpunk របស់ Mike Pondsmith (R. Talsorian Games)។ ទិដ្ឋភាពផែនដីពីព្រះច័ន្ទ គោរពដល់សុបិនអំពីព្រះច័ន្ទក្នុងរឿងនេះ; ឈុតរបស់យើងជាផ្ទៃព្រះច័ន្ទដែលបង្កើតដោយកូដ ជាមួយរូបភាពផែនដីរបស់ NASA ហើយគ្មានរូបភាព ឬស្នាដៃសិល្បៈពីរឿងនេះត្រូវបានប្រើទេ។ បទភ្លេងមានឈ្មោះសិល្បករនៅក្នុងផ្នែកតន្ត្រីខាងលើ។ ឈ្មោះ និងសញ្ញាទាំងអស់ជាកម្មសិទ្ធិរបស់ម្ចាស់ ហើយគ្មាននរណាម្នាក់មានទំនាក់ទំនង ឬគាំទ្រ Terratoria ទេ។",
          )}
        </p>
      </section>
    </div>
  );
}
