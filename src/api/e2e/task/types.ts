export interface E2eTestTaskVO extends BaseEntity {
  taskId: string | number;
  taskName: string;
  browser: string;
  headed: string;
  status: string;
  processId: number | null;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  skippedCases: number;
  startTime: string;
  endTime: string;
  reportPath: string;
  errorMsg: string;
  [key: string]: any;
}

export interface E2eTestTaskForm {
  taskId?: string | number;
  taskName?: string;
  browser?: string;
  headed?: string;
  caseIds?: Array<string | number>;
}

export interface E2eTestTaskQuery extends PageQuery {
  taskName?: string;
  status?: string;
  browser?: string;
}

export interface E2eTestArtifactVO {
  artifactId: string | number;
  taskId: string | number;
  caseName: string;
  artifactType: string;
  filePath: string;
  fileSize: number;
  createTime: string;
}
