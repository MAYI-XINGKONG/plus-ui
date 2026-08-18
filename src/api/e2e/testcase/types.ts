export interface E2eTestCaseVO extends BaseEntity {
  caseId: string | number;
  caseName: string;
  specFile: string;
  caseGroup: string;
  description: string;
  content: string;
  status: string;
  [key: string]: any;
}

export interface E2eTestCaseForm {
  caseId?: string | number;
  caseName?: string;
  specFile?: string;
  caseGroup?: string;
  description?: string;
  content?: string;
  status?: string;
}

export interface E2eTestCaseQuery extends PageQuery {
  caseName?: string;
  caseGroup?: string;
  status?: string;
}

export interface E2eTestCaseHistoryVo {
  historyId: string | number;
  caseId: string | number;
  content: string;
  version: number;
  createBy: string | number;
  createTime: string;
}
