import e from 'express'
import { V1Router } from './v1/index.js'; // Importing v1 routes

const router=e.Router()


router.use('/v1', V1Router); // Using v1 routes

export{router as apiRouter}