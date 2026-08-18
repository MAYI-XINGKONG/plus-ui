import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ExecutionForm, ExecutionQuery, ExecutionVO } from './types';

export const listExecution = (query: ExecutionQuery): AxiosPromise<PageResult<ExecutionVO>> => {
  return request({ url: '/test/execution/list', method: 'get', params: query });
};

export const getExecution = (id: string | number): AxiosPromise<ExecutionVO> => {
  return request({ url: '/test/execution/' + id });
};

export const runTest = (data: ExecutionForm): AxiosPromise<number> => {
  return request({ url: '/test/execution/run', method: 'post', data });
};

export const stopTest = (id: string | number) => {
  return request({ url: '/test/execution/stop/' + id, method: 'post' });
};

export default { listExecution, getExecution, runTest, stopTest };
