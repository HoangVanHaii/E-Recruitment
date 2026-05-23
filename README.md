# 🚀 Website Tuyển Dụng Trực Tuyến (Job Portal)

Dự án **Website Tuyển Dụng Trực Tuyến (Job Portal)** được phát triển dưới dạng Tiểu luận Thực hành Nghề nghiệp bởi Sinh viên Khoa Công nghệ Thông tin – Trường Đại học Sư phạm Thành phố Hồ Chí Minh. Hệ thống đóng vai trò làm cầu nối trực tuyến toàn diện giữa Ứng viên, Nhà tuyển dụng và Quản trị viên, hỗ trợ đắc lực cho việc tối ưu hóa quy trình kết nối nhân sự thời đại số.

---

## 🌟 Điểm Sáng Công Nghệ & Tính Năng Nổi Bật

* **Tích hợp Trí tuệ nhân tạo (AI Matching):** Hệ thống ứng dụng thuật toán thông minh tự động phân tích từ khóa, kỹ năng trên hồ sơ (CV) để đối chiếu trực tiếp với yêu cầu của mô tả công việc (JD), đề xuất việc làm chuẩn xác.
* **Hỗ trợ AI Client-side:** Sử dụng WebGPU và thư viện `@mle-ai/web-llm` để xử lý mô hình ngôn ngữ lớn ngay trên trình duyệt, giúp tóm tắt mục tiêu hồ sơ nhanh chóng.
* **Trò chuyện thời gian thực (Chat Realtime):** Tích hợp phân hệ chat trực tiếp qua WebSocket (Socket.io) giúp ứng viên và nhà tuyển dụng giữ liên lạc, phỏng vấn nhanh.
* **Kiến trúc Dữ liệu lai (Hybrid Database):** Sự kết hợp chặt chẽ giữa SQL Server/MySQL (dữ liệu có cấu trúc), MongoDB (dữ liệu phi cấu trúc), Redis (bộ nhớ đệm) và Pinecone (Vector Database cho AI Search).

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### 1. Frontend (Client-side)
* **Core Framework:** Vue.js v3.5.32 (Kiến trúc Component-Based)
* **Build Tool:** Vite v6.0.5
* **State Management:** Pinia v3.0.4
* **Routing:** Vue Router v5.0.4
* **Styling:** Tailwind CSS (Hỗ trợ Responsive đa thiết bị)
* **Thư viện bổ trợ:** Axios v1.14.0, socket.io-client v4.8.3, ApexCharts v5.11.0, vue3-apexcharts v1.11.1, lucide-vue-next v1.0.0, `@vuepic/vue-datepicker` v12.1.0.

### 2. Backend (Server-side)
* **Môi trường chạy:** Node.js & Express.js v5.2.1 (Ngôn ngữ TypeScript v5.9.3)
* **Xác thực & Bảo mật:** `jsonwebtoken` v9.0.3 (Cơ chế JWT), `bcrypt` v6.0.0 (Băm mật khẩu), `helmet` v8.1.0, `cors` v2.8.6.
* **Hỗ trợ dịch vụ & Lưu trữ:** `multer` v2.1.1, Cloudinary SDK v2.9.0 (Quản lý đa phương tiện), `express-validator` v7.3.1.
* **AI & Vector Database:** `@google/genai` v1.46.0, `@google/generative-ai` v0.24.1 (Gemini SDK), `@pinecone-database/pinecone` v7.1.0.
* **Công cụ khác:** `nodemailer` v8.0.2 (Gửi mail OTP), `redis` v5.11.0, `morgan` v1.10.1, `nodemon` v3.1.14.

---

## 🗄️ Thiết Kế Cơ Sở Dữ Liệu & Lưu Trữ (Database & Storage)

Để đáp ứng các bài toán phức tạp về hiệu năng, tìm kiếm thông minh bằng AI và xử lý dữ liệu lớn, hệ thống áp dụng giải pháp kiến trúc **Cơ sở dữ liệu lai (Hybrid Database)** phân tách nhiệm vụ rõ rệt:

