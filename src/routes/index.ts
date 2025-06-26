import express from 'express';
const router = express.Router();

import TaskController from '../controllers/TaskController';
import AuthController from '../controllers/AuthController';
import authMiddleware from '../middlewares/auth';

router.post('/tasks', authMiddleware, TaskController.createTask);
router.get('/tasks/user', authMiddleware, TaskController.getTaskByUserId);
router.put('/tasks/:id', authMiddleware, TaskController.updateTask);
router.delete('/tasks/:id', authMiddleware, TaskController.deleteTask);

router.post('/auth/google', AuthController.loginWithGoogle);
router.post('/auth/magic-link', AuthController.sendMagicLink);
router.get('/auth/verify', AuthController.verifyMagicLink);
router.post('/auth/verify-token', AuthController.verifyToken);

export default router;