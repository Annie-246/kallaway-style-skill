---
name: kallaway-style
description: Dựng video dọc 9:16 talking-head theo style Kallaway — giải thích bằng motion graphic minh hoạ vẽ riêng cho từng ý (icon neon tự vẽ, hạt chảy, dâng màu, morph) trên nền đen chấm lưới / giấy kẻ sáng, thẻ người nói bo góc dưới đáy với đầu nhô ra khỏi khung (pop-out), caption một từ, tiêu đề sans đậm + serif nghiêng + hộp đỏ, biểu đồ tự vẽ, timeline lia, cây chip, lưới reel bằng chứng, CTA "Comment X to get the doc", cắt cứng xen cảnh mặt người ở câu chuyển ý, nhạc pad trầm ngắt trước reveal. Dựng bằng Remotion từ plan.json. Dùng khi người dùng nói "style Kallaway", "kiểu Kallaway", "kallaway-style", "dựng như mẫu Kallaway". Cũng dùng để phân tích thêm video mẫu Kallaway mới và bổ sung thư viện.
---

# Kallaway style

Style này **giải thích một ý tưởng bằng một vật thể đồ họa sống**, người nói chỉ là người dẫn. Bí quyết không nằm ở hiệu ứng, mà ở kỷ luật:

1. **Ba bố cục, cắt cứng giữa chúng**: SPLIT (đồ họa trên + thẻ người nói dưới, ~75–80% thời lượng) · FULL (mặt người, chỉ ở câu chuyển ý/câu chốt, 1,5–3,5 s) · MEDIA (clip thật tràn khung, ≤1 lần).
2. **Một vật thể, nhiều trạng thái** — và giữa 2 ý cùng mạch thì **morph** (vật cũ tan thành vật mới tại chỗ, ~0,4 s) thay cho cắt: một biểu đồ / một trang tài liệu / một canvas sống suốt 10–50 s; mỗi câu đổi một trạng thái (vẽ thêm, tô màu, zoom, thêm chip).
3. **Hình đi trước lời 0,2 s**; đồ họa đổi mỗi 1–2 s; không bao giờ đứng yên (drift).
4. **Lối vào = đèn neon bật** (nhấp nháy 5 khung) và **gõ chữ có mép nhấp nháy**. Không bounce, không pop scale, không flash.
5. **Màu mang nghĩa**: đỏ = cũ/sai, magenta = mới/đúng/đang nói, vàng = hook/đỉnh, xám = nhả, xanh lá = chọn/thành công.
6. **Âm thanh là công cụ dựng**: cảnh mặt người đầu tiên sau hook im nhạc hoàn toàn; beat chỉ chơi khi có đồ họa và vào lại đúng khung cắt; 1–2 lần ngắt giữa video có riser dừng chết; SFX rất ít và đều ở dải trầm (sub-boom khung đầu, whoosh trầm ở push lớn).
7. **Cắt đổi bố cục 110 ms trước chữ đầu câu**; phụ đề 1 từ/lần, đổi đúng `word.s`; phụ đề FULL 68 px, SPLIT 60 px; tiêu đề line-height 0,92.

## Hai luật bắt buộc về hình (chủ kênh yêu cầu 27/10/2026)

**L-LOGO · Nhắc thương hiệu = phải có logo, không bao giờ chỉ viết chữ.**
- Mọi tên hãng/sản phẩm/nền tảng xuất hiện trên hình (Claude, ChatGPT, Gemini, YouTube, TikTok, Shopee, Canva…) phải đi kèm logo thật: chip có logo (`"logo": "claude"`), logo nằm trong tiêu đề (`"Bước 1: <claude> _Claude_"`), hoặc hàng logo lớn (scene `logos`).
- Logo bật đúng lúc tên được nói (`at = word.s − 0.2`), như mọi nhãn khác.
- Lấy logo: `python "$S/fetch_assets.py" logo --project "<…>" claude chatgpt gemini youtube` → `public/logos/` + `index.json`; chép `index.json` vào `plan.logos`. Nguồn: LobeHub (hãng AI) → Simple Icons (hãng khác). Không tìm được thì tìm SVG/PNG chính thức bằng tay — **không được** lùi về chữ trơn. Template sẽ báo lỗi khi render nếu thiếu logo.
- Nền sáng dùng bản `-light` (template tự chọn theo theme).

