const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    // Récupérer le token du header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentification requise" });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Trouver l'utilisateur
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Compte désactivé" });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token invalide" });
  }
};

module.exports = auth;
