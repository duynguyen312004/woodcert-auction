# PHỤ LỤC A. HƯỚNG DẪN VIẾT ĐỒ ÁN TỐT NGHIỆP

## Quy định chung

Dưới đây là một số quy định và hướng dẫn viết đồ án tốt nghiệp mà bắt buộc sinh viên phải đọc kỹ và tuân thủ nghiêm ngặt.

Sinh viên cần đảm bảo tính thống nhất toàn báo cáo (font chữ, căn dòng hai bên, hình ảnh, bảng, margin trang, đánh số trang, v.v.). Để làm được như vậy, sinh viên chỉ cần sử dụng các định dạng theo đúng template ĐATN này. Khi paste nội dung văn bản từ tài liệu khác của mình, sinh viên cần chọn kiểu Copy là **"Text Only"** để định dạng văn bản của template không bị phá vỡ hoặc vi phạm.

Tuyệt đối cấm sinh viên đạo văn. Sinh viên cần ghi rõ nguồn cho tất cả những gì không tự mình viết hoặc vẽ lên, bao gồm các câu trích dẫn, hình ảnh, bảng biểu và các tài liệu khác. Khi bị phát hiện vi phạm, sinh viên sẽ không được phép bảo vệ đồ án tốt nghiệp.

Tất cả các hình vẽ, bảng biểu, công thức và tài liệu tham khảo trong đồ án nhất thiết phải được giải thích và tham chiếu tới ít nhất một lần trong nội dung. Không chấp nhận trường hợp đưa hình ảnh hoặc bảng biểu vào báo cáo mà không có lời mô tả hoặc phân tích.

Sinh viên tuyệt đối không trình bày đồ án theo kiểu viết ý hoặc gạch đầu dòng. Đồ án tốt nghiệp không phải là một bài thuyết trình; người đọc sẽ không có người giải thích thêm. Vì vậy, nội dung cần được viết thành các đoạn văn hoàn chỉnh, có phân tích và diễn giải đầy đủ. Câu văn phải đúng ngữ pháp, đầy đủ chủ ngữ, vị ngữ và các thành phần cần thiết.

Khi cần liệt kê, nên sử dụng cách trình bày khoa học bằng ký tự La Mã. Ví dụ:

Nhiều sinh viên thường cảm thấy hối hận vì:

* (i) Chưa cố gắng hết mình.
* (ii) Chưa sắp xếp thời gian học tập và giải trí hợp lý.
* (iii) Chưa tìm được người yêu để chia sẻ quãng đời sinh viên vất vả.
* (iv) Viết đồ án tốt nghiệp một cách cẩu thả.

Trong trường hợp bắt buộc phải sử dụng bullet, cần thống nhất kiểu trình bày trong toàn bộ báo cáo.

Ví dụ:

* Đây là mục 1 – Thực sự không còn cách nào khác tôi mới dùng đến việc bullet trong báo cáo.
* Đây là mục 2 – Nghĩ lại thì tôi có thể không cần dùng bullet cũng được. Nên tôi sẽ xóa bullet và tổ chức lại hai mục này trong báo cáo của mình cho khoa học hơn. Tôi muốn thầy cô và người đọc cảm nhận được tâm huyết của tôi trong từng trang báo cáo đồ án tốt nghiệp.

---

# A.1 Ngành học

Sinh viên lưu ý ghi đúng ngành hoặc chuyên ngành trên bìa và gáy theo quy định của Trường. Ngành học phụ thuộc vào ngành mà sinh viên đã đăng ký và có thể kiểm tra trên hệ thống quản lý học tập.

### Một số ví dụ

### Đối với kỹ sư chính quy

* K61 trở về trước: Ngành Kỹ thuật phần mềm.
* K62 trở về sau: Ngành Khoa học máy tính.

### Đối với cử nhân

* Ngành Công nghệ thông tin.

### Đối với chương trình EliteTech

* Việt Nhật/KSTN: Ngành Công nghệ thông tin.
* ICT Global: Ngành Information Technology.
* DS&AI: Ngành Khoa học dữ liệu.

---

# A.2 Đánh dấu (bullet) và đánh số (numbering)

LaTeX hỗ trợ hai môi trường liệt kê cơ bản và không yêu cầu cài đặt thêm gói mở rộng.

