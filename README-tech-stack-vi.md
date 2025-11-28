# IoT Energy Dashboard - Tech Stack & Hướng Dẫn Phát Triển

## 1. Technology Stack (Công Nghệ Sử Dụng)

Dự án này sử dụng một stack hiện đại, nhẹ và hiệu năng cao, được thiết kế chuyên biệt cho việc giám sát IoT thời gian thực.

- **Core Framework**: **React 19**
  - Phiên bản mới nhất của thư viện JavaScript phổ biến nhất để xây dựng giao diện người dùng.
- **Build Tool & Bundler**: **Vite (Rolldown-Vite)**
  - Công cụ frontend thế hệ mới. Chúng ta đang sử dụng phiên bản chạy trên nền tảng Rolldown để đạt tốc độ tối đa.
- **Ngôn ngữ**: **JavaScript (ES Modules)**
  - JavaScript hiện đại tiêu chuẩn.
- **Styling (Giao diện)**: **Native CSS3**
  - Sử dụng các tính năng CSS nâng cao bao gồm CSS Variables, Flexbox, Grid Layout, và Backdrop Filters (Hiệu ứng Glassmorphism).
- **Linting**: **ESLint**
  - Đảm bảo chất lượng code và phát hiện lỗi sớm.

---

## 2. Tại sao lại chọn Tech Stack này?

### React 19

- **Component-Based (Hướng thành phần)**: Hoàn hảo cho một dashboard nơi mỗi "Panel" (Điện áp, Dòng điện, Công suất) là một thành phần có thể tái sử dụng.
- **Virtual DOM**: Cập nhật hiệu quả chỉ những con số thay đổi (rất quan trọng cho dữ liệu năng lượng thời gian thực) mà không cần render lại toàn bộ trang web.
- **Hệ sinh thái**: Hỗ trợ khổng lồ và nhiều thư viện có sẵn nếu chúng ta cần thêm các biểu đồ phức tạp sau này.

### Vite (Rolldown)

- **Tốc độ**: Khởi động server ngay lập tức và HMR (Hot Module Replacement) cực nhanh. Khi bạn chỉnh sửa hiệu ứng kính (glass effect), bạn sẽ thấy thay đổi ngay lập tức mà không cần reload.
- **Build tối ưu**: Tạo ra các file tĩnh được tối ưu hóa cao cho việc deploy production.

### Native CSS (Glassmorphism)

- **Hiệu năng**: Chúng ta tránh sử dụng các UI framework nặng nề (như Bootstrap hay MUI) để giữ cho dung lượng tải trang ở mức thấp nhất.
- **Tùy biến**: Glassmorphism dựa nhiều vào `backdrop-filter`, màu `rgba`, và đổ bóng phức tạp. Viết CSS thuần giúp chúng ta kiểm soát tuyệt đối các sắc thái hình ảnh này để đạt được giao diện "Industry" mong muốn.

---

## 3. Kiến trúc Ứng dụng & Luồng Dữ liệu (Data Flow)

### Chiến lược Luồng Dữ liệu

Ứng dụng tuân theo **Luồng dữ liệu một chiều (Unidirectional Data Flow)** của React:

1.  **Nguồn Dữ liệu (Mock/Real)**:
    - Hiện tại, dữ liệu được định nghĩa trong `App.jsx` (`const data = ...`).
    - **Tương lai**: Dữ liệu sẽ đến từ kết nối WebSocket hoặc polling REST API.
2.  **Quản lý State**:
    - Dữ liệu đi vào state của component `App`.
    - Khi State cập nhật -> Kích hoạt render lại giao diện.
3.  **Render Component**:
    - `App` truyền các phần dữ liệu cụ thể (ví dụ: `data.voltage`) xuống các component con (Panels) thông qua **Props**.
    - Các Panel là các component "thuần" (pure); chúng chỉ hiển thị những gì được nhận.

### Cấu trúc Hiển thị

- **`index.html`**: Điểm khởi đầu.
- **`main.jsx`**: Khởi tạo React.
- **`App.jsx`**: Container chứa Logic chính và Bố cục (Layout).
  - **Header**: Tiêu đề Dashboard.
  - **Grid Container**: Bố cục lưới responsive cho các panel.
  - **Glass Panels**: Các thẻ dữ liệu riêng lẻ.

---

## 4. Hướng dẫn Phát triển (Clean Code & Performance)

Để duy trì chất lượng code cao, hãy tuân thủ các quy tắc sau:

### Code ở đâu?

- **Logic & State**: Giữ trong `src/App.jsx` (hoặc chuyển sang custom hook `useEnergyData.js` nếu logic phức tạp).
- **Styles**: Giữ trong `src/App.css`. Sử dụng tên class cụ thể (ví dụ: `.glass-panel`) để tránh xung đột.
- **Global Styles**: `src/index.css` chỉ dùng cho reset và màu nền body.

### Nguyên tắc Clean Code

1.  **Tách Component**:
    - _Hiện tại_: Tất cả HTML đang nằm trong `App.jsx`.
    - _Mục tiêu_: Khi app lớn hơn, hãy tách "Glass Panel" thành component riêng: `src/components/GlassPanel.jsx`.
    - _Quy tắc_: Nếu bạn copy-paste code quá 2 lần, hãy biến nó thành một component.
2.  **Quy ước đặt tên**:
    - Biến: `camelCase` (ví dụ: `voltageValue`).
    - Component: `PascalCase` (ví dụ: `EnergyPanel`).
    - CSS Classes: `kebab-case` (ví dụ: `dashboard-container`).

### Tối ưu hóa Hiệu năng (Performance)

1.  **CSS Animations**:
    - LUÔN LUÔN sử dụng `transform` và `opacity` cho các hiệu ứng chuyển động (như hiệu ứng hover).
    - KHÔNG BAO GIỜ animate `top`, `left`, `width`, hoặc `height` vì chúng kích hoạt tính toán lại layout (gây chậm/giật).
2.  **Re-renders**:
    - Đảm bảo `key` props trong các danh sách là duy nhất và ổn định.
    - Sử dụng `React.memo` cho các panel không cập nhật thường xuyên.
3.  **Chi phí Glassmorphism**:
    - `backdrop-filter: blur()` tiêu tốn tài nguyên GPU. Chỉ sử dụng nó trên các panel chính, không dùng tràn lan trên mọi phần tử nhỏ bên trong.

---

## 5. Khả năng Mở rộng Tương lai

- **Quản lý State**: Nếu thêm nhiều dashboard, cân nhắc sử dụng **Zustand** hoặc **Redux Toolkit**.
- **Lấy dữ liệu**: Sử dụng **TanStack Query (React Query)** để cache API và xử lý trạng thái loading/error.
