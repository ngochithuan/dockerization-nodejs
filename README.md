# dockerization-nodejs
Project cho giữa kì môn Phát triển ứng dụng với NodeJS

# Report content
## Introduction to Docker
Docker là gì? - Tại sao Docker lại quan trọng trong việc phát triển web hiện đại
Giới thiệu về key concepts như:
- containers
- images
- dockerfile
- docker compose
- container orchestration

## Theoretical Survey
Giải thích kiến ​​trúc của Docker và công nghệ nền tảng của nó (ví dụ: namespaces, cgroups, union file systems).

Thảo luận: Docker đơn giản hóa việc phát triển và triển khai các ứng dụng NodeJS như thế nào?

Trình bày những lợi ích và thách thức của việc sử dụng container trong phát triển web (như scalability, isolation và deployment, automation).

## Project Overview
Giới thiệu cụ thể project của nhóm chọn để demonstrate
Giải thích ngữ cảnh của project và tại sao Docker được dùng trong bối cảnh này
Hãy mô tả các dịch vụ liên quan (e.g., front-end, back-end, database) và cách chúng tương tác với nhau.

## Architecture and Implementation
Giải thích chi tiết architecture được thiết kể bởi nhóm, tập trung vào Docker và Docker Compose được dùng như thế nào
Mô tả rõ ràng cho những services đã được deploy và các chúng tương tác với nhau. show Docker Compose file (nếu có dùng) và Dockerfiles
Đối với nhóm nâng cao, mô tả cách nhóm implement scaling, load balancing, service decoupling
Nếu các orchestration tools (công cụ điều phối) (eg., Docker Swarm hoặc Kubernetes) được sử dụng, hãy giải thích vai trò của chúng trong dự án và cách chúng cải thiện quá trình deploy.

## Results and Discussion
Trình bày kết quả của dự án Docker hóa của bạn.
Thảo luận về performance, scalability, reliability của solution của nhóm
Highlight các thử thách mà nhóm đã gặp và cách nhóm đã vượt quanhóm

## Conclusion
Tổng kết đã học được gì thông qua project này

## Avoid these
Trang bìa được trình bày khá cẩu thả, có nhiều lỗi nghiêm trọng như: sử dụng logo không đạt chuẩn, thông tin giảng viên không chính xác, thông tin thành viên nhóm không đúng, tên đề tài không chính xác.

Thiếu các trang phụ lục cần thiết theo yêu cầu. Báo cáo không có đủ các chương hoặc nội dung theo quy định, chẳng hạn như: khảo sát lý thuyết, phân tích yêu cầu, thiết kế hệ thống, trình bày kết quả kèm theo các phân tích/so sánh cần thiết, chương kết luận của báo cáo.

Có lỗi chính tả; kiểu chữ, màu chữ và cỡ chữ không nhất quán; không sử dụng lề và giãn dòng phù hợp; lạm dụng các gạch đầu dòng trong phần trình bày.

Báo cáo có nhiều nội dung chỉ ở dạng danh sách nhiệm vụ, sơ đồ, bảng biểu và biểu đồ để minh họa, làm cho nội dung khó hiểu đối với người đọc. Điều này cũng thể hiện khả năng giải thích và sử dụng ngôn ngữ viết chưa tốt.

Thiếu sự đầu tư trong việc trình bày hình ảnh, bảng biểu và sơ đồ; ví dụ: hình ảnh quá lớn hoặc quá nhỏ, màu chữ/màu nền gây khó đọc, ảnh chụp màn hình có nội dung thừa, dẫn đến báo cáo được trình bày kém.

Đề cập quá nhiều đến mã nguồn nhưng lại thiếu phần mô tả hoặc giải thích về hệ thống, nguyên lý hoạt động của các thành phần, cách nhóm triển khai và cài đặt hệ thống. Điều này khiến người đọc khó hiểu nhóm đang thực hiện điều gì, cách thu được kết quả hoặc những kiến thức/bài học có thể rút ra từ đề tài này.

# Submitions
## Report
Tiếng Anh
Word hoặc PDF
## Source Code  và Dependencies
- Source code
- Dockerfile
- Dockercompose file
- Other configuration files
- Các depedencies (eg., package.json, ...)
## Video Presentation
Tiếng Anh
Tất cả thành viên trong nhóm đều tham gia
## ReadMe.txt
Hướng dẫn chạy project locally
Chi tiết cách
- Build Images
- Chạy container
- Test application
