import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { AiConfigForm, AiConfigVO } from './types';

export const listAiConfig = (): AxiosPromise<AiConfigVO[]> => {
  return request({ url: '/test/aiConfig/list', method: 'get' });
};

export const getAiConfig = (id: string | number): AxiosPromise<AiConfigVO> => {
  return request({ url: '/test/aiConfig/' + id });
};

export const addAiConfig = (data: AiConfigForm) => {
  return request({ url: '/test/aiConfig', method: 'post', data });
};

export const updateAiConfig = (data: AiConfigForm) => {
  return request({ url: '/test/aiConfig', method: 'put', data });
};

export const delAiConfig = (ids: Array<string | number> | string | number) => {
  return request({ url: '/test/aiConfig/' + ids, method: 'delete' });
};

export const fetchModels = (id: string | number): AxiosPromise<string[]> => {
  return request({ url: '/test/aiConfig/fetchModels/' + id, method: 'post' });
};

export const fetchModelsByCredentials = (apiUrl: string, apiKey: string): AxiosPromise<string[]> => {
  return request({ url: '/test/aiConfig/fetchModels', method: 'post', data: { apiUrl, apiKey } });
};

export default { listAiConfig, getAiConfig, addAiConfig, updateAiConfig, delAiConfig, fetchModels, fetchModelsByCredentials };
