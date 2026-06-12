import { HttpException } from '@nestjs/common';

export const sendResult = async (
  status: number,
  msg: string,
  data?: any | null,
) => {
  return { statusCode: status, message: msg, data: data ? data : null };
};

export const sendPaginated = async (
  status: number,
  msg: string,
  result?: { data: any; meta?: any } | null,
) => {
  return {
    statusCode: status,
    message: msg,
    data: result?.data ?? null,
    meta: result?.meta ?? null,
  };
};

export const sendError = (status: number, msg: string, error: string) => {
  throw new HttpException(
    { message: msg, error: error, statusCode: status },
    status,
  );
};
