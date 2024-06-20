//archivo para manejar las rutas de usuarios

import { Router } from "express";
import {
  authToken,
  createUsers,
  createMateria,
  cursar,
  getMateriasbyDNI,
  logIn,
} from "../controller/users";

//objeto para manejo de url
const routerUsers = Router();

//Enpoint para loguear usuario
/**
 * @swagger
 * /user/login:
 *  post:
 *      sumary: loguear usuario
 */
routerUsers.post("/user/login", logIn);

/**
 * @swagger
 * /usersp:
 *  post:
 *      sumary: crea usuarios
 */
routerUsers.post("/user/usersp", createUsers);

/**
 * @swagger
 * /usersp:
 *  post:
 *      sumary: crea usuarios
 */
routerUsers.post("/user/asociarAlumno", authToken, cursar);
/**
 * @swagger
 * /usersp:
 *  post:
 *      sumary: crea usuarios
 */
routerUsers.post("/user/createMateria", authToken, createMateria);

/**
 * @swagger
 * /getMaterias:
 *  get:
 *      sumary: devuelve las materias de un alumno
 */
routerUsers.get("/user/getMaterias", authToken, getMateriasbyDNI);

export default routerUsers;
