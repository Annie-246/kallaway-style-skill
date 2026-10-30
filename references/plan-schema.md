# plan.json — tham chiếu đầy đủ

File nằm ở `public/plan.json` của dự án Remotion. Mọi thời gian là **giây trên timeline đã cắt thô** (trùng `words.json`). Ví dụ chạy được, có đủ mọi loại scene: `references/plan-example.json` (đã render thử ngày 26/10/2026).

```jsonc
{
  "fps": 30,                       // ép 30 dù source 25/24 – Remotion tự lấy khung gần nhất
  "duration": 61.4,
  "source": { "video": "source/cut.mp4", "matte": "source/person.webm",
              "w": 1080, "h": 1920, "face": {"x": 540, "y": 700}, "cardZoom": 1.0 },
  "words": [ {"s": 0.0, "e": 0.24, "w": "Lý"} ],
  "captions": { "serif": ["kịch bản", "hook"], "hide": [[12.0, 13.5]] },
  "music": { "src": "music/bed.mp3", "volume": 0.14, "drops": [[3.0, 4.0]] },
  "sfx": [ {"src": "sfx/whoosh.mp3", "at": 13.1, "volume": 0.3, "rule": "L1"} ],
  "segments": [ ...xem dưới... ]
}
```

- `face`: tâm mắt trong pixel source (prep_source tự đo). Sai → cảnh full lệch mặt.
- `cardZoom`: <1 để thấy rộng hơn trong thẻ. Kiểm: đỉnh đầu nhô ra phải **thấp hơn đáy caption (~1285)**.
- `palette`: 2 màu neon của cả video (bắt buộc, L-COLOR), vd `["red","magenta"]`.
- `captions.splitY`: tâm phụ đề ở khung có thẻ người nói khi đầu nhô cao (L-CAPHEAD).
- `segments[].card: false`: ẩn thẻ người nói (đoạn chỉ có giọng, video avatar); `noMediaReason`: lý do khối không có ảnh thật sau khi đã tìm.
- `captions.serif`: cụm từ (viết thường, không dấu câu) sẽ hiện bằng serif nghiêng — chỉ khái niệm then chốt, 3–8 cụm/video.
- `captions.hide`: các khoảng tắt caption (vd. khi tiêu đề đang viết đúng y câu đó).

## Segment
```jsonc
{ "start": 0, "end": 2.3, "layout": "split", "theme": "dark|light", "scenes": [ ... ] }
{ "start": 9, "end": 20, "layout": "split", "card": false, "scenes": [ ... ] }   // khúc chỉ có tiếng: không thẻ người, stage hạ 140px + phóng 1.15, caption y=1600; make_matte bỏ qua
{ "start": 2.3, "end": 4.1, "layout": "full", "zoom": 1.0 }        // 1.0 hoặc 1.18 xen kẽ
{ "start": 5.7, "end": 6.6, "layout": "media", "src": "media/clip.mp4",
  "lines": [{"text": "Thứ tạo ra", "at": 5.8}, {"text": "cú hích _dopamine_", "at": 6.0}],
  "phone": {"at": 6.15, "small": "trong não", "big": "người xem"} }
```
Segment phải liền nhau, không hở, không chồng.

## Scene (trong segment split)
Trường chung: `type`, `at`, `transition` (`cut` mặc định | `push` | `morph`, kèm `morphDur`, `morphOrigin`), `title` `{text, at?, size?, y?, fixed?}`, `camera` `[{at, dur, x, y, scale}]`, `drift` (0 để tắt), `layers` `[ {type, ...} ]` (chồng thêm scene khác cùng camera).

Markup tiêu đề: `_serif nghiêng_`, `[chữ đỏ]`, `{hộp đỏ}`, `<claude>` logo nằm trong dòng, `\n` xuống dòng.

