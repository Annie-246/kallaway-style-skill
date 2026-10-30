# Số đo chính xác (lượt soi thứ 2, 27/10/2026)

Đo trên 3 mẫu gốc bằng script: diff từng khung (24/25 fps = 40–42 ms/khung), mốc từng chữ của Whisper, tách nguồn âm thanh bằng Demucs (htdemucs: drums / bass / other / vocals). Số liệu ở đây **thay thế** mọi chỗ mâu thuẫn trong các file khác.

## 1. Thời điểm

| Hiện tượng | Số đo | Cách dựng |
|---|---|---|
| Phụ đề đổi chữ | lệch so với mốc bắt đầu của chữ: trung vị **−3 ms** (v1), +20 ms (v2), −20 ms (v3); p25–p75 trong ±40 ms | bật đúng `word.s`, không sớm, không trễ |
| Số từ mỗi lần hiện phụ đề | **1,13 / 1,41 / 1,11** → gần như luôn 1 từ | tiếng Việt: 1 từ ghép (1–2 âm tiết) mỗi lần; tốc độ đổi ≈ 2,5–3 lần/giây |
| Cắt đổi bố cục (SPLIT↔FULL) | rơi **80–180 ms TRƯỚC** chữ đầu câu mới (trung vị ~110 ms): 11,417→"But"11,50 · 22,50→22,60 · 32,08→32,26 · 41,67→41,78 · 52,54→52,64 · 61,17→61,28 · 67,58→67,66 | ranh giới segment = `firstWord.s − 0.11`; cú cắt nằm trong khoảng nghỉ, năng lượng giọng tại cắt tụt ~7 dB |
| Nhãn/chip bật | 4–6 khung (≈170–250 ms) trước từ khóa | `at = word.s − 0.2` |
| Graphic đầu tiên sau khi quay về SPLIT | bật ở **khung đầu tiên** sau cắt (không chờ) | |

## 2. Chữ (đo pixel khung 1080×1920)

| Thành phần | Đo được | Suy ra |
|---|---|---|
| Tiêu đề 2 dòng (v1 0,9 s) | chữ hoa cao 48 px; baseline dòng 1 y=205, dòng 2 y=266 → cách **61 px**; khe mực giữa dòng 13 px | cỡ ≈ 66 px, **line-height 0,92** |
| Tiêu đề mẫu 3 | chữ hoa 37 px, baseline cách 53 px | cỡ ≈ 50 px, line-height ~1,05 |
| Tiêu đề sans + serif (v1 5 s) | khối cao 103 px (y 266–368), sans chữ hoa ~55 px | sans 76 px; serif ×1,32, cùng baseline |
| Vị trí tiêu đề | đỉnh mực y = 116–160 (tối) / 158 (sáng) | `titleTop` ≈ 120–150 |
| Phụ đề SPLIT | đỉnh chữ có nét lên y = **1219**, cao nét lên 45 px | cỡ ≈ **60 px**, tâm ~1243 |
| Phụ đề FULL | x-height 37 px, y 1143–1194 | cỡ ≈ **68 px** (to hơn SPLIT), tâm ~1170 |
| Hộp đỏ dòng 1 (v2) | cao 46 px cho chữ ~56 px; dòng 2 cách 10 px | đệm dọc hộp ≈ 0,06em |

## 3. Hình ảnh thật được đưa vào thế nào

- **Phần lớn là video đang chạy** (reel phát luôn các cảnh cắt bên trong, ~0,3 s/cảnh), không phải ảnh tĩnh. Lưới reel ở v3 0–3 s là 6 video cùng chạy.
- Lối vào: **cắt cứng** (xuất hiện ngay ở 1 khung, thường kèm camera đang lia) hoặc **mờ dần ≤5 khung** từ tối. Không dùng nhấp nháy neon cho hình, chỉ cho chữ/khung/chip.
- Sau khi vào: **zoom chậm liên tục** (Ken Burns, ~3–6% trong 1–2 s), viền mảnh sáng + glow trắng nhẹ, bo góc ~14–20 px.
- Ảnh chụp giao diện (IG insights, trang profile) đặt trong thẻ bo góc, rồi **vẽ đè** lên (đường retention neon, nhãn chú thích bật trên reel: "Curiosity hook").
- Ghi chú serif cạnh hình: gõ ra từng chữ cái, chậm (~25 ký tự/giây), màu xám sáng.
- Khi cắt từ FULL vào một cảnh có băng chuyền, camera **đang lia sẵn** từ khung đầu (nhoè ngang ~10 khung).

## 4. Âm thanh (tách nguồn)

**Nhạc**
- v1: pad synth không trống. v2, v3: **beat hip-hop 808** (kick có cao độ trượt xuống, ~130 BPM, mỗi kick cách 0,92 s), hi-hat, pluck.
- **Cảnh FULL đầu tiên sau hook luôn im nhạc hoàn toàn** (bass/drums −76…−82 dB): v1 1,75–3,96 · v2 5,72–9,64 · v3 3,04–4,63.
- v2: **trống chỉ chơi trong SPLIT** (drums FULL −54…−76 dB, SPLIT −29…−50 dB).
- Nhạc/beat **vào lại đúng khung cắt FULL→SPLIT**, cú kick/hit đầu tiên nằm trong 0–300 ms sau cắt (lớp drums tăng +35…+50 dB). Cắt SPLIT→FULL thì không có gì.
- Ngắt giữa video: v1 25,8–27,0 · 55,2–56,0; v3 29,9–31,7 · 75,6–78,8. Nhạc tắt **cắt chết**, không fade.

**SFX (chỉ v1 có tách bạch được, vì nhạc v1 không có trống)**
| Thời điểm | Tiếng | Hình |
|---|---|---|
| 0,05 s | sub-boom 30–300 Hz, ngân ~0,7 s | khung đầu |
| 13,15 s | boom/whoosh trầm ~0,5 s | push cụm thẻ → biểu đồ |
| 25,2→25,8 s | rền trầm + riser 2–10 kHz tăng dần, **cắt chết** tại drop | camera zoom vào 70% |
| 37,85 s | sub-boom | chip "Contrast Moment" |
| 54,9→55,2 s | rền trầm, cắt chết vào khoảng lặng | trước "the climax doesn't happen…" |
Không có SFX dải cao (pop/ding/click/whoosh sáng) ở bất kỳ điểm nào. Mọi SFX đều nằm dưới 300 Hz (cảm nhiều hơn nghe), trừ riser.
