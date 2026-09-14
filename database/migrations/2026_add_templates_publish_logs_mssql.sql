-- =========================================================================
-- MIGRATION: ADD TEMPLATES + PUBLISH_LOGS TABLES (dong bo tu remote)
-- Database: TDMU_TradeUnion_DB
-- =========================================================================
USE TDMU_TradeUnion_DB;
GO

-- 16. TEMPLATES (Kho biểu mẫu nghiệp vụ & văn bản mẫu)
IF OBJECT_ID('dbo.TEMPLATES', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TEMPLATES (
        TemplateId INT IDENTITY(1,1) PRIMARY KEY,
        Code VARCHAR(50) NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Category VARCHAR(50) NOT NULL DEFAULT 'doan_vien',
        CategoryName NVARCHAR(100) NULL,
        Description NVARCHAR(MAX) NULL,
        FileType VARCHAR(20) DEFAULT 'docx',
        FileSize VARCHAR(50) DEFAULT '4.0 KB',
        FilePath VARCHAR(500) NOT NULL,
        DownloadCount INT DEFAULT 0,
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
END
GO

-- 17. PUBLISH_LOGS (Nhật ký phát hành đa kênh)
IF OBJECT_ID('dbo.PUBLISH_LOGS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PUBLISH_LOGS (
        LogId INT IDENTITY(1,1) PRIMARY KEY,
        ScheduleId INT NULL,
        ArticleId INT NOT NULL,
        Channel VARCHAR(50) NOT NULL,
        Action VARCHAR(50) NOT NULL,
        Result NVARCHAR(MAX) NULL,
        PublishedAt DATETIME2 DEFAULT SYSDATETIME(),
        CONSTRAINT FK_PUBLISH_LOGS_ARTICLES FOREIGN KEY (ArticleId) REFERENCES dbo.ARTICLES(ArticleId) ON DELETE CASCADE
    );
END
GO

-- Seed TEMPLATES mặc định (5 biểu mẫu nghiệp vụ)
IF NOT EXISTS (SELECT 1 FROM dbo.TEMPLATES)
BEGIN
    INSERT INTO dbo.TEMPLATES (Code, Title, Category, CategoryName, Description, FileType, FileSize, FilePath, DownloadCount) VALUES
    ('BM-01/CĐ', N'Phiếu Lý Lịch & Đơn Xin Gia Nhập Công Đoàn TDMU', 'doan_vien', N'Đoàn Viên & Gia Nhập', N'Dành cho Cán bộ, Giảng viên mới tuyển dụng gia nhập tổ chức công đoàn', 'docx', '4.1 KB', 'uploads/templates/BM_01_Don_Gia_Nhap_Cong_Doan.docx', 146),
    ('BM-02/CĐ', N'Mẫu Báo Cáo Hoạt Động Tháng & Chấm Điểm Thi Đua 16 Tổ', 'to_cong_doan', N'Tổ Công Đoàn Bộ Phận', N'Mẫu báo cáo định kỳ hàng tháng của Tổ trưởng gửi BTV Công đoàn trường', 'docx', '4.3 KB', 'uploads/templates/BM_02_Bao_Cao_Thang_16_To.docx', 285),
    ('BM-03/CĐ', N'Đơn Đề Nghị Trợ Cấp Khó Khăn & Thăm Hỏi Ốm Đau', 'tro_cap', N'Chăm Lo & Trợ Cấp', N'Mẫu đơn đề nghị xét duyệt kinh phí chăm lo đột xuất cho đoàn viên', 'docx', '3.9 KB', 'uploads/templates/BM_03_De_Nghi_Tro_Cap_Kho_Khan.docx', 312),
    ('BM-04/CĐ', N'Tờ Trình Khen Thưởng Đoàn Viên Tiêu Biểu & Phong Trào', 'thi_dua', N'Thi Đua Khen Thưởng', N'Mẫu đề xuất khen thưởng chuyên đề và thi đua hàng năm', 'docx', '4.0 KB', 'uploads/templates/BM_04_To_Trinh_Khen_Thuong.docx', 94),
    ('BM-05/CĐ', N'Giấy Đề Nghị Hỗ Trợ Vay Vốn Quỹ Trợ Vốn CEP Đoàn Viên', 'tro_von', N'Quỹ Trợ Vốn', N'Hỗ trợ đoàn viên, người lao động tiếp cận nguồn vốn ưu đãi không lãi suất', 'docx', '4.5 KB', 'uploads/templates/BM_05_Vay_Von_Tro_Cap.docx', 78);
END
GO

PRINT 'TEMPLATES + PUBLISH_LOGS created.';
GO