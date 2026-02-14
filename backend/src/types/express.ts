import type { NextFunction, Request, Response } from "express";

export interface AuthenticatedUser {
  id: number;
  role: string;
  username?: string;
}

export type ApiRequest<
  Params extends Record<string, string> = Record<string, string>,
  ResBody = unknown,
  ReqBody = Record<string, unknown>,
  ReqQuery extends Record<string, string | string[] | undefined> = Record<
    string,
    string | string[] | undefined
  >,
> = Request<Params, ResBody, ReqBody, ReqQuery>;

export type ApiResponse<ResBody = unknown> = Response<ResBody>;

export type ApiHandler<
  Params extends Record<string, string> = Record<string, string>,
  ResBody = unknown,
  ReqBody = Record<string, unknown>,
  ReqQuery extends Record<string, string | string[] | undefined> = Record<
    string,
    string | string[] | undefined
  >,
> = (
  req: ApiRequest<Params, ResBody, ReqBody, ReqQuery>,
  res: ApiResponse<ResBody>,
  next: NextFunction,
) => Promise<unknown> | unknown;
