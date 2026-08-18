import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { E2eTestTaskForm, E2eTestTaskQuery, E2eTestTaskVO } from './types';

/** 查询测试任务列表 */
export function listTask(query: E2eTestTaskQuery): AxiosPromise<PageResult<E2eTestTaskVO>> {
  return request({
    url: '/e2e/task/list',
    method: 'get',
    params: query
  });
}

/** 查询测试任务详细 */
export function getTask(taskId: string | number): AxiosPromise<E2eTestTaskVO> {
  return request({
    url: '/e2e/task/' + taskId,
    method: 'get'
  });
}

/** 新增测试任务 */
export function addTask(data: E2eTestTaskForm) {
  return request({
    url: '/e2e/task',
    method: 'post',
    data
  });
}

/** 停止测试任务 */
export function stopTask(taskId: string | number) {
  return request({
    url: '/e2e/task/stop/' + taskId,
    method: 'post'
  });
}

/** 删除测试任务 */
export function delTask(taskIds: string | number | (string | number)[]) {
  return request({
    url: '/e2e/task/' + taskIds,
    method: 'delete'
  });
}

/** 获取任务日志（轮询） */
export function getTaskLogs(taskId: string | number): AxiosPromise<string[]> {
  return request({
    url: '/e2e/task/logs/' + taskId,
    method: 'get'
  });
}
