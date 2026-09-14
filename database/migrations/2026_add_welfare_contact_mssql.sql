-- =========================================================================
-- MIGRATION: ADD PHONE/EMAIL TO WELFARE_APPLICATIONS (persistence fix)
-- Database: TDMU_TradeUnion_DB
-- =========================================================================
USE TDMU_TradeUnion_DB;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'Phone')
ALTER TABLE dbo.WELFARE_APPLICATIONS ADD Phone VARCHAR(20) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'Email')
ALTER TABLE dbo.WELFARE_APPLICATIONS ADD Email VARCHAR(100) NULL;
GO
PRINT 'Welfare application contact columns added.';
GO