# QUY TẮC PHÁT TRIỂN CODETREKKING

Tài liệu này tổng hợp 21 quy tắc cốt lõi bất biến của nền tảng CodeTrekking.

---

### Quy tắc 1: Luồng dữ liệu mô phỏng duy nhất
- Ô nhập dữ liệu → `sample.parse` → `generateSteps` → `Player`.
- Cùng giá trị hợp lệ đó qua `sample.toStdin` → `task` (dùng chung input cho mô phỏng và chạy code học sinh).

### Quy tắc 2: Giới hạn và tính thuần của mô phỏng
- `generateSteps` là hàm thuần túy, tất định, luôn kết thúc.
- Giới hạn tối đa 500 bước mô phỏng (nếu vượt quá sẽ cắt bớt và hiển thị thông báo theo `maxSimSize`).

### Quy tắc 3: Toàn vẹn từng bước mô phỏng
- `Step.line` luôn nằm trong khoảng `[1, code.length]`.
- Bước cuối cùng bắt buộc có `output` và `output === reference(input)`. Nếu sai lệch sẽ hiển thị cảnh báo đỏ ở chế độ dev.

### Quy tắc 4: Khởi tạo lại trạng thái & Bảo mật đáp án
- Khi đổi bài hoặc đổi chế độ: ô nhập reset về `defaultInput`, player về bước 0, tab quay về "Bài học".
- Tuyệt đối không hiển thị `task.referenceSolution` hoặc toàn bộ code đáp án cho học sinh ở cấp độ 1-3.

### Quy tắc 5: Xử lý ngoại lệ dữ liệu nhập
- Khi người dùng nhập dữ liệu không hợp lệ: hiển thị thông báo lỗi tiếng Việt cụ thể ngay tại ô nhập.
- GIỮ NGUYÊN kết quả mô phỏng hợp lệ trước đó, tuyệt đối không gây sập ứng dụng (crash).

### Quy tắc 6: Catalog là nguồn chân lý duy nhất (Single Source of Truth)
- `src/core/catalog.ts` là nơi duy nhất khai báo thứ tự, nhóm chuyên đề, cấp độ, nhãn thi HSG, tiền đề, và loại renderer.
- Sidebar luôn được sắp xếp theo `(groupOrder, order)`.

### Quy tắc 7: Cơ chế Registry tự động
- `Registry = catalog + file nội dung` (nạp động qua `import.meta.glob`).
- Bài có file hợp lệ mang trạng thái `'ready'`, bài chưa có hoặc thiếu trường bắt buộc mang trạng thái `'soon'`.

### Quy tắc 8: Phím tắt toàn cục và hỗ trợ đa thiết bị
- Hỗ trợ phím tắt điều hướng nhanh: `Alt+H` (Trang chủ), `Alt+1` (Khái niệm), `Alt+2` (Thuật toán), `Alt+3` (Hiểu bài tập), `Alt+4` (Luyện thi), `Alt+5` (Sổ lỗi), `?` (Bảng phím tắt).
- Không kích hoạt phím tắt khi đang nhập liệu trong input, textarea hoặc editor.

### Quy tắc 9: Liên kết hai chiều Bài tập ↔ Bài học
- Khai báo liên kết trong `Problem.lessonIds`, chiều ngược lại được registry tự động tính toán.

### Quy tắc 10: Tự động hóa bộ kiểm thử từ mẫu
- Các preset của `sample` tự động chuyển đổi thành test case của `task` qua `toStdin` + `reference`.

### Quy tắc 11: Khả năng hoạt động ngoại tuyến (Offline & PWA)
- Tích hợp Service Worker và bộ nhớ tạm để phục vụ việc học tập không cần kết nối liên tục.

### Quy tắc 12: Tiền đề là khóa mềm (Soft Prerequisites)
- Tiền đề chưa hoàn thành chỉ hiện cảnh báo và gợi ý màu vàng nhẹ, không chặn quyền truy cập học sinh.

### Quy tắc 13: Định hướng ngôn ngữ Python 3
- Toàn bộ nội dung và mã thực thi dành riêng cho Python 3.

