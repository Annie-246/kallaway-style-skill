# Âm thanh

Số đo gốc: `references/precise-measurements.md` §4 (tách nguồn bằng Demucs). Bản trước của file này ghi "không có SFX, nhạc pad cố định" — **sai**, đã sửa.

## Kallaway làm gì

1. **Nhạc là một nhạc cụ dựng phim, không phải nền.** Hai kiểu: pad synth trầm (v1) hoặc beat hip-hop 808 ~130 BPM (v2, v3).
2. **Cảnh FULL đầu tiên sau hook: im nhạc hoàn toàn.** Câu "vì…" của hook vang lên trong im lặng; nhạc/beat đổ vào đúng khung cắt sang graphic đầu tiên.
3. **Beat chỉ chơi khi có đồ họa** (rõ nhất ở v2): vào cảnh mặt người thì trống tắt, còn pad/bass; quay về SPLIT thì trống vào lại, cú kick đầu rơi trong 0–300 ms sau cắt.
4. **1–2 lần ngắt giữa video**, cắt chết (không fade), thường đi kèm một tiếng rền/riser tăng dần **dừng đúng lúc nhạc tắt**.
5. **SFX rất ít và đều ở dải trầm**: sub-boom ở khung đầu và ở 1–2 reveal lớn; boom/whoosh trầm ở push lớn. Không có pop, ding, click, whoosh sáng.
6. Giọng: sạch, khô, cắt hết hơi thở; clip minh hoạ tắt tiếng gốc.

## Làm trong template

- `prep_music.py` tách bài nhạc thành `music/rest.wav` (bass+other) và `music/drums.wav`.
- `plan.music`: `rest` + `drums` + `volume` + `drops` (tắt cả hai lớp) + `drumsOnlyInSplit: true`.
- Cảnh FULL đầu tiên sau hook: tự động đưa vào `drops` (plan_skeleton làm).
- Bài không có trống (pad): chỉ cần `src`, bỏ `drums`.

## Ánh xạ sang luật SFX L1–L23

Mã L1–L23 là bảng luật SFX nội bộ: L1 whoosh, L3 riser, L4 impact, L5 boom, L10 chime, L15 im nhạc, L17 tick, L23 không SFX.

| Sự kiện Kallaway | Luật | Làm gì | File gợi ý (tải ở myinstants.com) |
|---|---|---|---|
| Khung đầu (tiêu đề hook bật) | **L5** boom nhẹ | sub-boom tại frame 0, ≥6 dB dưới giọng | `big-boom-sub-drop`, `deep-bass-boom-cinematic` |
| Push / camera bay lớn / thu vào điện thoại | **L1** whoosh nhẹ | whoosh **trầm**, vắt qua chuyển động | `deep-swoosh` |
| Reveal lớn giữa video | **L4** impact vừa | tối đa 1–2 lần | `bass-impact` |
| Trước khoảnh khắc chốt | **L3 → L15** | riser 0,5–1 s **dừng chết** đúng lúc nhạc tắt, rồi im lặng | `cinematic-suspense-riser` (cắt đuôi) |
| Cảnh FULL đầu tiên sau hook | **L15** | im nhạc (giới hạn của guide: tối đa 2 lần L15/video, tính cả lần này) | — |
| **Morph** (vật này tan thành vật kia), clip/thẻ đổi chỗ, badge bay lên header | **L1** whoosh nhẹ | whoosh **dải rộng, mềm**, 0,3–0,6 s, ≥6 dB dưới giọng; đỉnh trùng giữa morph. Mẫu 4 có tiếng này ở mọi morph | `deep-swoosh` (cắt 0,6–2,2 s) — **dùng một mẫu cho mọi morph** |
| Orbit bắt đầu quay / lưới reel bật | **L1** (1 lần cho cả cụm) | một whoosh ở lúc cụm xuất hiện, không gõ theo từng thẻ (E1) | như trên |
| Thanh tiến trình chạy | không (hoặc **L17** tick nếu là đếm số thật) | mẫu 4 để im | — |
| Não/vật đổi màu sang xanh = "đạt" | **L10** success chime (tuỳ chọn, rất nhỏ) | mẫu gốc để im — chỉ thêm khi người dùng muốn | — |
| Cắt SPLIT↔FULL, jump cut, chip/chấm/trang bật | **L23 / không** | KHÔNG SFX | — |

Nguồn tải: **myinstants trước, ElevenLabs sau**. Dựng xong liệt kê SFX + mốc + mã luật + các khoảng im nhạc.

### Quy tắc mật độ SFX
- **Mật độ**: talking head 3–6 điểm SFX có chủ đích mỗi phút ở đoạn nhiều phần tử, đoạn nói liền gần như 0; tiếng lớn (boom/impact) 1–3 lần cả video. Mẫu 4 đo được ~6 whoosh/90 s + beat — nằm trong khoảng này.
- **Whoosh bắt đầu sớm ~0,18 s** để đỉnh rơi đúng frame chuyển (vắt qua điểm chuyển, L1).
- **Một loại sự kiện = một mẫu tiếng** cho cả video (E9). Morph luôn cùng một whoosh, sub-boom luôn cùng một file.
- **Một khoảnh khắc = một SFX chính** (E8): morph có whoosh thì logo/chip hiện trong morph đó không thêm pop.
- **Không đặt đỉnh SFX đè âm tiết quan trọng** (tên sản phẩm, con số): xê dịch vài chục ms (E4).
- **Nghe thử bằng loa điện thoại**; sub-boom gần như không nghe trên loa điện thoại (E11) nên đừng để điểm nhấn chỉ dựa vào trầm.
- **archive.org KHÔNG dùng cho SFX** (người dùng đã nghe thử và không ưng) — chỉ cho ảnh/clip minh hoạ.
- Ghi nguồn SFX vào `sfx-credits.csv`.

## Mức âm lượng
- Giọng chuẩn hoá cuối −14 LUFS.
- Nhạc rest ≈ −17…−20 dB dưới giọng; drums có thể to hơn rest 3–4 dB (beat phải nghe rõ trên loa điện thoại khi vào lại).
- SFX trầm: ≥6 dB dưới giọng (guide), riser ≥10 dB dưới giọng.

## Hoàn thiện
`ffmpeg -i out/draft.mp4 -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:v copy -c:a aac -b:a 192k out/final.mp4`
Render Remotion: đặt `TEMP`/`TMP` sang ổ D (mỗi lần render chép cả `public/` vào thư mục tạm — đã từng làm đầy ổ C).
