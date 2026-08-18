export interface ExecutionQuery extends PageQuery {
  suiteId?: string | number;
  status?: string;
}

export interface ExecutionVO {
  executionId: string | number;
  suiteId: string | number;
  suiteIds: string;
  suiteName: string;
  execType: string;
  browser: string;
  headed: number;
  status: string;
  processId: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  logOutput: string;
  reportPath: string;
  startTime: string;
  endTime: string;
  createTime: string;
}

export interface ExecutionForm {
  suiteId?: string | number;
  suiteIds?: Array<string | number>;
  execType: string;
  browser?: string;
  headed?: number;
}