## Bullet (không có thứ tự)

```latex
\begin{itemize}
\item Nội dung thứ nhất được viết ở đây.
\item Nội dung thứ hai được viết ở đây.
\item ...
\end{itemize}
```

## Numbering (có thứ tự)

```latex
\begin{enumerate}
\item Nội dung thứ nhất được viết ở đây.
\item Nội dung thứ hai được viết ở đây.
\item ...
\end{enumerate}
```

Nội dung của mỗi mục được khai báo sau lệnh `\item`.

Tham khảo thêm:

https://www.overleaf.com/learn/latex/Lists

---

# A.3 Cách thêm bảng

Ví dụ về bảng:

| Col1 | Col2 |  Col2 | Col3 |
| ---: | ---: | ----: | ---: |
|    1 |    6 | 87837 |  787 |
|    2 |    7 |    78 | 5415 |
|    3 |  545 |   778 | 7507 |
|    4 |  545 | 18744 | 7560 |
|    5 |   88 |   788 | 6344 |

**Bảng A.1: Table to test captions and labels.**

Bảng A.1 là ví dụ về cách tạo bảng. Tất cả các bảng biểu phải được đề cập trong nội dung và cần được phân tích, bình luận.

Do việc tạo bảng trong LaTeX tương đối phức tạp và mất thời gian, sinh viên có thể sử dụng các công cụ hỗ trợ như:

https://www.tablesgenerator.com/

Tham khảo thêm:

https://www.overleaf.com/learn/latex/Tables

---

# A.4 Chèn hình ảnh

**Hình A.1: Internet vạn vật**

Đây là ví dụ về cách chèn hình ảnh trong LaTeX. Lưu ý rằng chú thích của hình được đặt ngay bên dưới hình.

Tham khảo:

https://www.overleaf.com/learn/latex/Inserting_Images

Tất cả các hình vẽ trong báo cáo đều phải được đề cập tới trong phần nội dung và cần có phần phân tích hoặc bình luận.

---

# A.5 Tài liệu tham khảo

## Cách liệt kê

Đồ án áp dụng cách trích dẫn theo chuẩn IEEE.

Ví dụ:

* Scott et al. (2013).
* Ashton (2009).

Trong LaTeX, sử dụng:

```latex
\cite{key}
```

Chỉ những tài liệu được trích dẫn mới xuất hiện trong danh mục tài liệu tham khảo.

Nguồn tài liệu cần có nguồn gốc rõ ràng và đáng tin cậy. Hạn chế sử dụng các website hoặc Wikipedia làm tài liệu tham khảo.

## Các loại tài liệu tham khảo

Các nguồn tài liệu chính bao gồm:

* Sách.
* Bài báo tạp chí.
* Bài báo hội nghị khoa học.
* Các tài liệu tham khảo đáng tin cậy trên Internet.

---

# A.6 Cách viết phương trình và công thức toán học

Các gói `amsmath`, `amssymb` và `amsfonts` đã được tích hợp sẵn trong template.

Ví dụ về phương trình:

[
F(x)=\int_b^a \frac{1}{3}x^3
]

**Phương trình A.1** là ví dụ về phương trình tích phân.

Ví dụ về phương trình không đánh số:

[
x[t_n]=\frac{1}{\sqrt{N}}\sum_{k=0}^{N-1}X[f_k]e^{j2\pi nk/N}
]

Phương trình trên biểu diễn phép biến đổi Fourier rời rạc ngược (IDFT).

---

# A.7 Quy cách đóng quyển

Bìa trước được chế bản theo quy định; bìa trước và bìa sau sử dụng giấy liền khổ. Khi đóng quyển, cần sử dụng keo nhiệt để dán gáy thay vì dùng băng dính hoặc ghim.

Phần gáy đồ án cần ghi các thông tin:

* Kỳ làm đồ án.
* Ngành đào tạo.
* Họ và tên sinh viên.
* Mã số sinh viên.

Ví dụ:

> 2022.1 - KỸ THUẬT MÁY TÍNH - NGUYỄN VĂN A - 20221234

Quy cách trình bày phần gáy thực hiện theo mẫu quy định của Nhà trường.
