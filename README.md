# BasicEloCalculateTool

## 1. Giới thiệu dự án
BasicEloCalculateTool là một công cụ mô phỏng hệ thống ELO và Rank Points cho người chơi trong các trận đấu 5v5. Toàn bộ dữ liệu (danh sách người chơi, thông tin trận đấu, lịch sử thay đổi điểm) được lưu dưới dạng file JSON và phục vụ qua giao diện web tĩnh.

## 2. Tính năng chính
- **Sinh danh sách 100 người chơi** với thông tin id, tên, elo, rankPoint, winRate và role.
- **Tạo trận đấu 5v5**:
  - Chọn ngẫu nhiên người chơi với chênh lệch ELO giữa hai đội ≤ 100.
  - Phân vai trò (top, mid, jungle, ad carry, support) và chọn tướng ngẫu nhiên.
  - Sinh kết quả trận (kills, deaths, assists, damage, gold).
  - Tính toán thay đổi ELO và RankPoint theo công thức đã định.
- **Lưu trữ dữ liệu**:
  - `players.json`: cập nhật elo, rankPoint, winRate, matchesPlayed.
  - `matches.json`: lịch sử các trận đã tạo.
  - `player_changes.json`: chi tiết thay đổi điểm của từng người chơi sau mỗi trận.
- **Giao diện web tĩnh**:
  - `players.html`: xem/tìm kiếm/sắp xếp danh sách người chơi.
  - `RandomMatch.html`: tạo 1 hoặc nhiều trận ngẫu nhiên, hoặc liên tục đến khi đủ số trận.
  - `PlayerHistory.html`: xem lịch sử chi tiết của từng người chơi.

## 3. Công nghệ & kiến thức JavaScript áp dụng
- Node.js & File I/O: require/module.exports, đọc-ghi JSON với fs.  
- ES6+: let/const, arrow functions, template literals, destructuring, rest/spread.  
- Bất đồng bộ: async/await, Promise, try/catch.  
- Xử lý mảng: map, filter, reduce, sort.  
- Frontend: fetch API, DOM manipulation, event listeners.  
- Express.js: serve file tĩnh, API GET/POST.

## 4. Cài đặt & sử dụng
1. Clone project:
   ```
   git clone <repo-url>
   cd BasicEloCalculateTool
   ```
2. Cài đặt phụ thuộc:
   ```
   npm install
   ```
3. Khởi động server:
   ```
   node server.js
   ```
4. Truy cập qua trình duyệt:
   - http://localhost:3000/players.html  
   - http://localhost:3000/RandomMatch.html  
   - http://localhost:3000/PlayerHistory.html?playerId=<id>

## 5. Kết luận
Dự án thực hành một các kiến thức JavaScript cơ bản (xử lý mảng, hàm, async/await), Node.js (File I/O, API đơn giản) và thao tác DOM. Đây là nền tảng vững chắc để phát triển các ứng dụng phức tạp hơn.

## 6. Hạn chế
- Chưa áp dụng được `.bind()` để gán cố định context (`this`), nên khi gọi lại các method có thể gây lỗi không xác định.
- Thiếu hiểu biết về cách hoạt động của `this` trong JavaScript (call/apply, arrow functions), dẫn tới khó kiểm soát ngữ cảnh và xử lý lỗi.
- Dễ phát sinh bug khi truyền callback/handler vì `this` không trỏ đúng đối tượng mong muốn.
