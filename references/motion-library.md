# Thư viện kỹ thuật chuyển động (Kallaway)

Mỗi kỹ thuật: **nhận dạng → thông số đo được → cách dựng trong template**. Thời gian tính bằng khung @24–25 fps của mẫu; template chạy 30 fps nên dùng giây.

## Chuyển động nền tảng (dùng ở mọi nơi)

### M1 · Đèn neon bật (flicker-on) — lối vào mặc định
- Nhận dạng: phần tử không mờ-dần mượt mà **chập chờn** 4–6 khung: tối → sáng → tối → sáng → bật hẳn.
- Thông số: chuỗi độ đục ≈ 0,18 / 0,55 / 0,30 / 0,85 / 0,60 / 1 (mỗi khung), có nhiễu ±15%.
- Template: `flicker(t, at, fps)` trong `anim.ts`. Mọi chip, thẻ, chấm, trang tài liệu, khung doc đều dùng.

### M2 · Gõ chữ với mép nhấp nháy (type-on)
- Tiêu đề hiện trái→phải ~2–3 ký tự/khung (≈90 ký tự/s); 3 ký tự mới nhất màu xám nhấp nháy. Dòng 2 trễ ~0,28 s.
- Hộp đỏ `{...}` **quét trái→phải đi trước chữ** ~1 khung.
- Template: `RichText` (`typeOn`), markup `_serif_ [đỏ] {hộp đỏ} \n`.

### M3 · Vẽ đường (draw-on) có đầu nóng
- Đường vẽ theo độ dài cung, ease in-out, 0,6–1,2 s; đầu đường có chấm trắng sáng; chấm mốc bật (M1) đúng lúc đầu đường đi qua.
- Trục chữ L mọc từ gốc trong 0,4 s **trước** đường.
- Template: `Chart` (`curve.at/dur`, `axes.at`).

### M4 · Nhãn đi trước lời (anticipation)
- Nhãn/chip xuất hiện **4–6 khung (≈0,15–0,25 s) TRƯỚC** khi từ đó được nói. Não đọc trước, tai xác nhận sau.
- Nhãn trắng mọc ngang (clip trái→phải, 0,22 s).
- Quy tắc viết plan: `at = word.s − 0.2`.

### M5 · Camera không bao giờ đứng yên (drift)
- Sân khấu phóng chậm ~3,5% trong 8 s; cảnh full push-in 3% suốt cảnh.
- Template: `drift()` tự động; tắt bằng `"drift": 0`.

## Chuyển cảnh

### T1 · Cắt cứng giữa bố cục (SPLIT ↔ FULL ↔ MEDIA)
- 100% các lần đổi bố cục là **cắt cứng**, không flash, không zoom, không whoosh. Chuyển động nằm *trong* đồ họa.
- Đồ họa mới bật bằng M1/M2 ngay khung đầu sau cắt.

### T2 · Đẩy ngang có nhoè (push)
- Cảnh cũ trượt ra trái, cảnh mới vào từ phải, ~0,45 s (10–11 khung), ease in-out, nhoè ngang đỉnh giữa hành trình (≈30 px).
- Dùng khi đổi **đối tượng** trong cùng một mạch (cụm thẻ → biểu đồ).
- Template: `"transition": "push"` trên scene.

### T3 · Camera bay (zoom / pan trên canvas)
- Zoom 1,4–1,6× vào chi tiết đang nói (điểm 70%, đỉnh đầu tiên); tiêu đề bị đẩy ra khỏi khung là **bình thường**.
- 0,5–0,8 s, in-out; nhoè tỉ lệ vận tốc.
- Template: `"camera": [{"at","dur","x","y","scale"}]` — "nhìn vào điểm (x,y) với độ zoom".

### T4 · Lia timeline (whip scroll)
- Năm trượt ngang 2–3 mốc trong ~0,5 s, nhoè ngang mạnh giữa hành trình, dừng êm.
- Template: `timeline.focus: [{at, index, dur}]`.

### T5 · Thu vào điện thoại (zoom-out into phone)
- Clip tràn khung → thu còn ~60% vào khung điện thoại viền đen bo lớn trên nền giấy sáng, tối 60%, nhoè nhẹ khi đang thu; chữ khổng lồ mờ→nét đè lên.
- Dùng để biến "clip minh họa" thành "ý chính" (dopamine → *brain*).
- Template: layout `media` + `phone`.

### T7 · Morph (học từ mẫu 4) — chuyển giữa 2 ý cùng một mạch
- Nhận dạng: vật cũ **không rời khung**, nó tan vào vật mới ở cùng tâm. Cũ: scale 1 → 0,86, nhoè 0 → 14 px, mờ dần. Mới: scale 1,12 → 1, nhoè 14 → 0, hiện dần. ~0,42 s, ease in-out.
- Dùng khi: số thứ tự → khái niệm, clip ví dụ → vật tượng trưng (clip → não), bước 1 → bước 2. Dùng **push** khi đổi sang đối tượng khác hẳn, **cắt cứng** khi đổi bố cục.
- Template: `"transition": "morph"` (+ `morphOrigin` = tâm vật dùng chung, mặc định `"540px 620px"`).
- Morph *bên trong* một ô (số "1" → icon mắt, 4 khung nhoè chéo): scene `badge` với `morph`.

