# Kallaway Style – skill edit video talking-head cho Claude Code

Skill giúp Claude Code dựng video dọc 9:16 kiểu Kallaway từ một video bạn nói trước camera:

- Minh hoạ neon vẽ riêng cho từng ý (icon tự vẽ, biểu đồ, timeline, morph)
- Thẻ người nói bo góc dưới đáy, đầu nhô ra khỏi khung
- Caption chạy theo từng chữ, tiêu đề sans đậm + serif nghiêng + hộp đỏ
- Cắt cứng ở câu chuyển ý, nhạc ngắt trước điểm reveal, thumbnail cùng style

Chia sẻ bởi **Nhật Dương** · [Facebook](https://www.facebook.com/nhatduong.vn) · [YouTube](https://www.youtube.com/@Under30vn) · [TikTok](https://www.tiktok.com/@nhatduong.vn)

## Cần có

- [Claude Code](https://claude.com/claude-code)
- Node.js 18+ (Remotion được cài tự động khi tạo dự án)
- Python 3.10+ và ffmpeg
- `pip install faster-whisper opencv-python pillow numpy rembg` (tuỳ chọn thêm `demucs torch librosa soundfile` để tách nhạc 2 lớp)

## Cài đặt

```bash
git clone https://github.com/<user>/kallaway-style-skill ~/.claude/skills/kallaway-style
```

Trên Windows: clone vào `%USERPROFILE%\.claude\skills\kallaway-style`.

## Dùng

Mở Claude Code trong thư mục chứa video của bạn và nói:

> Dựng video này theo style Kallaway

Claude sẽ đọc `SKILL.md` và làm theo quy trình: cắt thô → bạn duyệt → lên plan → vẽ graphic → render → thumbnail.

## Giấy phép

- Font trong `assets/fonts` dùng giấy phép SIL Open Font License.
- Icon trong `assets/icons` theo `assets/icons/LICENSE.txt`.
- Remotion có giấy phép riêng: miễn phí cho cá nhân và công ty nhỏ, xem remotion.dev/license.