### Quy tắc 14: Renderer Type Safety
- Mỗi renderer công bố kiểu `SnapshotOf<Kind>` trong chính file của nó; các bài học import kiểu này để đảm bảo type-check chặt chẽ.

### Quy tắc 15: Tiến độ học tập có phiên bản (Versioning)
- `ProgressState` có `version: 1`. Khi nhập file JSON tiến độ: giữ nguyên trường lạ, loại bỏ ID không còn trong catalog và thông báo số lượng bị bỏ qua.

### Quy tắc 16: Hỗ trợ giảng dạy trên lớp (Classroom Mode)
- Cung cấp nút "Chiếu lớp" phóng to kích thước chữ, tăng độ tương phản để hiển thị rõ ràng trên máy chiếu và màn hình lớn.

### Quy tắc 17: An toàn điều hướng & Cảnh báo rời trang
- Mọi màn hình (kể cả 404/Error) đều có nút quay về Trang chủ trong 1 lần bấm (`routes.home()`) và nút quay lại màn trước đó.
- Rời màn hình khi đang có bài thi tính giờ dở, bài test chưa nộp, hoặc code chưa lưu bắt buộc phải hiển thị hộp thoại xác nhận (`LeaveGuardContext`).

### Quy tắc 18: Định tuyến tập trung có kiểu (Typed Centralized Routes)
- Mọi đường dẫn trong ứng dụng được khai báo DUY NHẤT trong `src/core/routes.ts`.
- Cấm viết chuỗi đường dẫn tay (`'/concept/...'`) ở bất kỳ component nào.

---

### Quy tắc 19: Điều hướng phía Client (Client-Side Navigation)
1. **Tuyệt đối không dùng thẻ `<a>` nội bộ hoặc `window.location`:**
   - Mọi liên kết nội bộ phải sử dụng component `<Link to={routes.x(...)}>` hoặc `<NavLink to={routes.x(...)}>`.
   - Menu chính và tab bar sử dụng `<NavLink>` để tự động tô sáng mục hiện tại dựa trên `isActive`.
   - Điều hướng bằng mã (programmatic navigation) bắt buộc sử dụng `useNavigate()` hoặc `safeNavigate()` từ `LeaveGuardContext`.
   - CẤM sử dụng `<a href="/...">` trực tiếp, `window.location.href`, `window.location.assign`, `window.location.replace`, hoặc `history.pushState/replaceState` viết tay.
   - Trường hợp ngoại lệ duy nhất được phép dùng `window.location.reload()` là nút "Tải lại ứng dụng" tại màn hình `ErrorBoundary` khi xảy ra sự cố nghiêm trọng không thể phục hồi.
2. **Quy chuẩn thẻ nút và biểu mẫu:**
   - Mọi nút hành động (không phải liên kết dẫn trang) phải khai báo tường minh `type="button"`.
   - Mọi thẻ `<form>` trong ứng dụng phải có sự kiện `onSubmit` với `e.preventDefault()` để ngăn chặn hành vi tải lại trang mặc định của trình duyệt.
3. **Chuẩn HashRouter:**
   - Ứng dụng chạy trên `HashRouter`, đảm bảo không có bất kỳ đường dẫn điều hướng nào thiếu ký tự tiền tố hash `#/`.
4. **Hệ thống giám sát Dev Audit:**
   - Tích hợp bộ quét DOM tự động (`auditInternalLinksInDOM`) và đo kiểm `pagehide`/`performance.getEntriesByType('navigation')` để lập tức cảnh báo nếu phát hiện bất kỳ yêu cầu tải lại tài liệu (Document Reload) nào.

---

