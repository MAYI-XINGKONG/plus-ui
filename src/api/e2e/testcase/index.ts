import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { E2eTestCaseForm, E2eTestCaseHistoryVo, E2eTestCaseQuery, E2eTestCaseVO } from './types';

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

/** 仅保存用例代码内容 */
export function saveCaseContent(caseId: string | number, content: string) {
  return request({
    url: '/e2e/case/content',
    method: 'put',
    params: { caseId },
    data: content,
    headers: { 'Content-Type': 'text/plain' }
  });
}

/** 删除测试用例 */
export function delTestCase(caseIds: string | number | (string | number)[]) {
  return request({
    url: '/e2e/case/' + caseIds,
    method: 'delete'
  });
}

/** 查询用例历史版本 */
export function getCaseHistory(caseId: string | number): AxiosPromise<E2eTestCaseHistoryVo[]> {
  return request({
    url: '/e2e/case/history/' + caseId,
    method: 'get'
  });
}

/** 回退到指定版本 */
export function revertCase(caseId: string | number, historyId: string | number) {
  return request({
    url: '/e2e/case/revert',
    method: 'post',
    params: { caseId, historyId }
  });
}

/** 同步spec文件 */
export function syncSpecFiles() {
  return request({
    url: '/e2e/case/sync',
    method: 'post'
  });
}
