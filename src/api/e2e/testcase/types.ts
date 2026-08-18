export interface E2eTestCaseVO extends BaseEntity {
  caseId: string | number;
  caseName: string;
  specFile: string;
  caseGroup: string;
  description: string;
  status: string;
  [key: string]: any;
}

export interface E2eTestCaseForm {
  caseId?: string | number;
  caseName?: string;
  specFile?: string;
  caseGroup?: string;
  description?: string;
  status?: string;
}

export interface E2eTestCaseQuery extends PageQuery {
  caseName?: string;
  caseGroup?: string;
  status?: string;
}
