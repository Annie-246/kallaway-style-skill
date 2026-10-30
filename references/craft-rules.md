# Luật tay nghề (đo trên 4 mẫu, 27/10/2026)

Mọi con số ở đây đo bằng `scripts/measure_craft.py` (pixel, nhịp, màu) và đếm tay trên 21 tiêu đề. Mục tiêu dạng khoảng nằm ở `craft-targets.json`; hai công cụ kiểm:
- **Trước render**: `python scripts/lint_plan.py --project <…>` — ERROR phải sửa, WARN sửa trừ khi có lý do.
- **Sau render**: `python scripts/measure_craft.py --video out/final.mp4 --plan public/plan.json --compare` — mọi chỉ số WARN phải giải thích hoặc sửa trước khi giao.

## 1. Nhịp — giữ chân người xem đến cuối

| Số đo | 1 | 2 | 3 | 4 | Luật |
|---|---|---|---|---|---|
| Thời lượng có đồ họa | 79% | 73% | 80% | 79% | 72–82% |
| Số cảnh mặt người | 8 | 4 | 8 | 6 | ~1 cảnh / 9–10 s |
| Cảnh mặt người, trung vị | 1,9 s | 2,4 s | 2,4 s | 2,6 s | 1,5–3 s; dài hơn 4 s phải có jump cut đổi cỡ |
| Khối đồ họa, trung vị | 5,3 s | 7,1 s | 6,3 s | 4,6 s | 4–8 s rồi chuyển ý |
| **Đứng yên lâu nhất trong khung đồ họa** | 2,1 s | 1,5 s | 4,5 s | 1,8 s | **≤ 2,5 s** — luôn có gì đó đổi: chip mới, chữ gõ, vẽ thêm, camera trôi |
| CTA bắt đầu ở | 86% | 76% | 92% | 86% | 76–92% thời lượng |

Cấu trúc giữ chân (lặp ở cả 4 mẫu):
1. **0–0,2 s**: đã có chuyển động (tiêu đề bật/gõ, vật mờ→nét). Không khung đen, không logo kênh.
2. **≤ 3,5 s**: cú cắt đầu tiên sang mặt người — người nói "ký tên" vào lời hứa của hook.
3. **Vòng mở** (open loop): báo trước số lượng ("2 bước", "8 nguyên tắc", "3 loại") ở 10–15 s đầu, trả dần đến gần cuối (mẫu 4: hứa "2 bước" ở 13 s, bước 2 tới 49,6 s). Người xem ở lại để nhận nốt.
4. **Đổi hình thức mỗi 4–8 s**: chuỗi biểu đồ → mặt → thẻ clip → mặt → morph… không có hai khối liền nhau cùng một kiểu.
5. **Khối bằng chứng thật** (reel, số liệu, ảnh chụp app) xuất hiện trước khi người xem kịp nghi ngờ (mẫu 3: ngay khung đầu; mẫu 2: 2,5 s).
6. **Kết** trên đồ họa CTA hoặc một câu mặt người ngắn; nhạc nhỏ dần, không outro.

## 2. Khoảng cách (px trên khung 1080×1920, chỉ khung đồ họa)

| Số đo | 1 | 2 | 3 | 4 | Luật |
|---|---|---|---|---|---|
| Lề trên (mép trên tiêu đề) | 152 | 112 | 124 | 92 | 90–160 |
| Khoảng trống giữa các khối (trung vị) | 80 | 96 | 72 | 100 | **70–110**, p25–p75 ≈ 50–140 |
| Đáy đồ họa → phụ đề | 183 | 111 | 39 | 115 | 35–190 (trung vị ~110) |
| Số khối nội dung | 2 | 2 | 2 | 2 | **2**: tiêu đề + một vật thể chính (tối đa 3) |
| Phần khung có nội dung | 10% | 24% | 26% | 24% | **10–27%** — ¾ khung là khoảng trống |
| Lề trái/phải vật đứng yên | — | — | — | — | ≥ 140 (L-SAFE, yêu cầu của chủ kênh, chặt hơn Kallaway 50–176) |

Khoảng cách trong tiêu đề: baseline 2 dòng cách nhau 0,92 × cỡ chữ (khe mực ~13 px).

## 3. Màu

| Số đo | 1 | 2 | 3 | 4 | Luật |
|---|---|---|---|---|---|
| Diện tích màu nhấn (trung vị) | 1,7% | 7,5% | 1,3% | 2,3% | **1–8%**; đỉnh (p90) 9–13% |
| Số họ màu nhấn trên một khung | 2 | 3 | 1 | 1 | **1–2**, tối đa 3 (chỉ trang tài liệu nhiều phần) |
| Đỏ trong tổng màu nhấn | 26% | 52% | 25% | 55% | màu nhấn chủ đạo |
| Xanh lá | 0% | 5% | 4% | 6% | **≤ 6%** — chỉ cho khoảnh khắc "chọn cái này / đạt" |