`plan.logos` = nội dung `public/logos/index.json` (`{"claude": {"dark": "logos/claude.png", "light": "logos/claude-light.png"}}`). Mọi chip (`list`, `tree.nodes`, `timeline.branch.labels`) nhận thêm `"logo": "<key>"`. Thiếu logo trong `plan.logos` → render báo lỗi (luật L-LOGO).

Toạ độ sân khấu: rộng 1080, **vùng an toàn x 140–940** (lề điện thoại ~1 cm, template tự kéo vào), y 380–1150, caption ở 1243.

MediaCard nhận `enter`: `fade` (mặc định) | `cut` | `focus` (mờ nhoè → nét, mẫu 4) | `rise` | `flicker`.

| type | props chính |
|---|---|
| `chart` | `curve {points:[[x,y]0..1], color red|magenta|white, at, dur}`, `axes {at}`, `axisLabels {x,y}`, `labels [{i,text,at,side left|right|top}]`, `valueTag {i,text,at}`, `extra [{points,color,at,dur,badge{from,to}}]`, `trace {from,to,at,dur,color}`, `fill {at,dur,base}`, `bar {at, segments:[{w,color yellow|grey,at?}]}`, `bracket {x0,x1,at,label}`, `chips {from:i, x, y, state?, items:[{text,at}]}`, `dots:false` |
| `cards3d` | `items:[src]`, `cx, cy, radius, speed` |
| `doc` | `sections:[{label,color red|yellow|purple|cyan|white|green,lines,at}]`, `mode build|fill`, `heading`, `labels`, `glowAt`, `glowSection`, `x,y,w,h` |
| `docgrid` | `count, cols, pages:[src]?, x, y, w, stagger` |
| `timeline` | `years:[..]`, `focus:[{at,index,dur}]`, `y, spacing`, `branch {index, at, gap?, labels:[{text,at,state?,greenAt?,media?,mediaAt?}]}` |
| `tree` | `nodes:[{text,at,state?,greenAt?,media:[{src,at}]}]`, `focus:[{at,index,dur,zoom}]`, `y, gap` |
| `reelgrid` | `items:[{src|srcs[], badge, badgeAt?}]`, `cols, x, y, w, stagger, cycle` |
| `uicard` | `src`, `x,y,w,h`, `curve {points, rect{x,y,w,h}, at, dur, color}` |
| `showcase` | `cards:[{src,at,x?,y?,w?,h?}]`, `notes:[{text,at,x?,y?,size?}]` |
| `list` | `items:[{text,at,state?,greenAt?}]`, `x, y, step, size` |
| `sidetags` | `items:[{text,at,x,y,side left|right}]` |
| `logos` | `items:[{key, at, label?, greenAt?, dimAt?, state?}]`, `y, size, gap` — hàng logo lớn trên ô kính |
| `badge` | `content {text|logo|src}`, `morph:[{at, text|logo|src, label?}]`, `fly {at, dur}`, `label`, `x, y, size` — ô kính morph rồi bay lên header (tiêu đề cảnh tự mờ đi khi bay) |
| `orbit` | `center {src|logo, at, size}`, `items:[src]`, `cx, cy, rx, ry, speed, cardW`, `colorAt:[{at, filter}]` (vd `"hue-rotate(80deg) saturate(2)"`) |
| `progress` | `clips:[{src, at}]`, `barAt`, `barEnd`, `x, y, w, h` |
| `illus` | `items:[...]` — bàn vẽ neon: `icon` (name, x, y, size, at, dur, color, states, level, pulse), `path`, `line` (from, to, bend, arrow, dot), `ring`, `array`, `counter`, `flow`, `orb`, `label`. Chi tiết đầu file `scenes/Illus.tsx`; icon trong `assets/icons` (thêm SVG + `build_icons.py`) |
| `none` | chỗ trống (plan_skeleton tạo ra, phải thay hết trước khi render) |

Media (`src`) là đường dẫn trong `public/` — ảnh (.jpg/.png/.webp) hoặc video (.mp4/.webm, tự tắt tiếng, chạy từ lúc scene bật).