**L-ILLUS · Mỗi khối đồ họa phải có hình minh họa thật, lấy từ archive.org.**
- Mỗi segment SPLIT có ít nhất 1 ảnh/clip thật (ngoài logo), xuất hiện theo lời (riêng khối CTA cuối được chỉ dùng logo + lưới tài liệu); ảnh đặt cạnh chip thì chừa ≥30 px, không để chip đè mép ảnh; khối dài > 6 s thì 2+ hình. Ưu tiên clip (Kallaway gần như luôn dùng video đang chạy).
- Lấy: `python "$S/fetch_assets.py" archive --project "<…>" --query "<từ khóa tiếng Anh>" --n 4 [--kind movies]` → `public/media/archive/` + `sources.csv` (chỉ public domain / CC).
- **Bắt buộc mở `_review.jpg` xem tận mắt**: kết quả archive rất nhiễu (lượt thử đầu chỉ 4/9 file đúng chủ đề — có ảnh quảng cáo, tranh cổ, xác lính). Xoá file lạc đề, rồi chạy `fetch_assets.py clean --project …` để cập nhật `sources.csv`.
- Ảnh chụp màn hình sản phẩm thật (giao diện Claude/ChatGPT…) không có trên archive: xin người dùng gửi; không vẽ giả giao diện.
- Đặt hình: `showcase` (thẻ + ghi chú serif), `reelgrid`, `uicard`, media trên `tree`/`timeline`. Hình vào bằng cắt/mờ dần ≤5 khung + zoom chậm (template mặc định).
- Bàn giao: liệt kê hình đã dùng kèm nguồn (`sources.csv`).

**L-DRAW · Mọi khối đồ hoạ phải có hình minh hoạ được VẼ cho đúng ý câu** (scene `illus`: icon nét neon tự vẽ, hạt chảy, dâng màu, vòng + X, dãy icon, số chạy, đường nối có chấm chạy; hoặc chart/orbit/badge/timeline/tree/doc/progress). Không được dựng cả khối chỉ bằng chip/capsule hay thẻ ảnh. Công thức theo từng loại ý: `references/illustration-recipes.md`.

**L-COLOR · Màu neon: tối đa 2 màu mỗi khung, cả video chỉ 2 màu chủ đạo** chọn trước trong `plan.palette` (vd `["red","magenta"]`). Trắng/xám là nét nền, không tính; logo hãng giữ màu thương hiệu. Hộp/chữ đỏ trong tiêu đề tính là màu đỏ. Lỗi đã gặp: một khung có cả xanh lá, vàng, tím, xanh dương → rối mắt.

**L-NORING · Không khoanh tròn lên ảnh/ảnh chụp màn hình** — vòng khoanh luôn lệch chỗ, nhìn cẩu thả. Muốn chỉ vào chi tiết thì dùng nhãn hoặc morph/zoom, không khoanh.

**L-CAPHEAD · Phụ đề không bao giờ đè lên đầu/mặt.** Khi đầu nhô cao khỏi thẻ (`cardEyeY` < 80), render 1 khung, đo đỉnh đầu, đặt `captions.splitY` cao hơn đỉnh đầu ~70 px (video 9 công cụ AI: đỉnh đầu y≈1156 → splitY 1085).

**Neon dịu, không chói:** glow 42%, lõi trắng 22%, quầng nền tối đa 40% (đã chỉnh 27/10/2026 vì bản trước quá sáng). Đừng tăng lại.

**L-SAFE · Lề an toàn điện thoại ~1 cm (140 px mỗi bên).** Chữ, khung ảnh/clip, chip đứng yên không được nằm ngoài x 140–940 — điện thoại cắt mép (lỗi đã gặp: dòng serif và khung ảnh sát mép bị che). Template tự kéo vào/thu cỡ; tiêu đề dài tự xuống 2 dòng. Chi tiết: `design-system.md` §1b.

## Tài liệu (đọc theo thứ tự khi dựng)