### 1. MySQL (Relational Database)
* **Vai trò:** Cơ sở dữ liệu quan hệ chính, đảm bảo tính toàn vẹn dữ liệu (ACID) cho các luồng nghiệp vụ cốt lõi.
* **Dữ liệu lưu trữ:** * Thông tin tài khoản người dùng (`Users`, `Accounts`), phân quyền (`Roles`).
  * Thông tin tuyển dụng công khai (`Jobs`), danh mục ngành nghề (`Categories`).
  * Dữ liệu hồ sơ doanh nghiệp (`Companies`) và lịch sử, trạng thái đơn ứng tuyển (`Applications`).

### 2. Redis Cache (In-Memory Database)
* **Vai trò:** Bộ nhớ đệm lưu trữ trên RAM với tốc độ đọc/ghi cực cao, giúp giảm tải trực tiếp cho cơ sở dữ liệu chính và tối ưu tốc độ phản hồi phản hồi hệ thống.
* **Dữ liệu lưu trữ:**
  * Mã xác thực OTP tạm thời phục vụ cho quá trình đăng ký hoặc thiết lập lại mật khẩu qua Email.
  * Lưu bộ nhớ đệm (Caching) danh sách việc làm HOT, bài đăng tuyển dụng phổ biến có tần suất truy cập cao.
  * Quản lý danh sách đen các token đã hết hạn (JWT Blacklist) để tăng cường bảo mật đăng xuất.

### 3. MongoDB (NoSQL Document-Oriented Database)
* **Vai trò:** Cơ sở dữ liệu phi cấu trúc dạng Document (JSON/BSON style), cho phép mở rộng linh hoạt theo chiều ngang và lưu trữ dữ liệu động.
* **Dữ liệu lưu trữ:**
  * Cấu trúc chi tiết của hồ sơ ứng viên trực tuyến (CVs/Resumes) với các trường thông tin học vấn, dự án và kinh nghiệm thay đổi linh hoạt tùy theo từng cá nhân.
  * Lưu trữ lịch sử tin nhắn và hội thoại thời gian thực (Chat logs) giữa Nhà tuyển dụng và Ứng viên.
  * Hệ thống log giám sát hành vi người dùng và nhật ký hoạt động hệ thống.

### 4. Cloudinary (Cloud Media Storage)
* **Vai trò:** Nền tảng đám mây chuyên dụng quản lý, lưu trữ và tối ưu hóa tài nguyên đa phương tiện tĩnh thông qua CDN tốc độ cao.
* **Dữ liệu lưu trữ:**
  * Hình ảnh tải lên hệ thống bao gồm: Avatar cá nhân, Logo công ty, hình ảnh văn phòng làm việc và ảnh chụp Giấy phép kinh doanh phục vụ kiểm duyệt.
  * Lưu trữ các tệp đính kèm hồ sơ CV gốc định dạng `.pdf` hoặc `.docx` do ứng viên tải lên trực tiếp.

### 5. Pinecone (Vector Database)
* **Vai trò:** Cơ sở dữ liệu Vector hiệu năng cao phục vụ cho các bài toán xử lý chuyên sâu về Trí tuệ nhân tạo (AI Search & Matching).
* **Dữ liệu lưu trữ:**
  * Lưu trữ các chuỗi vector cao chiều (Vector Embeddings) được trích xuất từ nội dung kỹ năng của CV ứng viên và nội dung yêu cầu của tin tuyển dụng (JD) thông qua Gemini Embedding API.
  * Hỗ trợ tìm kiếm theo ngữ nghĩa (Semantic Search) và tính toán khoảng cách vector (Cosine Similarity) để thực hiện tính năng tự động gợi ý việc làm phù hợp (AI Matching) với độ chính xác cao.

