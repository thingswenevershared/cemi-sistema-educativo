// backend/routes/aulas.js
import express from "express";
import pool from "../utils/db.js";

const router = express.Router();

// Obtener todas las aulas
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Aulas ORDER BY nombre_aula");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener aulas" });
  }
});

// Crear nueva aula
router.post("/", async (req, res) => {
  try {
    const { nombre_aula, capacidad } = req.body;
    
    const [result] = await pool.query(
      "INSERT INTO Aulas (nombre_aula, capacidad) VALUES (?, ?)",
      [nombre_aula, capacidad]
    );
    
    res.status(201).json({ 
      success: true,
      message: "Aula creada exitosamente",
      id: result.insertId 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error al crear aula" 
    });
  }
});

// Actualizar aula
router.put("/:id", async (req, res) => {
  try {
    const { nombre_aula, capacidad } = req.body;
    
    await pool.query(
      "UPDATE Aulas SET nombre_aula = ?, capacidad = ? WHERE id_aula = ?",
      [nombre_aula, capacidad, req.params.id]
    );
    
    res.json({ 
      success: true,
      message: "Aula actualizada exitosamente" 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error al actualizar aula" 
    });
  }
});

// Eliminar aula
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM Aulas WHERE id_aula = ?", [req.params.id]);
    
    res.json({ 
      success: true,
      message: "Aula eliminada exitosamente" 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Error al eliminar aula" 
    });
  }
});

export default router;
