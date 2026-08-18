import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ReportVO } from './types';

export const listReport = (query: PageQuery): AxiosPromise<PageResult<ReportVO>> => {
  return request({ url: '/test/report/list', method: 'get', params: query });
};

export const getReport = (id: string | number): AxiosPromise<ReportVO> => {
  return request({ url: '/test/report/' + id });
};

export const delReport = (ids: Array<string | number> | string | number) => {
  return request({ url: '/test/report/' + ids, method: 'delete' });
};

export const getReportDownloadUrl = (id: string | number): string => {
  return `/test/report/download/${id}`;
};

export const getReportHtmlUrl = (executionId: string | number): string => {
  return `/test/report/html/${executionId}`;
};

export const getTraceUrl = (executionId: string | number): string => {
  return `/test/report/trace/${executionId}`;
};

export const getScreenshotUrl = (executionId: string | number, filename: string): string => {
  return `/test/report/screenshot/${executionId}/${filename}`;
};

export const getVideoUrl = (executionId: string | number, filename: string): string => {
  return `/test/report/video/${executionId}/${filename}`;
};

export default { listReport, getReport, delReport, getReportDownloadUrl, getReportHtmlUrl, getTraceUrl };