---
## 🗂️ Phân Hệ Tính Năng Theo Tác Nhân

### 1. Ứng viên (Candidate)
* Đăng ký tài khoản, xác thực thông qua mã OTP gửi về Email.
* Tạo lập, chỉnh sửa hồ sơ thông tin cá nhân trực tuyến hoặc tải lên file CV cá nhân (`.pdf`/`.docx`).
* Tìm kiếm việc làm thông minh dựa trên bộ lọc vị trí, ngành nghề, địa điểm và mức lương mong muốn.
* Lưu các tin tuyển dụng yêu thích và nộp đơn ứng tuyển trực tuyến trực tiếp bằng CV sẵn có.
* Theo dõi sát sao trạng thái hồ sơ xét duyệt (Chờ duyệt, Đã xem, Hẹn phỏng vấn, Từ chối).
* Chat Realtime trực tiếp thảo luận công việc với Nhà tuyển dụng.

### 2. Nhà tuyển dụng (Employer)
* Cập nhật thông tin doanh nghiệp, tải lên logo và hồ sơ minh chứng giấy phép kinh doanh.
* Đăng tin tuyển dụng mới (hệ thống tự động chuyển trạng thái chờ Admin duyệt), chỉnh sửa, đóng hoặc xóa bài đăng.
* Quản lý danh sách ứng viên ứng tuyển theo từng chiến dịch, xem chi tiết thông tin và cập nhật trạng thái phễu ứng viên.
* Chủ doanh nghiệp/Owner có thể phê duyệt hoặc từ chối các yêu cầu gia nhập của các HR cấp dưới.
* Dashboard thống kê số lượng hồ sơ ứng tuyển biến động theo biểu đồ đường trực quan.

### 3. Quản trị viên (Admin)
* Dashboard thống kê toàn diện: giám sát lượng người dùng, tổng số tin đăng bài, số CV giao dịch thành công.
* Kiểm duyệt chặt chẽ thông tin đăng ký doanh nghiệp và nội dung bài đăng tuyển dụng để tránh tin giả.
* Quản lý người dùng: Tra cứu danh sách, phân bổ quyền hạn hoặc thực hiện khóa/mở khóa các tài khoản vi phạm chính sách.

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture)

Hệ thống tuân thủ **Mô hình Khách - Chủ (Client-Server)** và được phân bổ theo mô hình kiến trúc 3 tầng logic riêng biệt nhằm đảm bảo tách biệt trách nhiệm tối đa (**Separation of Concerns**):

1.  **Presentation Tier (Frontend):** Vue 3 SPA đóng gói bằng Vite, kết hợp Pinia quản lý trạng thái tập trung.
2.  **Application Tier (Backend):** Sử dụng cấu trúc phân tầng phổ biến `Controller - Service - Data Access Layer` độc lập hoàn toàn với lớp định tuyến HTTP nhằm gia tăng tính tái sử dụng mã nguồn.
3.  **Data Tier (Database):** Phối hợp đồng bộ lưu trữ giữa SQL Server/MySQL cho thực thể quan hệ chặt chẽ và MongoDB cho các cấu trúc JSON động dạng tài liệu phức tạp.

---

## 📦 Hướng Dẫn Cài Đặt & Triển Khai

### 1. Yêu cầu hệ thống phần cứng & phần mềm
* **Hệ điều hành:** Windows 7 trở lên hoặc Linux/macOS có tương thích.
* **RAM:** Tối thiểu 2 GB (Khuyến nghị trống trên 5GB để chạy SQL Server và Redis Server).
* **Môi trường chạy:** Node.js phiên bản $\ge$ 18, npm, SQL Server, Redis Server và Git.

### 2. Các bước thiết lập chi tiết

**Bước 1: Tải mã nguồn từ GitHub**
```bash
git clone [https://github.com/HoangVanHaii/JobPortal.git](https://github.com/HoangVanHaii/JobPortal.git)
cd JobPortal
