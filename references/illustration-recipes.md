# Minh hoạ: biến mọi câu thành một hình vẽ (luật L-DRAW)

**Luật (chủ kênh yêu cầu 27/10/2026):** mọi khối SPLIT phải có ít nhất một **hình minh hoạ được vẽ** cho đúng ý câu đó — `illus`, `chart`, `orbit`, `badge`, `timeline`, `tree`, `doc`, `progress`, `cards3d`, hoặc `uicard` có đường neon vẽ đè. Khối chỉ gồm chip/capsule (`list`, `sidetags`), thẻ ảnh (`showcase`), hàng logo hay lưới reel là **lỗi** — đó là đồ hoạ lắp ghép, không phải minh hoạ. `lint_plan.py` báo ERROR.

Kallaway không minh hoạ bằng chữ. Mỗi ý là **một vật thể có chuyển động mang nghĩa**: não *đầy dần* màu = hiểu dần; chim *lao từ cao xuống* hình nón = đi từ bối cảnh rộng tới điểm chính; đường cong *tụt* = người xem bỏ đi. Hình phải **kể được ý câu khi tắt tiếng**.

## Cách làm cho một câu (4 bước)
1. **Tìm động từ của câu**, không phải danh từ: "gom", "tụt", "chuyển", "lọc", "tăng", "chọn", "kết nối", "so sánh". Động từ quyết định chuyển động.
2. **Chọn vật ẩn dụ** cho chủ thể (bảng dưới; icon nét có sẵn trong `assets/icons`, thiếu thì thêm SVG Lucide rồi chạy `build_icons.py`).
3. **Viết chuyển động = động từ**: vẽ ra (xuất hiện), chảy hạt (gom/truyền), dâng màu (đầy/đánh giá), đổi màu (đổi trạng thái), vòng + dấu X (loại bỏ), số chạy (tăng), dãy icon sáng dần (tỉ lệ).
4. **Neo vào lời**: mỗi bước chuyển động bắt đầu `word.s − 0.2` của từ mang nghĩa. 1 khối 4–8 s phải có 3–6 bước (luật đứng yên ≤ 2,5 s).

## Bảng công thức (dùng scene `illus`, ghép nhiều item)

| Ý trong câu | Công thức hình | Item `illus` |
|---|---|---|
| Gom nhiều nguồn → một kết quả | 3–4 icon nguồn bên trái, **hạt chảy** vào vật giữa, vật giữa sáng lên/đổi màu | `icon`×3 + `flow`×3 + `orb` + `icon` (states) |
| X tốt / X kém ở một mặt | vật thể **dâng màu** từ dưới lên tới mức tương ứng (đỏ = kém, xanh = tốt) | `icon` + `level {color, to}` |
| Loại bỏ / không dùng | vòng đỏ vẽ ra quanh **icon vẽ** (không phải ảnh) + dấu X | `ring` (red) + `icon x` |
| Chuyển từ A sang B (quy trình) | A → **đường cong có mũi tên**, chấm sáng chạy dọc → B sáng lên | `icon` + `line {arrow, dot}` + `icon` (states) |
| Tỉ lệ / bao nhiêu người | dãy 10 icon người, **N cái sáng xanh** theo nhịp + số chạy | `array {on.count}` + `counter` |
| Tăng trưởng / kết quả số | số lớn **chạy** từ 0, đường neon đi lên | `counter` + `path` hoặc scene `chart` |
| Viết / tạo nội dung | bút vẽ ra một **nét sóng** (dòng chữ tượng trưng), lấp lánh ở cuối | `icon pen-tool` + `path` + `icon sparkles` |
| Tập trung / điểm chính | quầng sáng mờ → vòng tròn thu nhỏ vào **một chấm** | `orb` + `ring` + `ring` nhỏ |
| Rộng → hẹp (lọc, đào sâu) | hình **nón/phễu** vẽ ra, màu đổ từ đỉnh xuống đáy | `path` (nón) hoặc `icon filter` + `level` |
| Kết nối / tích hợp | 2–3 vật, **đường nối** vẽ lần lượt, chấm chạy vòng lặp | `line {dot.loop}` |
| So sánh 2 lựa chọn | 2 vật hai bên, bên thắng sáng xanh + glow, bên thua mờ xám | `icon` ×2 (states: grey / green) |
| Thời gian / chờ lâu | đồng hồ cát + thanh tiến trình | `icon hourglass` + scene `progress` |
| Tiền / chi phí | đồng xu rơi thành chồng (dãy `coins`), số chạy kèm "đ"/"$" | `array` + `counter` |
| Ý tưởng / mẹo | bóng đèn vẽ ra rồi **bật sáng** (orb vàng phía sau) | `icon lightbulb` + `orb yellow` |
| Cảnh báo / lỗi phổ biến | vật đỏ nhấp nháy, đường retention **tụt** | `icon` (red, pulse) + scene `chart` |
| Khái niệm trừu tượng có tên riêng | ô kính chứa số → morph thành icon → bay lên làm header | scene `badge` (+ `illus` phía dưới) |

## Cách chèn hình thật để nó "là minh hoạ" chứ không phải thẻ dán
- **Vẽ đè lên hình**: thêm `illus` làm `layers` của scene `showcase`/`uicard`: nhãn trắng pin cạnh, đường neon vẽ trên ảnh chụp app (mẫu 3: nhãn "Curiosity hook"; mẫu 1: đường retention). **Không khoanh tròn lên ảnh** (L-NORING — vòng khoanh luôn lệch chỗ).
- **Hình là một nút trong sơ đồ**: ảnh/clip nằm đúng vị trí của nó trong flow (nguồn → não → kết quả), nối bằng `line`/`flow`, không đứng một mình.
- **Hình biến thành vật** (morph): clip ví dụ → vật tượng trưng (mẫu 4: clip MrBeast → não).
- **Nhiều hình** → `orbit` quanh vật trung tâm hoặc lưới đều, không dán rời rạc.

## Màu trong minh hoạ (craft-rules §3)
Nét trắng là mặc định. **Tối đa 2 màu neon mỗi khung, 2 màu cho cả video** (`plan.palette`, L-COLOR). Gợi ý nghĩa: magenta = dòng chảy/đang xử lý, đỏ = vấn đề, vàng = sáng tạo/ý tưởng, xanh lá = **chỉ** kết quả được chọn ở cuối khối.

## Ví dụ chạy được
`references/plan-example-avatar-9-ai.json` (bản chuẩn, đã duyệt màu/khoanh/phụ đề — 0–28 s video 9 công cụ AI Google) và `references/illus-example.json`: 3 khối của video "AI viết bài" (Claude gom thông tin → tiếng Việt chưa tự nhiên → ChatGPT viết lại), đã render kiểm 27/10/2026.