| File | Đọc khi |
|---|---|
| `references/illustration-recipes.md` | **đọc khi viết từng khối** — biến câu thành hình vẽ: động từ → chuyển động, bảng 16 công thức, cách chèn hình thật thành minh hoạ |
| `references/craft-rules.md` | **đọc đầu tiên** — luật tay nghề có số đo: nhịp giữ chân, khoảng cách, màu, hiệu ứng chữ, nhấn mạnh; kèm 2 công cụ kiểm |
| `references/precise-measurements.md` | **đọc thứ hai** — số đo từng ms/pixel/dB (lượt soi 2, tách nguồn Demucs); thắng mọi file khác khi mâu thuẫn |
| `references/pacing-and-structure.md` | lập plan — nhịp, ngữ pháp dựng, phân bổ thời lượng |
| `references/motion-library.md` | chọn graphic cho từng câu (G1–G15), kỹ thuật chuyển động (M1–M5, T1–T6) |
| `references/design-system.md` | bố cục đo pixel, màu, font, ánh sáng neon |
| `references/audio.md` | nhạc, ngắt nhạc, ánh xạ sang luật SFX L1–L23 |
| `references/plan-schema.md` | viết `plan.json`; ví dụ chạy được: `references/plan-example.json` |
| `references/thumbnail.md` | làm thumbnail (composition `Thumb`, ví dụ `references/thumb-example.json`) |
| `references/analysis-v1/v2/v3/v4-*.md` | phân tích từng giây 4 mẫu gốc (mẫu 5 trùng file mẫu 3) — mẫu 4 là nguồn của morph, badge, orbit, progress |

## Quy trình

**B1–B3 · Cắt thô & duyệt.** Cắt chặt hơn mặc định: khoảng lặng > 0,3 s đều bỏ, câu dính liền (khoảng nghỉ 0,15–0,35 s). Dùng công cụ cắt khoảng lặng bất kỳ (auto-editor, hoặc nhờ Claude cắt theo transcript); giữ quy tắc "ý cuối cùng" và đệm không nuốt chữ. Gửi mốc cắt cho người dùng duyệt **trước** khi dựng.

**B4 · Chuẩn bị dự án.**
```bash
S="$HOME/.claude/skills/kallaway-style/scripts"
python "$S/new_project.py"  --dest "<thư mục video>/kallaway"          # template + font + node_modules (junction)
python "$S/prep_source.py"  --src "<bản đã cắt>.mp4" --project "<…>/kallaway" --lang vi   # cut.mp4, words.json, source.json (tâm mặt)
python "$S/plan_skeleton.py" --project "<…>/kallaway"                  # plan.json nháp: bố cục + chỗ trống graphic + 2 điểm ngắt nhạc
```
Đọc bảng in ra; sửa bố cục nếu câu chuyển ý bị xếp sai.

**B5 · Viết graphic (phần sáng tạo — Claude làm).** Với từng scene `"type": "none"` trong plan:
1. Đọc câu (`todo`), chọn graphic theo "Cách chọn graphic" trong motion-library. Ưu tiên đổi trạng thái vật thể đang có.
2. Đặt mốc `at` = `word.s − 0.2` của từ khóa tương ứng (lấy từ words.json, không đoán).
3. Tiêu đề: ≤ 6 từ/dòng, 1–2 dòng, có đúng 1 điểm nhấn (serif / [đỏ] / {hộp đỏ}).
4. Tư liệu thật (ảnh chụp app, reel, số liệu) → `public/media/`. Thiếu thì tìm/gom (tự chụp, tự tìm hoặc nhờ Claude gom) hoặc sinh ảnh Gemini; **không bịa số liệu** trên huy hiệu/biểu đồ.
5. `captions.serif`: 3–8 cụm khái niệm then chốt.
6. Nhạc vào `public/music/`, SFX (nếu có) theo `references/audio.md`.

Nhạc 2 lớp (beat chỉ chơi khi có đồ họa):
```bash
python "$S/prep_music.py" --src "<bài nhạc>" --project "<…>/kallaway" --start 8 --dur 90
```

Rồi tách người cho pop-out (chạy SAU khi plan có segment cuối cùng, vì chỉ xử lý khung SPLIT):
```bash
python "$S/make_matte.py" --project "<…>/kallaway"        # → public/source/person.webm, đặt plan.source.matte
```

**Kiểm trước khi render toàn bộ** — chạy `python "$S/lint_plan.py" --project "<…>/kallaway"` (0 ERROR mới được render), rồi render vài khung tĩnh để xem:
```bash
cd "<…>/kallaway" && npx remotion still src/index.ts Kallaway out/check.png --frame=<f>
```
Render (đặt `TEMP`/`TMP` sang ổ D, thêm `--timeout=120000`): `npx remotion render src/index.ts Kallaway out/draft.mp4 --timeout=120000`, rồi chuẩn hoá −14 LUFS thành `out/final.mp4` (lệnh trong audio.md).

