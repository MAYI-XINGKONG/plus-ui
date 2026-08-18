export interface AiConfigVO {
  configId: string | number;
  configName: string;
  apiUrl: string;
  apiKey: string;
  modelName: string;
  modelList: string;
  extraParams: string;
  status: string;
  isDefault: boolean;
  createTime: string;
  remark: string;
}

export interface AiConfigForm {
  configId?: string | number;
  configName: string;
  apiUrl: string;
  apiKey: string;
  modelName?: string;
  modelList?: string;
  extraParams?: string;
  status?: string;
  isDefault?: boolean;
  remark?: string;
}
