import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ScriptContent, SuiteForm, SuiteQuery, SuiteVO } from './types';

export const listSuite = (query: SuiteQuery): AxiosPromise<PageResult<SuiteVO>> => {
  return request({ url: '/test/suite/list', method: 'get', params: query });
};

export const getSuite = (id: string | number): AxiosPromise<SuiteVO> => {
  return request({ url: '/test/suite/' + id });
};

export const addSuite = (data: SuiteForm) => {
  return request({ url: '/test/suite', method: 'post', data });
};

export const updateSuite = (data: SuiteForm) => {
  return request({ url: '/test/suite', method: 'put', data });
};

export const delSuite = (ids: Array<string | number> | string | number) => {
  return request({ url: '/test/suite/' + ids, method: 'delete' });
};

export const getScriptContent = (id: string | number): AxiosPromise<ScriptContent> => {
  return request({ url: '/test/suite/content/' + id });
};

export const saveScriptContent = (id: string | number, content: string) => {
  return request({ url: '/test/suite/content/' + id, method: 'put', data: { content } });
};

export const aiGenerate = (description: string, configId?: number): AxiosPromise<string> => {
  return request({
    url: '/test/suite/aiGenerate',
    method: 'post',
    params: { configId },
    data: description,
    headers: { 'Content-Type': 'text/plain' }
  });
};

export default { listSuite, getSuite, addSuite, updateSuite, delSuite, getScriptContent, saveScriptContent, aiGenerate };
