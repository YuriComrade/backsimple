import { token } from "morgan";
import { connect } from "../databases";
import jwt from "jsonwebtoken";

const claveSecreta = process.env.SECRET_KEY;

export const logIn = async (req, res) => {
  try {
    //desestructurar y obtener datos de la request
    const { dni, passwor } = req.body;

    //consigo el OBJ de coneccion
    const conn = await connect();

    //guardo el query
    const q = `SELECT passwor FROM alumno WHERE dni=?`;
    const value = [dni];
    //consulta a BD
    const [result] = await conn.query(q, value);

    if (result.length > 0) {
      //existe el usuario
      //comparar contraseñas
      if (result[0].passwor == passwor) {
        //contraseñas iguales
        //crear token
        const token = getToken({ dni: dni });
        //enviar al front
        return res
          .status(200)
          .json({ message: "correcto contraseña", succes: true, token: token });
      } else {
        return res
          .status(400)
          .json({ message: "la constraseña no coincide", succes: false });
      }
    } else {
      //no existe el usuario
      return res
        .status(400)
        .json({ message: "el usuario no existe", succes: false });
    }
    //envio respuesta
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "fallo el catch", error: error });
  }
};

const valida = async (campo, valor, tabla, coct) => {
  //guarda el query
  const q = `SELECT * FROM ${tabla} WHERE ${campo}=?`;
  const value = [valor];

  const [result] = await coct.query(q, value);

  return result.length > 0; //nos dice si nos manda F o V si trae datos el OBJ
};

//crear usuarios desde el sigup
export const createUsers = async (req, res) => {
  try {
    //conectar BD instanciando obj "conexion"
    const connct = await connect();
    //obtener pck de front
    const { dni, nombre, passwor } = req.body;

    const userExist = await valida("dni", dni, "alumno", connct);

    console.log("userExist", userExist);

    //validar dni
    if (userExist) {
      return res.status(400).json({ message: "el usuario ya existe" });
    }

    //se inserta un registro a la base de datos
    const [result] = await connct.query(
      "INSERT INTO alumno (dni, nombre, passwor) VALUES (?,?,?)",
      [dni, nombre, passwor]
    );

    if (result.affectedRows === 1) {
      return res
        .status(200)
        .json({ message: "se creo el usuario", success: true });
    } else {
      return res.status(500).json({
        message: "no se creo el usuario, sos un pelele",
        success: false,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false }); //si da error manda un estado y msj
  }
};

export const createMateria = async (req, res) => {
  try {
    //conectar BD instanciando obj "conexion"
    const connct = await connect();

    //obtener pck de front
    const { id_m, nombre_materia } = req.body;

    const materiaExist = await valida(
      "nombre_materia",
      nombre_materia,
      "materia",
      connct
    );

    console.log("materiaExist", materiaExist);

    //validar dni
    if (materiaExist) {
      return res.status(400).json({ message: "la materia ya existe" });
    }

    //se inserta un registro a la base de datos
    const [result] = await connct.query(
      "INSERT INTO materia (id_m, nombre_materia) VALUES (?,?)",
      [id_m, nombre_materia]
    );

    if (result.affectedRows === 1) {
      return res
        .status(200)
        .json({ message: "se creo la materia", success: true, token: token });
    } else {
      return res.status(500).json({
        message: "no se creo la materia, sos un pelele",
        success: false,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false }); //si da error manda un estado y msj
  }
};

export const cursar = async (req, res) => {
  try {
    // Desestructurar y obtener datos de la request
    const { dni, materia_ids } = req.body; // `materia_ids` es un array de IDs de materias

    // Conectar a la BD
    const conn = await connect();

    // Verificar si el alumno existe
    const [alumno] = await conn.query("SELECT dni FROM alumno WHERE dni = ?", [
      dni,
    ]);
    if (alumno.length === 0) {
      return res
        .status(404)
        .json({ message: "El alumno no existe", success: false });
    }

    // Asociar el alumno a cada materia
    for (const id_m of materia_ids) {
      // Verificar si la relación ya existe
      const [exist] = await conn.query(
        "SELECT * FROM cursar WHERE dni = ? AND id_m = ?",
        [dni, id_m]
      );
      if (exist.length === 0) {
        // Si no existe, crear la relación
        await conn.query("INSERT INTO cursar (dni, id_m) VALUES (?, ?)", [
          dni,
          id_m,
        ]);
      }
    }

    return res
      .status(200)
      .json({ message: "Materias asignadas correctamente", success: true });
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};

//MIDDLEWARE
//autenticar token
export const authToken = (req, res, next) => {
  //verificar si se recibe el token
  const tokenFront = req.headers["authtoken"];
  //vemos si trae info el token
  console.log(tokenFront);
  if (!tokenFront) return res.status(400).json({ message: "no vino el token" });
  //si trae packete el token
  jwt.verify(tokenFront, claveSecreta, (error, payLoad) => {
    if (error) {
      //SI NO ES VALIDO EL TOKEN
      return res.status(400).json({ message: "El token no es valido" });
    } else {
      //EL TOKEN ES VALIDO
      req.payLoad = payLoad;
      next();
    }
  });
};

//dar lista de las materias
export const getMateriasbyDNI = async (req, res) => {
  try {
    // Obtener el dni del payload del token
    const dni = req.payLoad.dni; // Suponiendo que el payload del token tiene un campo 'dni'

    // Conectar a la base de datos
    const conn = await connect();

    // Consultar las materias asociadas al alumno mediante la tabla cursar
    const q = `
      SELECT m.id_m, m.nombre_materia 
      FROM cursar AS c 
      INNER JOIN materia AS m ON c.id_m = m.id_m 
      WHERE c.dni = ?`;

    const [materias] = await conn.query(q, [dni]);

    // Verificar si se encontraron materias
    if (materias.length > 0) {
      return res.status(200).json(materias);
    } else {
      return res.status(404).json({
        message: "No se encontraron materias para este alumno",
        success: false,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message, success: false });
  }
};
