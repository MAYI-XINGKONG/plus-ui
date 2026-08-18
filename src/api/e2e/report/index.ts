import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { E2eTestArtifactVO, E2eTestTaskVO } from '../task/types';

/** 查询测试报告列表 */
export function listReport(query: any): AxiosPromise<PageResult<E2eTestTaskVO>> {
  return request({
    url: '/e2e/report/list',
    method: 'get',
    params: query
  });
}

/** 查询测试报告详细 */
export function getReport(taskId: string | number): AxiosPromise<E2eTestTaskVO> {
  return request({
    url: '/e2e/report/' + taskId,
    method: 'get'
  });
}

/** 获取测试产物列表 */
export function getArtifacts(taskId: string | number): AxiosPromise<E2eTestArtifactVO[]> {
  return request({
    url: '/e2e/report/artifacts/' + taskId,
    method: 'get'
  });
}

/** 删除测试报告 */
export function delReport(taskIds: string | number | (string | number)[]) {
  return request({
    url: '/e2e/report/' + taskIds,
    method: 'delete'
  });
}
