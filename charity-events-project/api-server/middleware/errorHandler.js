/**
 * 错误处理中间件
 * 统一处理API错误响应和日志记录
 */

class ErrorHandler {
    /**
     * 处理未捕获的异常
     */
    static handleUncaughtException(error) {
        console.error('💥 Uncaught Exception:', error);
        
        // 在实际应用中，这里应该发送错误报告
        // process.exit(1); // 根据错误严重程度决定是否退出
    }

    /**
     * 处理未处理的Promise拒绝
     */
    static handleUnhandledRejection(reason, promise) {
        console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
        
        // 在实际应用中，这里应该发送错误报告
    }

    /**
     * 全局错误处理中间件
     */
    static globalErrorHandler(err, req, res, next) {
        console.error('🚨 Global Error Handler:', {
            message: err.message,
            stack: err.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });

        // 默认错误响应
        let statusCode = err.statusCode || 500;
        let message = err.message || 'Internal Server Error';
        let errorCode = err.errorCode || 'INTERNAL_ERROR';

        // 处理不同类型的错误
        if (err.name === 'ValidationError') {
            statusCode = 400;
            errorCode = 'VALIDATION_ERROR';
        } else if (err.name === 'UnauthorizedError') {
            statusCode = 401;
            errorCode = 'UNAUTHORIZED';
        } else if (err.name === 'ForbiddenError') {
            statusCode = 403;
            errorCode = 'FORBIDDEN';
        } else if (err.name === 'NotFoundError') {
            statusCode = 404;
            errorCode = 'NOT_FOUND';
        } else if (err.code === 'ER_DUP_ENTRY') {
            statusCode = 409;
            errorCode = 'DUPLICATE_ENTRY';
            message = 'Resource already exists';
        } else if (err.code === 'ER_NO_REFERENCED_ROW') {
            statusCode = 400;
            errorCode = 'INVALID_REFERENCE';
            message = 'Referenced resource does not exist';
        }

        // 生产环境隐藏敏感错误信息
        if (process.env.NODE_ENV === 'production' && statusCode === 500) {
            message = 'Internal Server Error';
        }

        // 发送错误响应
        res.status(statusCode).json({
            success: false,
            error: {
                code: errorCode,
                message: message,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
                timestamp: new Date().toISOString(),
                path: req.path
            }
        });
    }

    /**
     * 404错误处理中间件
     */
    static handleNotFound(req, res, next) {
        const error = new Error(`Not Found - ${req.method} ${req.originalUrl}`);
        error.statusCode = 404;
        error.errorCode = 'ENDPOINT_NOT_FOUND';
        next(error);
    }

    /**
     * 创建自定义错误类
     */
    static createCustomError(name, defaultStatusCode, defaultErrorCode) {
        return class CustomError extends Error {
            constructor(message, statusCode = defaultStatusCode, errorCode = defaultErrorCode) {
                super(message);
                this.name = name;
                this.statusCode = statusCode;
                this.errorCode = errorCode;
            }
        };
    }

    /**
     * 异步错误包装器
     */
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}

// 创建自定义错误类型
const ValidationError = ErrorHandler.createCustomError('ValidationError', 400, 'VALIDATION_ERROR');
const NotFoundError = ErrorHandler.createCustomError('NotFoundError', 404, 'NOT_FOUND');
const UnauthorizedError = ErrorHandler.createCustomError('UnauthorizedError', 401, 'UNAUTHORIZED');
const ForbiddenError = ErrorHandler.createCustomError('ForbiddenError', 403, 'FORBIDDEN');

// 设置全局错误处理
process.on('uncaughtException', ErrorHandler.handleUncaughtException);
process.on('unhandledRejection', ErrorHandler.handleUnhandledRejection);

module.exports = {
    ErrorHandler,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError
};