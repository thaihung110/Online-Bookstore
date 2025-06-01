import { Injectable, NestMiddleware } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RecommendProxyMiddleware implements NestMiddleware {
  private proxy = createProxyMiddleware({
    target: 'http://localhost:8080', // Địa chỉ FastAPI recommend system
    changeOrigin: true,
    pathRewrite: {
      '^/api/recommend': '/recommend', // Giữ nguyên path sau /recommend
    },
  });

  use(req: Request, res: Response, next: NextFunction) {
    this.proxy(req, res, next);
  }
}
