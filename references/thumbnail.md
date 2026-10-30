# Thumbnail kiểu Kallaway

Video dựng bằng style này thì thumbnail **cũng phải theo style này**. Không dùng kiểu
Nhật Dương (viền neon đỏ + xanh quanh người, chữ Anton viết hoa, nền gradient đỏ):
người dùng đã bác kiểu đó ở video "9 công cụ AI Google" (27/10/2026).

## Cách làm: một khung hình được thiết kế của chính hệ thống video

Không vẽ bằng Pillow. Template có sẵn composition `Thumb` (`src/Root.tsx`) đọc
`public/plan_thumb.json`, nên font, màu, ô kính, ánh sáng neon, thẻ người và đầu nhô ra
khớp hoàn toàn với video. Ví dụ chạy được: `references/thumb-example.json`.

`plan_thumb.json` = `plan.json` thu gọn:
- Giữ nguyên `source` (video, `matte`, `face`, `cardZoom`, `cardEyeY`) và `logos`.
- `words: []`, `sfx: []`, `captions: {serif: [], hide: []}`, bỏ `music`. Không caption.
- **Một** segment `split` theme `dark` phủ cả `duration`, có thẻ người.
- **Một** scene `"type": "none"`, `"at": 0`, `"drift": 0` (khung tĩnh không trôi), chứa
  title + layers. Mọi `at` / `greenAt` của item đặt `0` để tất cả đã hiện đủ.

Render (TEMP/TMP trỏ sang ổ D nếu ổ C đầy):
```bash
cd "<…>/kallaway"
npx remotion still src/index.ts Thumb out/thumb.png --frame=<f>
# rồi lưu JPG quality 94 ở thư mục video: "<tên video> (thumb).jpg", xoá png trung gian
```

## Bố cục (1080x1920)

1. **Tiêu đề trên cùng** (`y` ≈ 120, `size` ≈ 104): 2 dòng ngắn, gợi tò mò, **đúng một
   điểm nhấn kiểu `{hộp đỏ}` + một cụm `_serif nghiêng_`**. Ví dụ:
   `"{Ngừng} trả tiền AI\n9 tool _miễn phí_"`. Không viết hoa toàn bộ.
2. **Vật thể chính ở giữa** (y ≈ 600–1300): đúng vật thể đặc trưng của video. Video liệt
   kê công cụ thì dùng lưới logo trên ô kính (3 layer `logos`, mỗi hàng 3, `size` 205,
   `gap` 48, `y` 600/840/1080). Video khác: biểu đồ, trang tài liệu, cây chip ở trạng thái
   đẹp nhất.
3. **Màu mang nghĩa như video**: tô **xanh lá** (`greenAt: 0`) đúng **một** ô là thứ người
   xem nên chọn hoặc thứ đáng chú ý nhất. Không tô nhiều ô.
4. **Thẻ người nói ở đáy, đầu nhô ra khỏi thẻ**: người là người dẫn, vật thể mới là vai
   chính.

## Chọn khung `--frame`

- Mắt nhìn máy, miệng gần khép, tay gọn. Xem bằng mắt vài khung `remotion still` trước khi
  chốt.
- Khung phải nằm trong một segment **SPLIT có card** của `plan.json` video: `person.webm`
  chỉ có người ở các khung đó. Ngoài vùng đó là trong suốt nên đầu không nhô ra được.
- Video dùng avatar HeyGen ở vài khúc thì lấy khung trong khúc avatar cuối (thường nhìn
  máy rõ nhất).

## Logo

- Logo đơn sắc đen phải có bản trắng cho nền tối: đặt RGB = 255, **giữ nguyên alpha**,
  khai báo `"dark": "logos/<key>-white.png"`.
- Favicon chính thức trông mờ ở cỡ nhỏ (ví dụ Flow là chùm sáng máy chiếu) thì báo người
  dùng và đề xuất thay, không tự vẽ lại logo khác.
