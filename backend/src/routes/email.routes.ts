import { Router } from 'express';
import { emailController } from '../controllers/email.controller.js';

export const emailRouter = Router();

emailRouter.post('/schedule', emailController.schedule);
emailRouter.get('/scheduled', emailController.getScheduled);
emailRouter.get('/sent', emailController.getSent);
emailRouter.get('/:id', emailController.getById);
