export interface SuiteQuery extends PageQuery {
  suiteName?: string;
  suiteType?: string;
  method?: string;
  status?: string;
  tags?: string;
}

export interface SuiteVO extends BaseEntity {
  suiteId: string | number;
  suiteName: string;
  suiteType: string;
  method: string;
  url: string;
  headers: string;
  body: string;
  expectCode: number;
  expectBody: string;
  scriptPath: string;
  scriptContent: string;
  tags: string;
  status: string;
  orderNum: number;
}

export interface SuiteForm {
  suiteId?: string | number;
  suiteName: string;
  suiteType: string;
  method?: string;
  url?: string;
  headers?: string;
  body?: string;
  expectCode?: number;
  expectBody?: string;
  scriptPath?: string;
  scriptContent?: string;
  tags?: string;
  status?: string;
  orderNum?: number;
  remark?: string;
}

export interface ScriptContent {
  content: string;
  path: string;
}