**Thumbnail.** Dựng xong video thì làm thumbnail **theo style Kallaway**, không dùng kiểu Nhật Dương: viết `public/plan_thumb.json` rồi render composition `Thumb`. Làm đúng `references/thumbnail.md`.

**Chấm điểm sau render**: `python "$S/measure_craft.py" --video out/final.mp4 --plan public/plan.json --compare` — chỉ số WARN phải sửa hoặc giải thích khi bàn giao.

**B6 · Bàn giao.** Báo: bảng segment (thời gian, bố cục, graphic), các khoảng ngắt nhạc (L15), danh sách SFX + mốc + mã luật, chỗ nào dùng tư liệu giả lập cần người dùng thay.

## Checklist QC (xem contact sheet 4 fps của bản render)
- [ ] Khung 0 có đồ họa + tiêu đề; không mở bằng mặt trơn.
- [ ] Không có 2 FULL liền nhau; không FULL > 4 s (trừ khi có jump cut đổi cỡ).
- [ ] Không quãng 2 s nào trong SPLIT mà đồ họa đứng yên.
- [ ] Nhãn/chip hiện trước từ được nói, không trễ.
- [ ] Caption không chồng tiêu đề/đầu nhô ra; một từ/cụm mỗi lúc; tiếng Việt đủ dấu.
- [ ] Đầu người nhô ra đúng mép trên thẻ, viền tách nền không lem (nếu lem: `--model birefnet-portrait`).
- [ ] Màu đúng nghĩa xuyên suốt video.
- [ ] Không chữ/khung đứng yên nào ngoài x 140–940 (L-SAFE) — kiểm bằng contact sheet có kẻ 2 vạch.
- [ ] Mọi thương hiệu trên hình đều có logo (L-LOGO); mọi khối SPLIT có hình thật archive.org đã duyệt (L-ILLUS); `sources.csv` khớp file đang dùng.
- [ ] Nhạc nghe được trên loa điện thoại ở mức "cảm thấy", tắt hẳn ở điểm drop.
- [ ] fps: kiểm khung cuối sau render (bẫy fps — xem memory dự án).

## Bẫy đã biết
- **Xoá một dự án đã tạo bằng `new_project.py`**: `node_modules` có thể là junction trỏ vào một dự án Remotion khác. Gỡ junction trước bằng `cmd /c rmdir "<dự án>
ode_modules"` rồi mới xoá thư mục — `Remove-Item -Recurse` của PowerShell 5.1 có thể đi theo junction và xoá luôn thư viện gốc mà mọi dự án Kallaway dùng chung.
- **Instrument Serif không có dấu tiếng Việt** → `serifStyle()` tự chuyển sang Noto Serif Display wdth 62 khi chuỗi có ký tự ngoài ASCII. Đừng đặt font serif cứng trong component mới; luôn gọi `serifStyle(text)`.
- Gradient SVG cho đường thẳng phải dùng `gradientUnits="userSpaceOnUse"` (bounding box của đường thẳng đứng rộng 0 → đường biến mất).
- Video trong template **không bọc Sequence** cho người nói: thời gian composition = thời gian source. Media trong scene thì có Sequence riêng (chạy từ lúc scene bật).
- `make_matte` phải chạy lại nếu đổi ranh giới segment SPLIT (khung ngoài SPLIT là trong suốt).
- Source quay sát mặt: giảm `cardZoom` (0,7–0,85) và/hoặc hạ `face.y`, nếu không đầu nhô ra sẽ đè caption.
- Thêm scene mới: viết component trong `template/src/hw/scenes/`, đăng ký ở `scenes/index.ts`, ghi props vào `plan-schema.md`, thêm dòng vào bảng G trong motion-library.

## Bổ sung mẫu mới
```bash
python "$S/analyze_reference.py" --video "<mẫu mới>.mp4" --out "<scratch>" --lang en --strip 12.1:1.6 25.2:1.2
```
Xem sheet → strip quanh mỗi lần đổi bố cục → phổ âm thanh. Ghi `references/analysis-v4-*.md`, cập nhật bảng số đo trong pacing-and-structure, thêm kỹ thuật mới vào motion-library (và scene mới vào template nếu cần).
