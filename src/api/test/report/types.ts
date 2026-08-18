export interface ReportVO {
  reportId: string | number;
  executionId: string | number;
  reportName: string;
  reportType: string;
  filePath: string;
  fileSize: number;
  summary: string;
  createTime: string;
}
