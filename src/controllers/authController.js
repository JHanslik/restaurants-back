const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Fonction utilitaire pour créer un token JWT
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "votre-secret-temporaire",
    { expiresIn: "24h" }
  );
};

exports.register = async (req, res) => {
  try {
    const { email, password, nom, prenom } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    // Créer le nouvel utilisateur
    const user = new User({
      email,
      password,
      nom,
      prenom,
    });

    await user.save();

    // Générer le token
    const token = generateToken(user._id);

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de l'inscription",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    // Vérifier le mot de passe
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res
        .status(401)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    // Générer le token
    const token = generateToken(user._id);

    res.json({
      message: "Connexion réussie",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la connexion",
      error: error.message,
    });
  }
};
