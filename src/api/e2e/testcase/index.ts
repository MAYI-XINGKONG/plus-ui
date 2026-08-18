import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { E2eTestCaseForm, E2eTestCaseQuery, E2eTestCaseVO } from './types';

/** 查询测试用例列表 */
export function listTestCase(query: E2eTestCaseQuery): AxiosPromise<PageResult<E2eTestCaseVO>> {
  return request({
    url: '/e2e/case/list',
    method: 'get',
    params: query
  });
}

/** 查询测试用例详细 */
export function getTestCase(caseId: string | number): AxiosPromise<E2eTestCaseVO> {
  return request({
    url: '/e2e/case/' + caseId,
    method: 'get'
  });
}

/** 读取spec文件内容 */
export function getSpecContent(specFile: string): AxiosPromise<string> {
  return request({
    url: '/e2e/case/content',
    method: 'get',
    params: { specFile }
  });
}

/** 新增测试用例 */
export function addTestCase(data: E2eTestCaseForm) {
  return request({
    url: '/e2e/case',
    method: 'post',
    data
  });
}

/** 修改测试用例 */
export function updateTestCase(data: E2eTestCaseForm) {
  return request({
    url: '/e2e/case',
    method: 'put',
    data
  });
}

/** 删除测试用例 */
export function delTestCase(caseIds: string | number | (string | number)[]) {
  return request({
    url: '/e2e/case/' + caseIds,
    method: 'delete'
  });
}

/** 保存spec文件内容 */
export function saveSpecContent(data: { specFile: string; content: string }) {
  return request({
    url: '/e2e/case/content',
    method: 'put',
    data
  });
}

/** 同步spec文件 */
export function syncSpecFiles() {
  return request({
    url: '/e2e/case/sync',
    method: 'post'
  });
}