### T6 · Đổi cỡ ở jump cut (punch-in)
- Trong cảnh FULL, mỗi jump cut đổi cỡ 1,0 ↔ ~1,15–1,2. Che vết cắt, tạo nhịp.
- Template: tách thành 2 segment full liền nhau với `zoom` 1.0 / 1.18.

## Đồ họa giải thích (scene types)

| Mã | Scene | Khi nào dùng | Mẫu gốc |
|---|---|---|---|
| G1 | `chart` — biểu đồ neon | quá trình, xu hướng, "trước/sau", retention, tăng trưởng | v1 toàn bộ |
| G2 | `chart.extra` + `badge` — đường thứ 2 có huy hiệu đếm | "người xem rơi rụng", số liệu tụt/tăng | v1 15–18 s |
| G3 | `chart.trace` — tô màu một đoạn đường | "đây là chỗ đang nói" | v1 30–50 s |
| G4 | `chart.fill` / `chart.bar` — đổ vùng, thanh tiến trình vàng/xám | tổng kết một mô hình đã giải thích | v1 47–61 s |
| G5 | `chart.chips` — dây khuỷu + chip xếp chồng | liệt kê ví dụ cho một điểm | v1 38–41 s |
| G6 | `cards3d` — cụm thẻ nghiêng xoay | "đám đông", "quá nhiều nội dung", não bị quá tải | v1 12,3 s |
| G7 | `doc` — trang tài liệu nhiều màu (`build` / `fill`) | khung, cấu trúc, công thức nhiều phần | v2 toàn bộ |
| G8 | `timeline` (+`branch`) | lịch sử, các giai đoạn, "trước đây / bây giờ" | v3 4–47 s |
| G9 | `tree` — chip trên thanh nối, chấm đỏ, ví dụ phía trên | phân loại, so sánh các nhóm, chọn nhóm (xanh lá) | v3 47–84 s |
| G10 | `reelgrid` — lưới reel tự đổi + huy hiệu lượt xem | bằng chứng xã hội, "đang viral" | v3 0–3 s, v2 2,5 s |
| G11 | `uicard` — ảnh chụp giao diện trong thẻ trắng + đường neon | số liệu thật từ app (insight, dashboard) | v1 0–1,75 s |
| G12 | `showcase` — thẻ ví dụ + ghi chú serif bên cạnh | phân tích một ví dụ cụ thể | v3 27–30 s |
| G13 | `sidetags` / `list` | thuộc tính, lợi ích, danh sách ngắn | v2 22–25 s |
| G14 | `docgrid` — lưới trang tài liệu bật từng tờ | CTA lead magnet ("Comment X to get the doc") | cả 3 mẫu |
| G15 | layout `media` + `lines` | clip người nổi tiếng / ví dụ cần xem tràn khung | v1 41,7 s |
| G16 | `badge` — ô kính chứa số/icon/logo, morph nội dung, rồi **bay lên làm header** | danh sách các bước / khái niệm có tên riêng ("Visual Alignment") | v4 13–19 s, 49–54 s |
| G17 | `orbit` — thẻ ảnh/reel bay quanh một vật ở giữa, có chiều sâu; vật giữa đổi màu theo trạng thái (`colorAt`) | "nhiều nguồn → một kết quả", "cải thiện X cho mọi nội dung" | v4 75,4 s |
| G18 | `progress` — thẻ clip + thanh tiến trình trắng chạy theo lời | thời gian/quy trình dài ("tuần, tháng, cả năm"), đếm tiến độ | v4 27–39 s |
| G19 | lối vào `enter: "focus"` cho ảnh/clip — mờ nhoè rồi nét dần | khung đầu video, reveal một ví dụ | v4 0,0 s |
| G20 | vật ẩn dụ vẽ nét neon (chim, nón, vòng tròn) bằng `chart` / `NeonPath` | khái niệm trừu tượng không có ảnh thật | v4 55–69 s |

### Cách chọn graphic cho một câu
1. Câu có **thay đổi theo thời gian / mức độ** → G1–G4 (vẽ tiếp trên biểu đồ đang có, đừng mở biểu đồ mới).
2. Câu có **các phần / bước** → G7 hoặc G13.
3. Câu có **năm, giai đoạn** → G8.
4. Câu có **nhóm, loại, lựa chọn** → G9.
5. Câu khẳng định **phổ biến / hiệu quả** → G10 với số liệu thật.
6. Câu nhắc **một ví dụ cụ thể** → G12 / G15 với tư liệu thật.
7. Câu chốt / chuyển ý / cảm xúc → **không graphic, FULL người**.
8. Câu gọi tên **một bước / một khái niệm** ("bước thứ nhất là…") → G16 badge, và câu sau đó giải thích trong khối có badge làm header.
9. Câu "nhiều thứ → một thứ", "cho mọi loại nội dung" → G17 orbit.

Nguyên tắc vàng: **đổi trạng thái của vật thể đang có trước khi nghĩ tới vật thể mới.** Một video tốt chỉ cần 3–5 vật thể chính.
