/**
 * 分类路由
 * 定义分类相关的API端点
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const validationMiddleware = require('../middleware/validation');
const { ErrorHandler } = require('../middleware/errorHandler');

// 获取所有分类
router.get('/', 
    ErrorHandler.asyncHandler(async (req, res) => {
        await categoryController.getAllCategories(req, res);
    })
);

// 根据ID获取单个分类
router.get('/:id', 
    validationMiddleware.validateCategoryId,
    ErrorHandler.asyncHandler(async (req, res) => {
        await categoryController.getCategoryById(req, res);
    })
);

// 获取分类统计信息
router.get('/stats/summary', 
    ErrorHandler.asyncHandler(async (req, res) => {
        await categoryController.getCategoryStats(req, res);
    })
);

// 获取热门分类
router.get('/popular/top', 
    ErrorHandler.asyncHandler(async (req, res) => {
        await categoryController.getPopularCategories(req, res);
    })
);

module.exports = router;