**Luật khoá cứng (chủ kênh, 27/10/2026):** tối đa **2 màu neon mỗi khung**, **2 màu chủ đạo cho cả video** (`plan.palette`). Trắng/xám không tính. Neon phải **dịu**: glow 42%, lõi trắng 22% — bản đầu chói quá đã bị chê.

Luật phối:
- Nền gần đen hoặc giấy xám nhạt chiếm ~75% khung; chữ trắng/đen; **mỗi khung chỉ 1 màu mang nghĩa** (cộng màu da/ảnh thật).
- Đỏ = vấn đề, cái cũ, cảnh báo, hộp nhấn CTA. Magenta = cách mới / "đang nói tới". Vàng = hook, đỉnh. Xanh lá = được chọn / đạt — **một lần mỗi khối, không phải mọi chip**.
- Đổi trạng thái bằng màu trên cùng một vật (não trắng → vàng → đỏ → xanh) thay cho thêm chữ.
- Lỗi đã mắc (bản thử 27/10): cho cả chuỗi chip chuyển xanh → xanh lá 36% màu nhấn, gấp 6 lần Kallaway. Giữ chip trạng thái mặc định (đen viền xám), chỉ chip/logo được chọn mới xanh.

## 4. Hiệu ứng chữ (đo từng khung)

| Kiểu | Đo được | Dùng khi | Template |
|---|---|---|---|
| Gõ trái → phải | ~100 ký tự/s (dòng 36 ký tự ≈ 0,36 s); dòng 2 trễ 0,17–0,32 s và **chớp khi vào**; hộp đỏ quét ~0,48 s, đi trước chữ ~1 khung | tiêu đề mở một khối mới | `title.mode: "type"` (mặc định) |
| Bật neon cả câu | cả tiêu đề hiện cùng lúc, tắt–bật 2 lần trong ~5 khung | tiêu đề ngắn của một vật thể (biểu đồ) | `"flicker"` |
| Từng chữ theo lời | mỗi chữ hiện đúng lúc được đọc (~3 khung/chữ), dòng 2 chớp | tiêu đề trùng câu đang nói (hook, lời hứa) | `"words"` (+ `wordTimes` từ words.json) |
| Phụ đề | 1 từ/lần, đổi đúng `word.s` (±20 ms), cắt cứng không nảy | luôn luôn | Caption |
| Cụm khái niệm trong phụ đề | serif nghiêng, mờ nhoè → nét 4 khung | 3–8 cụm/video | `captions.serif` |
| Ghi chú serif cạnh hình | gõ chậm ~25–45 ký tự/s, xám sáng | bình luận về một ví dụ | SerifNote |

## 5. Nhấn mạnh trong tiêu đề (21 tiêu đề)

- **86% tiêu đề có đúng 1 điểm nhấn**; 14% không nhấn (tiêu đề thông tin thuần: "Visual Alignment", "This Is How Social Media Used To Look Like Before").
- **Serif nghiêng** (13/21): 1–2 từ, là **danh từ khái niệm hoặc động từ cảm xúc** ("_Story Arc_", "_Changed_", "_Crazy Viral_"); vị trí giữa đến cuối câu (20–85%, trung vị ~45%). Không bao giờ là cả câu.
- **Hộp đỏ** (7/21): 3–4 từ, **cả dòng 2**, là lời hứa/kết quả ("No Longer Works", "Drives Views & Leads", "To Get The Doc").
- **Chữ đỏ** (2/21): chỉ trên nền sáng, cho kết quả xấu ("Video Fails").
- **Không trộn 2 kiểu nhấn** trong một tiêu đề — trừ CTA: `Comment _“Từ khoá”_ / {To Get The Doc}`.
- Dòng: 1–2 dòng; 2–6 từ/dòng (trung vị 4); tiếng Việt ≤ ~33 ký tự/dòng.
- Viết hoa: tiếng Anh Title Case; tiếng Việt viết hoa chữ đầu dòng + tên riêng.

## 6. Cách đặt hình ảnh

- Hình thật là **video đang chạy** nhiều hơn ảnh tĩnh; vào bằng cắt / mờ dần ≤ 5 khung / mờ nhoè → nét; luôn zoom chậm khi đứng.
- Hình luôn **trả lời câu đang nói**, không minh hoạ chung chung; đổi hình khi câu đổi ví dụ.
- Nhiều hình cùng lúc → lưới đều (3 cột, khoảng cách ~22 px) hoặc orbit quanh một vật; không xếp lộn xộn.
- Khung hình: bo 14–20 px, viền trắng mảnh 2 px, glow trắng 18–30% — **không** bóng đổ đen, **không** khung màu.