### Quy tắc 20: Bền vững khi đổi trang (Persistent Layout & State Preservation)
1. **Khung ứng dụng bất biến (Persistent Root Layout):**
   - `HashRouter`, `AppProvider`, và `LeaveGuardProvider` nằm ở gốc cao nhất của ứng dụng.
   - `RootLayout` bao bọc toàn bộ các route con, chứa: `Navbar` (AppHeader), thanh tab dưới di động (`BottomTabBar`), `ErrorBoundary`, và `<Outlet />`.
   - `Navbar` và `BottomTabBar` KHÔNG bao giờ bị hủy (unmount) hoặc dựng lại (re-mount) khi người dùng chuyển qua lại giữa các trang con (Trang chủ, Học tập, Bài tập, Luyện thi, Sổ lỗi, Hồ sơ, v.v.). Số lần mount của `RootLayout` và `AppHeader` luôn duy trì bằng 1 trong một phiên làm việc bình thường.
2. **Khung học tập bất biến (Persistent Learning Layout):**
   - `LearningLayout` bao bọc cả hai nhánh `concept` và `algorithm`.
   - `LearnSidebar` nằm trong `LearningLayout`, KHÔNG nằm trong `LearnPage`.
   - Khi chuyển đổi giữa các bài học hoặc chuyển giữa "Học khái niệm" và "Học thuật toán":
     - Vị trí cuộn của sidebar, nội dung ô tìm kiếm, trạng thái các bộ lọc (cấp độ, thi cử, bài sẵn sàng), và danh sách nhóm đang mở/thu gọn được GIỮ NGUYÊN 100%.
     - Khung sidebar không bị nháy, không bị tải lại.
     - Thuộc tính `key={activeLessonId}` chỉ được đặt trên container nội dung của bài học (`<div key={activeLesson?.id}>` trong `LearnPage`), tuyệt đối không đặt lên layout.
3. **Quản lý bộ lọc tập trung:**
   - Bộ lọc và từ khóa tìm kiếm của sidebar được lưu trữ theo từng loại (`concept`, `algorithm`) trong `AppContext` toàn cục, không lưu trong state cục bộ của trang con.
4. **Tự động khôi phục vị trí cuộn & Khả năng tiếp cận (Accessibility):**
   - Khi chuyển sang trang mới hoặc đổi bài học: vùng cuộn nội dung chính (`#learning-content-scroll` hoặc `window`) tự động cuộn về đầu trang (không cuộn sidebar).
   - Khi người dùng bấm nút Back/Forward của trình duyệt: hệ thống tự động khôi phục chính xác vị trí cuộn trước đó dựa trên `location.key`.
   - Tiêu đề trang (`document.title`) tự động cập nhật đồng bộ theo cấu trúc: `"[Tên nội dung] – CodeTrekking"`.
   - Khi đổi trang, tiêu điểm bàn phím (focus) tự động chuyển đến thẻ `<h1>` của nội dung mới (`tabIndex={-1}`), đồng thời vùng `aria-live="polite"` thông báo tên trang mới cho người dùng sử dụng trình đọc màn hình.
5. **Cách ly lỗi cục bộ (Localized Error Isolation):**
   - Cả `RootLayout` và `LearningLayout` đều được trang bị `ErrorBoundary`. Khi một bài học hoặc thành phần con phát sinh lỗi, khung cảnh báo lỗi chỉ xuất hiện tại vùng nội dung con; thanh tiêu đề và thanh bên vẫn hoạt động bình thường để người học tiếp tục chuyển bài.

---

### Quy tắc 21: Nhận diện thương hiệu duy nhất (Brand Single Source of Truth)
- Tên và tagline chỉ lấy từ `src/core/brand.ts` (`APP_NAME`, `APP_TAGLINE`, `APP_SHORT_NAME`, `EXPORT_PREFIX`).
- Mọi chỗ hiển thị tên chỉ lấy từ file này; không viết chuỗi tên trực tiếp ở nơi khác.
- Wordmark, biểu tượng (núi & đường mòn zích zắc), favicon, manifest, tiêu đề trang và tiền tố tệp xuất (`codetrekking-tiendo-...`, `codetrekking-baocao-...`) đều phải đồng bộ từ nguồn này.
- Tương thích ngược: Nạp tệp JSON tiến độ cũ bình thường; tự động di chuyển dữ liệu localStorage từ khóa cũ sang khóa mới khi khởi động mà không làm mất tiến độ của học sinh.
