# Walkthrough videos

Narrated screen recordings made with Playwright, the built-in Windows voice and
ffmpeg. Each video has its own folder with the voiceover (`narration.ts`) and
the actions to film (`record.ts`). `kit.ts` holds the shared captions, cursor
and pacing.

| Video | Folder | Audience |
| --- | --- | --- |
| `staff-portal-guide.mp4` | `staff/` | Counter staff: one demo order from walk-in to pickup, plus the board, search, customers, prices and reports. Logs in as the admin and deletes the "Maria Santos (Demo …)" order and customer afterwards. Served to signed-in staff only, from `private/videos/` through `app/api/staff-guide`, because it films the live portal. |
| `3d-studio-guide.mp4` | `studio/` | Customers: a family-reunion shirt in the 3D Studio, from picking a color to filling in the quote form. Never submits the quote, so it writes nothing to the database. Served on the site from `public/videos/`. |

```sh
pnpm build && pnpm start --port 3100          # in another terminal

V=studio                                       # or staff
O=scripts/demo-video/out/$V && mkdir -p $O
# 1. narration text → WAV clips (Windows built-in voice; slower -Rate -1 for customers, -Rate 0 for staff)
npx tsx -e 'import("./scripts/demo-video/'$V'/narration.ts").then(m=>require("fs").writeFileSync(process.argv[1]+"/narration.json",JSON.stringify(m.NARRATION,null,2)))' $O
powershell -ExecutionPolicy Bypass -File scripts/demo-video/tts.ps1 -OutDir $O -Rate -1
# 2. record the browser (the staff video needs the admin login from .env.local)
npx dotenv -e .env.local -- tsx scripts/demo-video/$V/record.ts $O
# 3. lay the voice over the video (needs a full ffmpeg, e.g. `npm i -g ffmpeg-static`)
FFMPEG=/path/to/ffmpeg npx tsx scripts/demo-video/mux.ts $O staff-portal-guide --crf 26
FFMPEG=/path/to/ffmpeg npx tsx scripts/demo-video/mux.ts $O 3d-studio-guide --crf 26
cp $O/3d-studio-guide.mp4 $O/3d-studio-guide.jpg public/videos/          # studio guide
cp $O/staff-portal-guide.mp4 $O/staff-portal-guide.jpg private/videos/   # staff guide
```

Edit `narration.ts` to change what is said; step timing follows the clip
lengths automatically. If a video's length changes, update `STUDIO_GUIDE.length`
in `components/customizer/StudioGuide.tsx` or `STAFF_GUIDE.length` in
`components/dashboard/staff-guide.tsx`.

The studio recorder launches Chromium with the D3D11 GPU backend because the
shirt is WebGL; on the default software renderer it plays at a few frames per
second. If a staff run fails midway, `staff/record.ts $O --cleanup` deletes any
leftover demo customers.
