# Design system Kallaway (đo trên khung gốc 1080×1920)

Mọi số đã nằm trong `template/src/hw/tokens.ts`. Bảng này giải thích nguồn gốc để khi chỉnh không phá hệ thống.

## 1. Ba bố cục — và chỉ ba

```
SPLIT (75–80% thời lượng)          FULL (câu chuyển ý / câu chốt)     MEDIA (≤1 lần/video)
┌────────────────────┐             ┌────────────────────┐             ┌────────────────────┐
│ Tiêu đề  y≈150–330 │             │                    │             │  clip thật tràn    │
│                    │             │   mặt người, mắt   │             │  khung, phụ đề     │
│ Sân khấu đồ họa    │             │   ở ~34% chiều cao │             │  riêng 2 dòng      │
│ y 380–1150         │             │                    │             │                    │
│   caption y=1245   │             │  caption y≈1185    │             │ → thu vào điện     │
│      ▲ đầu nhô ra  │             │  (ngang ngực)      │             │   thoại, chữ to    │
│ ╭────────────────╮ │ y=1404      │                    │             │                    │
│ │ thẻ người nói  │ │             │  push-in 3% + đổi  │             │                    │
│ │ x 68→1012      │ │             │  cỡ 1.0/1.18 ở     │             │                    │
└─┴────────────────┴─┘             └  jump cut ─────────┘             └────────────────────┘
```

**Thẻ người nói (speaker card)**: x 68–1012 (rộng 944), mép trên y=1404, chạy tràn mép dưới (không có lề dưới), bo **44 px chỉ 2 góc trên**. Cùng một source với cảnh full nhưng khung rộng (thấy đến eo, thấy phòng). **Đầu/mũ và tay vượt ra ngoài mép trên/mép phải** — người được tách nền đè lên thẻ (pop-out). Đây là chữ ký thị giác số 1 của style.

Nền sáng: thẻ có bóng đổ mềm. Nền tối: không viền, không bóng.

## 1b. Lề an toàn điện thoại (bắt buộc, chủ kênh yêu cầu 27/10/2026)
Khi xem trên điện thoại, feed cắt/đè mép trái–phải: chữ và khung ảnh sát lề bị che mất (lỗi đã gặp: dòng "Video chuẩn điện ảnh…" và khung ảnh Veo sát mép 4–22 px).
- **Không chữ, không khung ảnh/clip, không chip nào được gần mép trái/phải dưới 140 px** (≈ 1 cm trên màn hình điện thoại). Vùng an toàn: x 140–940 (rộng 800).
- Template tự xử lý: `MediaCard` dịch vào trong rồi mới thu nhỏ; chip tự dịch vào; ghi chú serif và phụ đề tự thu cỡ; tiêu đề quá dài **tự xuống 2 dòng** rồi mới thu cỡ; hàng logo, lưới reel, biểu đồ đều nằm trong 140–940.
- Thẻ người nói: x 100–980 (Kallaway gốc 68–1012) — viền thẻ không phải chữ nên được rộng hơn vùng an toàn một chút.
- Ngoại lệ có chủ đích: timeline/cây đang lia, camera zoom sát — vật **đang chuyển động** được phép tràn ra mép, vật **đứng yên** thì không.

## 2. Màu

| Vai trò | Mã | Ghi chú |
|---|---|---|
| Nền tối | `#050505` + chấm lưới 1,2 px trắng 7,5% mỗi 32 px + vignette | không bao giờ đen tuyền phẳng |
| Nền sáng | `#E1E1E0` + chấm 11 px + lưới 44 px (giấy kẻ) | dùng cho **mở đầu & CTA** |
| Đỏ chữ | `#C4000A` | từ khóa xấu/cảnh báo trong tiêu đề ("Video Fails") |
| Đỏ hộp | `#AE0001` | hộp sau chữ trắng: {No Longer Works}, {To Get The Doc} |
| Đỏ đường | `#E0101E` glow | đường "cách cũ" |
| Magenta | `#D11CFF`, tô vùng `#9A00BD` | đường "cách mới", phần đang nói tới |
| Vàng | `#FAEE06` | hook, đỉnh, nắp chip |
| Xám | `#ABABA8` | phần "nhả", thứ không quan trọng |
| Xanh lá | `#1FC305` / chip `#147A1E` / huy hiệu `#16B23A` | "chọn cái này", lượt xem |
| Cyan / tím | `#16F4E0` / `#8C009F` | chỉ trong tài liệu nhiều phần |

Quy tắc: **một màu = một nghĩa trong cả video.** Không dùng màu để trang trí.

## 3. Chữ

| Vai trò | Font (bản dựng) | Cỡ | Ghi chú |
|---|---|---|---|
| Tiêu đề sans | Inter Tight 800, tracking −0,04em | 60–76 px | gốc là grotesk display đậm (kiểu Neue Haas/Inter Display) |
| Từ nhấn serif | **Instrument Serif Italic** (chữ không dấu) / **Noto Serif Display Italic, wdth 62, wght 400** (có dấu tiếng Việt) | ×1,32 cỡ sans, chung baseline | serif hẹp, nghiêng; chọn theo cả chuỗi để không lẫn glyph |
| Caption | Inter Tight 760, 64 px, tracking −0,035em | 1 từ / cụm ≤14 ký tự | trắng trên tối, `#0B0B0B` trên sáng, không viền; full-screen thêm bóng mờ |
| Caption serif | font serif như trên, 84 px | | cụm khái niệm then chốt |
| Chip | Inter Tight 750, 24–34 px | | đen nền, viền xám 3 px, bo 0,42em |
| Nhãn điểm | Inter Tight 700, 22 px, chữ đen trên nền trắng bo 7 px | | "Initial Conflict" |
| Số lớn | Inter Tight 800–900, 66 px (năm), 170 px (từ khổng lồ) | | |

Công thức tiêu đề: **[sans đậm] + [serif nghiêng cho danh từ khái niệm]**, hoặc **dòng 1 sans + dòng 2 có từ đỏ / hộp đỏ**. Viết hoa chữ cái đầu mỗi từ (Title Case) với tiếng Anh; tiếng Việt viết hoa chữ đầu câu là đủ.

## 4. Ánh sáng & chất liệu

- **Neon**: mỗi đường = 3 lớp: glow rộng (×3,2 nét, blur 2,2×nét, 85%), thân màu, lõi trắng 28% nét 55%.
- Trục: trắng, có glow, **mờ dần ở đầu mút** (gradient về 0 ở 20–25% cuối).
- Chấm mốc: tròn trắng 22 px, glow trắng 18 px.
- Thẻ/tài liệu trên nền tối: viền trắng 3 px + glow trắng 40 px 22%.
- Không có: gradient màu loè loẹt, bóng đổ đen trên nền tối, emoji, sticker, icon hoạt hình.

## 5. Nhìn từ xa
Mỗi khung chỉ có **1 vật thể chính** + tiêu đề + 1 từ caption. Khoảng trống rất nhiều. Nếu khung có >3 nhóm thông tin là sai style.
