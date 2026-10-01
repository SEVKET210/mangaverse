import express from 'express';
import { MangaController } from '../controllers/manga.controller.js';

const router = express.Router();

router.get('/', MangaController.getList);
// NOTE: /recommended must be BEFORE /:slug to avoid slug wildcard capturing it
router.get('/recommended', MangaController.getRecommended);
router.get('/random', MangaController.getRandom);
router.get('/:slug', MangaController.getSingle);

export default router;
